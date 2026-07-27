// Supabase Edge Function: wird per pg_cron einmal pro Minute aufgerufen
// (siehe Migration 0032_erinnerungs_versand.sql) und verschickt fällige
// Web-Push-Erinnerungen — im Gegensatz zu send-push (manueller Test-Button,
// pro angemeldetem Nutzer) hier serverseitig über ALLE Nutzer hinweg, mit
// dem Service-Role-Key statt einem Nutzer-JWT.
//
// Deckt ab: Hydration (eigene Uhrzeiten-Liste in profiles.erinnerungen.
// hydration.zeiten), Peptide/Medikamente/Supplemente (eigene Dosierungs-/
// Intervall-Spalten, siehe protocol_peptide/hormones/supplements) und
// Gewohnheiten (feste Uhrzeit, siehe routines). Jede dieser 5 Kategorien
// wird nur geprüft, wenn profiles.erinnerungen[kategorie] für den
// jeweiligen Nutzer aktiv ist (siehe ErinnerungField.jsx / MehrTab.jsx).
//
// Noch NICHT abgedeckt (bewusst zurückgestellt, siehe UEBERGABEPROTOKOLL.md):
// Training/Ernährung (Wochenplan-basiert, andere Datenstruktur) und
// Tageslicht/Schlaf (aktuell keine Uhrzeit pro Eintrag hinterlegt, ohne
// die gibt's nichts, wozu man serverseitig "fällig" sagen könnte).
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

// Liefert das aktuelle lokale Datum als "YYYY-MM-DD" — für den Abgleich mit
// einem optionalen "startDatum"/eigenen Startdatum je Erinnerung.
function lokalesDatum(zeitzone: string): string | null {
  try {
    const teile = new Intl.DateTimeFormat("en-CA", {
      timeZone: zeitzone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const jahr = teile.find((t) => t.type === "year")?.value;
    const monat = teile.find((t) => t.type === "month")?.value;
    const tag = teile.find((t) => t.type === "day")?.value;
    if (!jahr || !monat || !tag) return null;
    return `${jahr}-${monat}-${tag}`;
  } catch {
    return null;
  }
}

const WEEKDAY_INDEX: Record<string, number> = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };

// Portierung von faelltAnTag() aus src/utils/schedule.js (Client) — dieselbe
// Intervall-Logik (fixed/custom/cycle/weekdays), damit serverseitiger
// Versand und die Tagesplan-Anzeige im Browser nie auseinanderlaufen.
// Beide Datumswerte sind reine "YYYY-MM-DD"-Strings, absichtlich OHNE
// Uhrzeit-Suffix an `new Date()` übergeben (wird laut Spezifikation als
// UTC-Mitternacht geparst) — so bleibt die Tagesdifferenz unabhängig von
// der Zeitzone, in der diese Funktion selbst läuft.
type Intervall = {
  intervall_mode?: string | null;
  intervall_days?: number | null;
  custom_days?: number | null;
  on_days?: number | null;
  off_days?: number | null;
  weekdays?: string[] | null;
  eigener_start?: string | null;
};

function faelltAnTag(d: Intervall, heuteDatum: string): boolean {
  const mode = d.intervall_mode || "fixed";

  if (mode === "weekdays") {
    const heute = new Date(heuteDatum);
    const wanted = new Set((d.weekdays || []).map((w) => WEEKDAY_INDEX[w]));
    return wanted.size === 0 || wanted.has(heute.getUTCDay());
  }

  if (!d.eigener_start) return true;
  const heute = new Date(heuteDatum);
  const start = new Date(d.eigener_start);
  if (heute < start) return false;
  const n = Math.round((heute.getTime() - start.getTime()) / 86400000);

  if (mode === "cycle") {
    const on = Math.max(1, Number(d.on_days) || 1);
    const off = Math.max(0, Number(d.off_days) || 0);
    return n % (on + off) < on;
  }

  const days = mode === "custom" ? Math.max(1, Number(d.custom_days) || 1) : Math.max(1, Number(d.intervall_days) || 1);
  return n % days === 0;
}

type NutzerInfo = { zeitzone: string; jetzt: string; heute: string; erinnerungen: Record<string, unknown> };

// Sammelt fällige Einzel-Erinnerungen pro Nutzer — mehrere gleichzeitig
// fällige Einträge (z. B. zwei Supplemente zur selben Minute, oder
// Hydration + Peptid im selben Moment) landen in EINER Push-Nachricht statt
// mehrerer, damit niemand mit einer Flut von Benachrichtigungen bombardiert
// wird.
const faellig = new Map<string, { icon: string; zeile: string }[]>();
function merken(userId: string, icon: string, zeile: string) {
  const liste = faellig.get(userId) || [];
  liste.push({ icon, zeile });
  faellig.set(userId, liste);
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

    const nutzerInfo = new Map<string, NutzerInfo>();
    for (const profile of profiles || []) {
      const zeitzone = profile.zeitzone;
      if (!zeitzone) continue; // Noch nie eingeloggt seit Einführung der Zeitzone — überspringen statt zu raten.
      const jetzt = lokaleUhrzeit(zeitzone);
      const heute = lokalesDatum(zeitzone);
      if (!jetzt || !heute) continue;
      nutzerInfo.set(profile.id, { zeitzone, jetzt, heute, erinnerungen: profile.erinnerungen || {} });
    }

    // --- Hydration: eigene Uhrzeiten-Liste statt Intervall-Logik ---------
    for (const [userId, info] of nutzerInfo) {
      const hydration = info.erinnerungen.hydration as { aktiv?: boolean; zeiten?: { zeit?: string; menge?: string; startDatum?: string }[] } | undefined;
      if (!hydration?.aktiv || !Array.isArray(hydration.zeiten)) continue;
      const treffer = hydration.zeiten.filter((z) => z.zeit === info.jetzt && (!z.startDatum || z.startDatum <= info.heute));
      if (treffer.length === 0) continue;
      const mengen = treffer.map((z) => z.menge).filter(Boolean);
      merken(userId, "💧", mengen.length > 0 ? `Trinken: ${mengen.join(", ")}` : "Zeit zu trinken");
    }

    // --- Peptide/Medikamente/Supplemente: gemeinsames Dosierungsschema --
    const DOSIERUNGS_KATEGORIEN: { kategorie: string; table: string; icon: string; einheit: string }[] = [
      { kategorie: "peptide", table: "protocol_peptide", icon: "🧬", einheit: "Peptid" },
      { kategorie: "medikamente", table: "hormones", icon: "💊", einheit: "Medikament" },
      { kategorie: "supplemente", table: "supplements", icon: "🟡", einheit: "Supplement" },
    ];
    for (const { kategorie, table, icon, einheit } of DOSIERUNGS_KATEGORIEN) {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen[kategorie]).map(([id]) => id);
      if (userIds.length === 0) continue;
      const { data: rows, error } = await admin
        .from(table)
        .select("user_id, name, menge, intervall_mode, intervall_days, custom_days, on_days, off_days, weekdays, eigener_start, uhrzeiten")
        .in("user_id", userIds);
      if (error) {
        console.error(`Abfrage ${table} fehlgeschlagen:`, error);
        continue;
      }
      for (const row of rows || []) {
        const info = nutzerInfo.get(row.user_id);
        if (!info) continue;
        if (!Array.isArray(row.uhrzeiten) || !row.uhrzeiten.includes(info.jetzt)) continue;
        if (!faelltAnTag(row, info.heute)) continue;
        merken(row.user_id, icon, row.name ? `${row.name}${row.menge ? ` (${row.menge})` : ""}` : einheit);
      }
    }

    // --- Gewohnheiten: feste Uhrzeit, kein Intervallsystem ---------------
    {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen.gewohnheiten).map(([id]) => id);
      if (userIds.length > 0) {
        const { data: rows, error } = await admin.from("routines").select("user_id, name, uhrzeit").in("user_id", userIds);
        if (error) {
          console.error("Abfrage routines fehlgeschlagen:", error);
        } else {
          for (const row of rows || []) {
            const info = nutzerInfo.get(row.user_id);
            if (!info || !row.uhrzeit) continue;
            const uhrzeitKurz = String(row.uhrzeit).slice(0, 5);
            if (uhrzeitKurz !== info.jetzt) continue;
            merken(row.user_id, "🌱", row.name || "Gewohnheit");
          }
        }
      }
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
      const eintraege = faellig.get(sub.user_id);
      if (!eintraege || eintraege.length === 0) continue;
      const titel = eintraege.length === 1 ? `${eintraege[0].icon} Erinnerung` : `🔔 ${eintraege.length} Erinnerungen`;
      const body = eintraege.map((e) => e.zeile).join(" · ");
      const payload = JSON.stringify({ title: titel, body, url: "/" });
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
