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

    const { empfaengerId, text } = await req.json();
    if (!empfaengerId) {
      return new Response(JSON.stringify({ error: "Keine Zielperson angegeben." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Serverseitige Team-Prüfung — die RLS-Policy beim Insert der Nachricht
    // selbst hat das zwar schon geprüft, aber diese Funktion läuft mit dem
    // Service-Role-Key (umgeht RLS komplett), deshalb hier zusätzlich
    // explizit gegenchecken, bevor überhaupt push_subscriptions gelesen wird.
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

    const { data: absenderProfil } = await admin.from("profiles").select("vorname").eq("id", user.id).maybeSingle();
    const absenderName = absenderProfil?.vorname || "Ein Team-Mitglied";

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", empfaengerId);
    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      // Kein technischer Fehler — die Zielperson hat einfach keine
      // Push-Erinnerungen aktiviert. Die Nachricht selbst steht trotzdem
      // schon in team_nachrichten und ist beim nächsten App-Öffnen sichtbar.
      return new Response(JSON.stringify({ ok: true, versendet: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title: `💬 ${absenderName}`,
      body: text || "hat dir eine Nachricht geschickt.",
      url: "/",
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
