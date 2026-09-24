// Supabase Edge Function: verschickt eine Push-Benachrichtigung an eine
// Team-Kollegin, ausgelöst von einer anderen Coachee (nicht der Admin) —
// Nutzerinnen-Vorgabe 16.08.: "dass man sich untereinander auch Motivation
// gibt ... Push Nachrichten senden kann". Braucht Service-Role-Zugriff auf
// push_subscriptions der ZIELPERSON, die der aufrufende Nutzer-Client per
// RLS nicht lesen dürfte — deshalb (wie send-due-reminders) mit dem
// Service-Role-Key, ABER erst nach serverseitiger Prüfung per
// gleiches_team(), damit niemand außerhalb des eigenen Teams beliefert
// werden kann. Die Nachricht selbst steht schon in team_nachrichten (RLS-
// geschützt beim Insert durch den Client, siehe useTeamData.js) — diese
// Funktion kümmert sich NUR um den Push-Teil.
// Seit 24.09. auch für den Coach-Chat (coachee_nachrichten): art "coach"
// (Admin → Person, öffnet #/coach-chat) und "an-coach" (Person → Admins).
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

webpush.setVapidDetails("mailto:hello@myprotocols.app", VAPID_PUBLIC_KEY ?? "", VAPID_PRIVATE_KEY ?? "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // art (24.09., Coach-Chat): "team" (Standard, Team-Kolleg:innen),
    // "coach" (Admin schreibt einer Person), "an-coach" (Person schreibt
    // ihrem Coach → an alle Admin-Konten).
    const { empfaengerId, text, art = "team" } = await req.json();
    if (art !== "an-coach" && !empfaengerId) {
      return new Response(JSON.stringify({ error: "Keine Zielperson angegeben." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Serverseitige Prüfung je Art, bevor überhaupt push_subscriptions
    // gelesen werden (Service-Role-Key umgeht RLS): "coach" nur für Admins,
    // "team" nur im selben Team; "an-coach" geht immer an die Admin-Konten.
    const { data: absenderProfil } = await admin.from("profiles").select("vorname, is_admin").eq("id", user.id).maybeSingle();
    let empfaenger: string[] = [];
    let titel = "";
    let ziel = "/";
    if (art === "coach") {
      if (!absenderProfil?.is_admin) {
        return new Response(JSON.stringify({ error: "Nur für Coaches." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      empfaenger = [empfaengerId];
      titel = "💬 Dein Coach";
      ziel = "/#/coach-chat";
    } else if (art === "an-coach") {
      const { data: admins, error: adminsError } = await admin.from("profiles").select("id").eq("is_admin", true);
      if (adminsError) throw adminsError;
      empfaenger = (admins || []).map((a) => a.id).filter((id) => id !== user.id);
      titel = `💬 ${absenderProfil?.vorname || "Eine Person"}`;
      ziel = "/#/admin-uebersicht";
    } else {
      const { data: gleichesTeam, error: teamError } = await admin.rpc("gleiches_team", {
        a: user.id,
        b: empfaengerId,
      });
      if (teamError) throw teamError;
      if (!gleichesTeam) {
        return new Response(JSON.stringify({ error: "Nur an Team-Kolleg:innen möglich." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      empfaenger = [empfaengerId];
      titel = `💬 ${absenderProfil?.vorname || "Ein Team-Mitglied"}`;
    }
    if (empfaenger.length === 0) {
      return new Response(JSON.stringify({ ok: true, versendet: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .in("user_id", empfaenger);
    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      // Kein technischer Fehler — die Zielperson hat einfach keine
      // Push-Erinnerungen aktiviert. Die Nachricht selbst steht trotzdem
      // schon in team_nachrichten und ist beim nächsten App-Öffnen sichtbar.
      return new Response(JSON.stringify({ ok: true, versendet: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const kurz = text && text.length > 120 ? `${text.slice(0, 117)}…` : text;
    const payload = JSON.stringify({
      title: titel,
      body: kurz || "hat dir eine Nachricht geschickt.",
      url: ziel,
    });

    let versendet = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
        versendet++;
      } catch (err) {
        console.error("Push fehlgeschlagen für Endpoint:", sub.endpoint, err);
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, versendet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
