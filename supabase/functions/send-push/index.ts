// Supabase Edge Function: verschickt eine Web-Push-Benachrichtigung an alle
// registrierten Geräte des angemeldeten Nutzers. Deckt aktuell den manuellen
// Test-Button in "Mehr" ab; der automatische, zeitgesteuerte Versand (per
// pg_cron ausgelöst) ist als nächster Schritt geplant und wird eine eigene,
// mit dem Service-Role-Key abgesicherte Variante dieser Sendefunktion nutzen.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendeAnGeraet } from "../_shared/push.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

    const { title, body, url } = await req.json();

    const { data: subs, error: subsError } = await userClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", user.id);
    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: "Keine aktive Erinnerung auf diesem Gerät eingerichtet." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inhalt = { title: title || "AKA", body: body || "", url: url || "/" };

    let versendet = 0;
    for (const sub of subs) {
      const ergebnis = await sendeAnGeraet(sub, inhalt);
      if (ergebnis === "ok") versendet++;
      // Abgelaufenes/ungültiges Abo (z. B. Browser-Daten gelöscht, App
      // gelöscht) — aufräumen, damit künftige Versuche nicht daran scheitern.
      else if (ergebnis === "ungueltig") await userClient.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }

    if (versendet === 0) {
      return new Response(JSON.stringify({ error: "Senden an alle Geräte fehlgeschlagen." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
