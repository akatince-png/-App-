// Supabase Edge Function: wird per pg_cron einmal pro Minute aufgerufen
// (siehe Migration 0032_erinnerungs_versand.sql) und verschickt fällige
// Web-Push-Erinnerungen — im Gegensatz zu send-push (manueller Test-Button,
// pro angemeldetem Nutzer) hier serverseitig über ALLE Nutzer hinweg, mit
// dem Service-Role-Key statt einem Nutzer-JWT.
//
// Deckt jetzt alle 9 Lebensbereiche ab:
// - Eigene Uhrzeiten-Liste (profiles.erinnerungen[kategorie].zeiten, frei
//   von der Person gepflegt über ZeitErinnerungenCard.jsx): Hydration,
//   Tageslicht, Schlaf — Kategorien mit kumulativem Tageswert statt
//   Einzeltermin, daher ohne eigenes "geplant vs. erledigt"-Paar.
// - Dosierungs-/Intervall-Spalten (protocol_peptide/hormones/supplements):
//   Peptide, Medikamente, Supplemente.
// - Feste Uhrzeit ohne Intervallsystem (routines): Gewohnheiten.
// - Wochenplan mit Uhrzeit (training_wochenplan/meal_wochenplan): Training,
//   Ernährung.
// Jede Kategorie wird nur geprüft, wenn profiles.erinnerungen[kategorie]
// für den jeweiligen Nutzer aktiv ist (siehe ErinnerungField.jsx/
// ZeitErinnerungenCard.jsx/MehrTab.jsx). Training zusätzlich pro Zeile
// abschaltbar über training_wochenplan.erinnerung_aktiv (siehe
// WochenplanEditor.jsx) — Nutzerin-Vorgabe, 14.08.: einzelne Trainingstage
// sollen sich von den restlichen abweichend stummschalten lassen, nicht nur
// alle auf einmal über den globalen Schalter.
//
// Drei Arten von Erinnerungen pro Kategorie (die reine Zeiten-Liste
// Hydration/Tageslicht/Schlaf nur die ersten zwei, da dort keine einzelne
// bestätigbare Aktion mit eigenem erledigt-Log existiert):
//   1. Zur geplanten Uhrzeit selbst.
//   2. Vorab, VORLAUF_MINUTEN vorher ("Gleich dran").
//   3. Nachfass, NACHFASS_MINUTEN danach, aber nur wenn bis dahin noch
//      nicht bestätigt wurde (Abgleich gegen peptide_logs/hormone_logs/
//      supplement_logs/routine_logs/training_sessions/meal_logs für den
//      heutigen Tag).
// Beide Zeitfenster sind bewusst als feste Werte statt pro Nutzer/Kategorie
// konfigurierbar gehalten — laut Übergabeprotokoll ein deklarierter erster
// Schritt, kein Anspruch auf die volle "10-30 Min., je nach Kontext"-Vision.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
// Für den automatischen Spotify-Start bei Bettzeit unten — dieselben Werte
// wie bei spotify-play/spotify-auth-callback, hier zusätzlich als Secret
// hinterlegen (Dashboard → Edge Functions → send-due-reminders → Secrets).
const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

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
// Umkehrung von WEEKDAY_INDEX — Postgres getUTCDay() (0=So..6=Sa) auf das
// im Wochenplan verwendete Kürzel zurückführen (training_wochenplan/
// meal_wochenplan, beide ohne Intervall-System, nur "an welchem Wochentag").
const WEEKDAY_NAMEN = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

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

// Erneuert das Spotify-Access-Token bei Bedarf über das gespeicherte
// Refresh-Token — Portierung von frischesAccessToken() aus
// supabase/functions/spotify-play/index.ts, damit der automatische
// Bettzeit-Start unten nicht auf einen Umweg über diese Function angewiesen
// ist (spart einen zusätzlichen HTTP-Hop bei jedem Cron-Tick).
async function frischesSpotifyToken(admin: ReturnType<typeof createClient>, verbindung: Record<string, unknown>) {
  const nochGueltig =
    verbindung.token_laeuft_ab && new Date(verbindung.token_laeuft_ab as string).getTime() - Date.now() > 60_000;
  if (nochGueltig) return verbindung.access_token as string;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: verbindung.refresh_token as string }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error_description || "Spotify-Token konnte nicht erneuert werden.");

  const ablauf = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  await admin
    .from("spotify_verbindung")
    .update({ access_token: tokenData.access_token, token_laeuft_ab: ablauf, ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}) })
    .eq("user_id", verbindung.user_id as string);

  return tokenData.access_token as string;
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

    // --- Hydration/Tageslicht/Schlaf: eigene Uhrzeiten-Liste statt ------
    // Intervall-Logik (ZeitErinnerungenCard.jsx) — kumulative Tageswerte
    // ohne Einzeltermin, daher nur Erinnerung + Vorab-Erinnerung, kein
    // Nachfass-Fenster (keine bestätigbare Einzelaktion mit eigenem Log).
    const ZEITEN_KATEGORIEN: { kategorie: string; icon: string; einheit: string; mitMenge: boolean }[] = [
      { kategorie: "hydration", icon: "💧", einheit: "Trinken", mitMenge: true },
      { kategorie: "tageslicht", icon: "☀️", einheit: "Tageslicht/Raus gehen", mitMenge: false },
      { kategorie: "schlaf", icon: "🌙", einheit: "Schlafenszeit", mitMenge: false },
    ];
    for (const zk of ZEITEN_KATEGORIEN) {
      for (const [userId, info] of nutzerInfo) {
        const einstellung = info.erinnerungen[zk.kategorie] as { aktiv?: boolean; zeiten?: { zeit?: string; menge?: string; startDatum?: string }[] } | undefined;
        if (!einstellung?.aktiv || !Array.isArray(einstellung.zeiten)) continue;

        const treffer = einstellung.zeiten.filter((z) => z.zeit === info.jetzt && (!z.startDatum || z.startDatum <= info.heute));
        if (treffer.length > 0) {
          const mengen = zk.mitMenge ? treffer.map((z) => z.menge).filter(Boolean) : [];
          merken(userId, zk.icon, mengen.length > 0 ? `${zk.einheit}: ${mengen.join(", ")}` : zk.einheit);
        }

        const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
        if (vorabZiel) {
          const vorabTreffer = einstellung.zeiten.filter((z) => z.zeit === vorabZiel && (!z.startDatum || z.startDatum <= info.heute));
          if (vorabTreffer.length > 0) {
            const mengen = zk.mitMenge ? vorabTreffer.map((z) => z.menge).filter(Boolean) : [];
            merken(userId, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): ${zk.einheit}${mengen.length > 0 ? ` (${mengen.join(", ")})` : ""}`);
          }
        }
      }
    }

    // --- Schlaf: automatischer Spotify-Start bei Bettzeit (15.08., --------
    // Nutzerin-Vorgabe) — eine Minute NACH der oben konfigurierten
    // Schlafenszeit (nicht zeitgleich mit der Push-Erinnerung), FALLS über
    // SpotifyAnlassPicker(anlass="schlaf") in SchlafView.jsx eine Playlist
    // zugeordnet wurde (z. B. Regengeräusche). Zuordnung = Aktivierung,
    // kein separater Schalter. Läuft unabhängig davon, ob die App gerade
    // offen ist — anders als die anderen Anlässe (die beim Öffnen der
    // jeweiligen Ansicht im Browser starten), da nachts niemand die App
    // offen hat.
    if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
      const schlafUserIds = [...nutzerInfo]
        .filter(([, info]) => {
          const einstellung = info.erinnerungen.schlaf as { aktiv?: boolean; zeiten?: { zeit?: string; startDatum?: string }[] } | undefined;
          return einstellung?.aktiv && Array.isArray(einstellung.zeiten) && einstellung.zeiten.length > 0;
        })
        .map(([id]) => id);

      if (schlafUserIds.length > 0) {
        const { data: anlaesse, error: anlassError } = await admin
          .from("spotify_anlass_playlists")
          .select("user_id, spotify_playlists(uri)")
          .eq("anlass", "schlaf")
          .in("user_id", schlafUserIds);
        if (anlassError) console.error("Abfrage spotify_anlass_playlists (schlaf) fehlgeschlagen:", anlassError);

        const playlistUriByUser = new Map(
          (anlaesse || [])
            .filter((a) => (a.spotify_playlists as { uri?: string } | null)?.uri)
            .map((a) => [a.user_id as string, (a.spotify_playlists as { uri: string }).uri])
        );

        if (playlistUriByUser.size > 0) {
          const { data: verbindungen, error: verbindungError } = await admin
            .from("spotify_verbindung")
            .select("*")
            .in("user_id", [...playlistUriByUser.keys()]);
          if (verbindungError) console.error("Abfrage spotify_verbindung (schlaf-auto-play) fehlgeschlagen:", verbindungError);

          for (const verbindung of verbindungen || []) {
            const info = nutzerInfo.get(verbindung.user_id as string);
            const uri = playlistUriByUser.get(verbindung.user_id as string);
            if (!info || !uri) continue;
            const einstellung = info.erinnerungen.schlaf as { zeiten: { zeit: string; startDatum?: string }[] };
            const treffer = einstellung.zeiten.some(
              (z) => z.zeit && verschobeneUhrzeit(z.zeit, 1) === info.jetzt && (!z.startDatum || z.startDatum <= info.heute)
            );
            if (!treffer) continue;

            try {
              const accessToken = await frischesSpotifyToken(admin, verbindung);
              const playRes = await fetch("https://api.spotify.com/v1/me/player/play", {
                method: "PUT",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ context_uri: uri }),
              });
              // 404 = kein aktives Spotify-Gerät (z. B. Handy/Tablet gesperrt) —
              // kein harter Fehler, niemand kann nachts noch eingreifen.
              if (playRes.status !== 204 && playRes.status !== 404) {
                console.error("Automatischer Spotify-Start (Schlaf) abgelehnt für", verbindung.user_id, await playRes.text());
              }
            } catch (err) {
              console.error("Automatischer Spotify-Start (Schlaf) fehlgeschlagen für", verbindung.user_id, err);
            }
          }
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

    // --- Training: Wochenplan mit Uhrzeit, aber ohne Intervallsystem ----
    // (training_wochenplan: höchstens ein Eintrag pro Wochentag). Nachfass-
    // Check gegen training_sessions (kein direkter Fremdschlüssel zum
    // Wochenplan-Eintrag — Abgleich über Datum + Trainingsart).
    {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen.training).map(([id]) => id);
      if (userIds.length > 0) {
        const { data: rows, error } = await admin
          .from("training_wochenplan")
          .select("user_id, wochentag, art, uhrzeit, erinnerung_aktiv")
          .in("user_id", userIds);
        if (error) {
          console.error("Abfrage training_wochenplan fehlgeschlagen:", error);
        } else {
          const heuteWerte = [...new Set(userIds.map((id) => nutzerInfo.get(id)!.heute))];
          const { data: logs, error: logError } = await admin
            .from("training_sessions")
            .select("user_id, datum, art")
            .in("user_id", userIds)
            .in("datum", heuteWerte);
          if (logError) console.error("Abfrage training_sessions fehlgeschlagen:", logError);
          const erledigtSet = new Set((logs || []).map((log) => `${log.user_id}__${log.datum}__${log.art}`));

          for (const row of rows || []) {
            const info = nutzerInfo.get(row.user_id);
            if (!info || !row.uhrzeit) continue;
            if (row.erinnerung_aktiv === false) continue; // Pro Einheit abschaltbar (14.08., Nutzerin-Vorgabe), unabhängig vom globalen Schalter.
            if (row.wochentag !== WEEKDAY_NAMEN[new Date(info.heute).getUTCDay()]) continue;
            const uhrzeitKurz = String(row.uhrzeit).slice(0, 5);
            const name = row.art || "Training";

            if (uhrzeitKurz === info.jetzt) merken(row.user_id, "🏋️", name);

            const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
            if (vorabZiel && uhrzeitKurz === vorabZiel) {
              merken(row.user_id, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): ${name}`);
            }

            const nachfassZiel = verschobeneUhrzeit(info.jetzt, -NACHFASS_MINUTEN);
            if (nachfassZiel && uhrzeitKurz === nachfassZiel && !erledigtSet.has(`${row.user_id}__${info.heute}__${row.art}`)) {
              merken(row.user_id, "❗", `Noch offen: ${name} (${NACHFASS_MINUTEN} Min. überfällig)`);
            }
          }
        }
      }
    }

    // --- Ernährung: Wochenplan mit Uhrzeit pro Mahlzeit -------------------
    // (meal_wochenplan, beliebig viele Mahlzeiten pro Tag normal). Name
    // separat über meals nachgeschlagen statt per Embedded-Join, um keine
    // Annahmen über die genaue PostgREST-Join-Form treffen zu müssen.
    {
      const userIds = [...nutzerInfo].filter(([, info]) => info.erinnerungen.ernaehrung).map(([id]) => id);
      if (userIds.length > 0) {
        const { data: rows, error } = await admin
          .from("meal_wochenplan")
          .select("user_id, wochentag, uhrzeit, meal_id")
          .in("user_id", userIds);
        if (error) {
          console.error("Abfrage meal_wochenplan fehlgeschlagen:", error);
        } else {
          const mealIds = [...new Set((rows || []).map((r) => r.meal_id))];
          const { data: meals, error: mealsError } = mealIds.length
            ? await admin.from("meals").select("id, name").in("id", mealIds)
            : { data: [] as { id: string; name: string }[], error: null };
          if (mealsError) console.error("Abfrage meals fehlgeschlagen:", mealsError);
          const nameByMealId = new Map((meals || []).map((m) => [m.id, m.name]));

          const heuteWerte = [...new Set(userIds.map((id) => nutzerInfo.get(id)!.heute))];
          const { data: logs, error: logError } = await admin
            .from("meal_logs")
            .select("meal_id, log_date, tageszeit")
            .in("user_id", userIds)
            .in("log_date", heuteWerte)
            .eq("erledigt", true);
          if (logError) console.error("Abfrage meal_logs fehlgeschlagen:", logError);
          const erledigtSet = new Set((logs || []).map((log) => `${log.meal_id}__${log.log_date}__${log.tageszeit}`));

          for (const row of rows || []) {
            const info = nutzerInfo.get(row.user_id);
            if (!info || !row.uhrzeit) continue;
            if (row.wochentag !== WEEKDAY_NAMEN[new Date(info.heute).getUTCDay()]) continue;
            const uhrzeitKurz = String(row.uhrzeit).slice(0, 5);
            const name = nameByMealId.get(row.meal_id) || "Mahlzeit";

            if (uhrzeitKurz === info.jetzt) merken(row.user_id, "🍽️", name);

            const vorabZiel = verschobeneUhrzeit(info.jetzt, VORLAUF_MINUTEN);
            if (vorabZiel && uhrzeitKurz === vorabZiel) {
              merken(row.user_id, "⏳", `Gleich dran (${VORLAUF_MINUTEN} Min.): ${name}`);
            }

            const nachfassZiel = verschobeneUhrzeit(info.jetzt, -NACHFASS_MINUTEN);
            if (nachfassZiel && uhrzeitKurz === nachfassZiel && !erledigtSet.has(`${row.meal_id}__${info.heute}__${uhrzeitKurz}`)) {
              merken(row.user_id, "❗", `Noch offen: ${name} (${NACHFASS_MINUTEN} Min. überfällig)`);
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
