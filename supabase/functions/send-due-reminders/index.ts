// Supabase Edge Function: wird per pg_cron einmal pro Minute aufgerufen
// (siehe Migration 0032_erinnerungs_versand.sql) und verschickt fällige
// Web-Push-Erinnerungen — im Gegensatz zu send-push (manueller Test-Button,
// pro angemeldetem Nutzer) hier serverseitig über ALLE Nutzer hinweg, mit
// dem Service-Role-Key statt einem Nutzer-JWT.
//
// Deckt aktuell nur Hydration ab (profiles.erinnerungen.hydration =
// { aktiv, zeiten: [{ zeit: "HH:MM", menge }] }) — das einzige Erinnerungs-
// Feld mit einer eigenen, festen Uhrzeitliste. Andere Kategorien
// (Gewohnheiten/Supplemente/Medikamente/Peptide/Training) haben ihre
// Uhrzeiten noch verteilt in eigenen Tabellen mit eigener Intervall-Logik
// (siehe schedule.ts/dayItems.js) — deren serverseitige Nachbildung ist ein
// eigener, größerer Ausbauschritt.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

webpush.setVapidDetails("mailto:hello@myprotocols.app", VAPID_PUBLIC_KEY ?? "", VAPID_PRIVATE_KEY ?? "");

// Liefert die aktuelle lokale Uhrzeit als "HH:MM" in der übergebenen
// IANA-Zeitzone — Intl statt manueller Offset-Rechnung, damit Sommer-/
// Winterzeit automatisch stimmt.
function lokaleUhrzeit(zeitzone: string): string | null {
  try {
    const teile = new Intl.DateTimeFormat("en-GB", {
      timeZone: zeitzone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const stunde = teile.find((t) => t.type === "hour")?.value;
    const minute = teile.find((t) => t.type === "minute")?.value;
    if (!stunde || !minute) return null;
    return `${stunde}:${minute}`;
  } catch {
    return null; // Unbekannte/ungültige Zeitzone
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  // Kein Nutzer-Login hier — nur der Cron-Job darf das auslösen.
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Nicht autorisiert." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, zeitzone, erinnerungen");
    if (profilesError) throw profilesError;

    // Pro fälligem Nutzer sammeln, WELCHE Erinnerung(en) gerade dran sind
    // (z. B. mehrere Trinkzeiten auf dieselbe Minute), für eine sprechende
    // Nachricht statt nur "irgendwas ist fällig".
    const faellig = new Map<string, { titel: string; body: string }>();

    for (const profile of profiles || []) {
      const zeitzone = profile.zeitzone;
      if (!zeitzone) continue; // Noch nie eingeloggt seit Einführung der Zeitzone — überspringen statt zu raten.
      const hydration = profile.erinnerungen?.hydration;
      if (!hydration?.aktiv || !Array.isArray(hydration.zeiten) || hydration.zeiten.length === 0) continue;

      const jetzt = lokaleUhrzeit(zeitzone);
      if (!jetzt) continue;

      const treffer = hydration.zeiten.filter((z: { zeit?: string }) => z.zeit === jetzt);
      if (treffer.length === 0) continue;

      const mengen = treffer.map((z: { menge?: string }) => z.menge).filter(Boolean);
      faellig.set(profile.id, {
        titel: "💧 Zeit zu trinken",
        body: mengen.length > 0 ? `Erinnerung: ${mengen.join(", ")} Wasser.` : "Zeit für deine nächste Portion Wasser.",
      });
    }

    if (faellig.size === 0) {
      return new Response(JSON.stringify({ ok: true, faellig: 0, versendet: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth_key")
      .in("user_id", [...faellig.keys()]);
    if (subsError) throw subsError;

    let versendet = 0;
    for (const sub of subs || []) {
      const nachricht = faellig.get(sub.user_id);
      if (!nachricht) continue;
      const payload = JSON.stringify({ title: nachricht.titel, body: nachricht.body, url: "/" });
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

    return new Response(JSON.stringify({ ok: true, faellig: faellig.size, versendet }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
