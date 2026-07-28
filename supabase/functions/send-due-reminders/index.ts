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
// Drei Arten von Erinnerungen pro Kategorie (Hydration nur die ersten zwei,
// da "trinken" keine bestätigbare Einzelaktion mit eigenem erledigt-Log
// ist):
//   1. Zur geplanten Uhrzeit selbst.
//   2. Vorab, VORLAUF_MINUTEN vorher ("Gleich dran").
//   3. Nachfass, NACHFASS_MINUTEN danach, aber nur wenn bis dahin noch
//      nicht bestätigt wurde (Abgleich gegen peptide_logs/hormone_logs/
//      supplement_logs/routine_logs für den heutigen Tag).
// Beide Zeitfenster sind bewusst als feste Werte statt pro Nutzer/Kategorie
// konfigurierbar gehalten — laut Übergabeprotokoll ein deklarierter erster
// Schritt, kein Anspruch auf die volle "10-30 Min., je nach Kontext"-Vision.
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

const VORLAUF_MINUTEN = 15;
const NACHFASS_MINUTEN = 10;

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

// Verschiebt eine "HH:MM"-Uhrzeit um deltaMinuten (auch negativ), mit
// Wraparound über Mitternacht — genügt hier, weil wir nur auf Gleichheit
// mit fest hinterlegten Uhrzeiten prüfen, nicht auf das genaue Datum.
function verschobeneUhrzeit(uhrzeit: string, deltaMinuten: number): string | null {
  const [h, m] = uhrzeit.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const total = (((h * 60 + m + deltaMinuten) % 1440) + 1440) % 1440;
  const stunde = String(Math.floor(total / 60)).padStart(2, "0");
  const minute = String(total % 60).padStart(2, "0");
  return `${stunde}:${minute}`;
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

// Gemeinsames Schema für Peptide/Medikamente/Supplemente: Stammdaten-Tabelle
// mit uhrzeiten-Array + Intervall-Logik, dazugehörige *_logs-Tabelle mit
// eigenem Schlüssel für "an diesem Datum/dieser Uhrzeit schon bestätigt?".
type DosierungsKategorie = {
  kategorie: string;
  table: string;
  icon: string;
  einheit: string;
  logTable: string;
  logDateSpalte: string;
  logSchluessel: (log: Record<string, unknown>) => string;
  rowSchluessel: (row: Record<string, unknown>, uhrzeit: string, datum: string) => string;
};

const DOSIERUNGS_KATEGORIEN: DosierungsKategorie[] = [
  {
    kategorie: "peptide",
    table: "protocol_peptide",
    icon: "🧬",
    einheit: "Peptid",
    logTable: "peptide_logs",
    logDateSpalte: "dose_date",
    logSchluessel: (log) => `${log.protocol_id}__${log.peptid_name}__${log.dose_date}__${log.uhrzeit}`,
    rowSchluessel: (row, uhrzeit, datum) => `${row.protocol_id}__${row.name}__${datum}__${uhrzeit}`,
  },
  {
    kategorie: "medikamente",
    table: "hormones",
    icon: "💊",
    einheit: "Medikament",
    logTable: "hormone_logs",
    logDateSpalte: "dose_date",
    logSchluessel: (log) => `${log.user_id}__${log.hormone_name}__${log.dose_date}__${log.uhrzeit}`,
    rowSchluessel: (row, uhrzeit, datum) => `${row.user_id}__${row.name}__${datum}__${uhrzeit}`,
  },
  {
    kategorie: "supplemente",
    table: "supplements",
    icon: "🟡",
    einheit: "Supplement",
    logTable: "supplement_logs",
    logDateSpalte: "log_date",
    logSchluessel: (log) => `${log.supplement_id}__${log.log_date}__${log.tageszeit}`,
    rowSchluessel: (row, uhrzeit, datum) => `${row.id}__${datum}__${uhrzeit}`,
  },
];

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
    // Isolate kann zwischen Cron-Ticks warmgehalten werden — Map explizit
    // leeren, sonst würden sich Einträge über mehrere Minuten hinweg
    // ansammeln statt nur den aktuellen Durchlauf abzubilden.
    faellig.clear();

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
    // Nur Erinnerung + Vorab-Erinnerung — "trinken" ist keine bestätigbare
    // Einzelaktion mit eigenem erledigt-Log, daher kein Nachfass-Fenster.
    for (const [userId, info] of nutzerInfo) {
      const hydration = info.erinnerungen.hydration as { aktiv?: boolean; zeiten?: { zeit?: string; menge?: string; startDatum?: string }[] } | undefined;
      if (!hydration?.aktiv || !Array.isArray(hydration.zeiten)) continue;

      const treffer = hydration.zeiten.filter((z) => z.zeit === info.jetzt && (!z.startDatum || z.startDatum <= info.heute));
      if (treffer.length > 0) {
        const mengen = treffer.map((z) => z.menge).filter(Boolean);
        merken(userId, "💧", mengen.length > 0 ? `Trinken: ${mengen.join(", ")}` : "Zeit zu trinken");
      }

      const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
      if (vorabZiel) {
        const vorabTreffer = hydration.zeiten.filter((z) => z.zeit === vorabZiel && (!z.startDatum || z.startDatum <= info.heute));
        if (vorabTreffer.length > 0) {
          const mengen = vorabTreffer.map((z) => z.menge).filter(Boolean);
          merken(userId, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): Trinken${mengen.length > 0 ? ` (${mengen.join(", ")})` : ""}`);
        }
      }
    }

    // --- Peptide/Medikamente/Supplemente: gemeinsames Dosierungsschema --
    for (const kat of DOSIERUNGS_KATEGORIEN) {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen[kat.kategorie]).map(([id]) => id);
      if (userIds.length === 0) continue;

      const { data: rows, error } = await admin.from(kat.table).select("*").in("user_id", userIds);
      if (error) {
        console.error(`Abfrage ${kat.table} fehlgeschlagen:`, error);
        continue;
      }

      // Für den Nachfass-Check: welche Kombinationen sind für den jeweils
      // "heutigen" Tag (pro Zeitzone) schon bestätigt?
      const heuteWerte = [...new Set(userIds.map((id) => nutzerInfo.get(id)!.heute))];
      const { data: logs, error: logError } = await admin
        .from(kat.logTable)
        .select("*")
        .in("user_id", userIds)
        .in(kat.logDateSpalte, heuteWerte)
        .eq("erledigt", true);
      if (logError) console.error(`Abfrage ${kat.logTable} fehlgeschlagen:`, logError);
      const erledigtSet = new Set((logs || []).map((log) => kat.logSchluessel(log)));

      for (const row of rows || []) {
        const info = nutzerInfo.get(row.user_id);
        if (!info) continue;
        if (!Array.isArray(row.uhrzeiten)) continue;
        if (!faelltAnTag(row, info.heute)) continue;

        if (row.uhrzeiten.includes(info.jetzt)) {
          merken(row.user_id, kat.icon, row.name ? `${row.name}${row.menge ? ` (${row.menge})` : ""}` : kat.einheit);
        }

        const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
        if (vorabZiel && row.uhrzeiten.includes(vorabZiel)) {
          merken(row.user_id, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): ${row.name || kat.einheit}`);
        }

        const nachfassZiel = verschobeneUhrzeit(info.jetzt, -NACHFASS_MINUTEN);
        if (nachfassZiel && row.uhrzeiten.includes(nachfassZiel)) {
          const schluessel = kat.rowSchluessel(row, nachfassZiel, info.heute);
          if (!erledigtSet.has(schluessel)) {
            merken(row.user_id, "❗", `Noch offen: ${row.name || kat.einheit} (${NACHFASS_MINUTEN} Min. überfällig)`);
          }
        }
      }
    }

    // --- Gewohnheiten: feste Uhrzeit, kein Intervallsystem ---------------
    {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen.gewohnheiten).map(([id]) => id);
      if (userIds.length > 0) {
        const { data: rows, error } = await admin.from("routines").select("id, user_id, name, uhrzeit").in("user_id", userIds);
        if (error) {
          console.error("Abfrage routines fehlgeschlagen:", error);
        } else {
          const heuteWerte = [...new Set(userIds.map((id) => nutzerInfo.get(id)!.heute))];
          const { data: logs, error: logError } = await admin
            .from("routine_logs")
            .select("routine_id, log_date")
            .in("user_id", userIds)
            .in("log_date", heuteWerte);
          if (logError) console.error("Abfrage routine_logs fehlgeschlagen:", logError);
          const erledigtSet = new Set((logs || []).map((log) => `${log.routine_id}__${log.log_date}`));

          for (const row of rows || []) {
            const info = nutzerInfo.get(row.user_id);
            if (!info || !row.uhrzeit) continue;
            const uhrzeitKurz = String(row.uhrzeit).slice(0, 5);

            if (uhrzeitKurz === info.jetzt) {
              merken(row.user_id, "🌱", row.name || "Gewohnheit");
            }

            const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
            if (vorabZiel && uhrzeitKurz === vorabZiel) {
              merken(row.user_id, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): ${row.name || "Gewohnheit"}`);
            }

            const nachfassZiel = verschobeneUhrzeit(info.jetzt, -NACHFASS_MINUTEN);
            if (nachfassZiel && uhrzeitKurz === nachfassZiel && !erledigtSet.has(`${row.id}__${info.heute}`)) {
              merken(row.user_id, "❗", `Noch offen: ${row.name || "Gewohnheit"} (${NACHFASS_MINUTEN} Min. überfällig)`);
            }
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
