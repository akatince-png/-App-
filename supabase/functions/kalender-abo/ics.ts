// Kalender-Abo (24.10.): baut aus Routinen-Zeiten, „Mein Alltag“, offenen
// Matrix-Aufgaben und dem Trainings-Wochenplan eine iCalendar-Datei, die der
// Apple-/Google-Kalender abonniert. Reine Logik ohne Deno/Supabase, damit
// sie mit vitest geprüft werden kann (ics.test.ts). Bewusst ohne Notizen
// und ohne Gesundheitsdaten.

export type Routine = { key: "morgen" | "abend"; start: string; ende?: string | null };
export type AlltagEintrag = { id: string; titel: string; datum?: string | null; wochentage?: string[] | null; start: string; ende?: string | null; icon?: string | null };
export type Aufgabe = { id: string; titel: string; geplant_am?: string | null; uhrzeit?: string | null; dauer_min?: number | null; frist?: string | null };
export type Training = { id: string; wochentag: string; uhrzeit?: string | null; name?: string | null; art?: string | null };

export type KalenderDaten = {
  zeitzone?: string | null;
  heute: string; // YYYY-MM-DD in der Zeitzone der Person
  stempel: string; // UTC, z. B. 20261024T180000Z
  routinen?: Routine[];
  alltag?: AlltagEintrag[];
  aufgaben?: Aufgabe[];
  training?: Training[];
};

const BYDAY: Record<string, string> = { Mo: "MO", Di: "TU", Mi: "WE", Do: "TH", Fr: "FR", Sa: "SA", So: "SU" };
const JS_TAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const BERLIN = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Berlin",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function textEscapen(t: string): string {
  return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Zeilen nach RFC 5545 auf höchstens 75 Bytes falten (UTF-8, Emojis!).
export function falten(zeile: string): string {
  const enc = new TextEncoder();
  if (enc.encode(zeile).length <= 75) return zeile;
  const teile: string[] = [];
  let aktuell = "";
  let bytes = 0;
  for (const zeichen of Array.from(zeile)) {
    const b = enc.encode(zeichen).length;
    const grenze = teile.length === 0 ? 75 : 74; // Folgezeilen beginnen mit einem Leerzeichen
    if (bytes + b > grenze) {
      teile.push(aktuell);
      aktuell = "";
      bytes = 0;
    }
    aktuell += zeichen;
    bytes += b;
  }
  teile.push(aktuell);
  return teile.join("\r\n ");
}

const minuten = (hhmm: string | null | undefined): number | null => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

// Datum + Minuten seit Mitternacht → lokale Zeit „YYYYMMDDTHHMMSS“ (über Mitternacht hinaus erlaubt).
export function lokalZeit(datum: string, min: number): string {
  const [j, mo, t] = datum.split("-").map(Number);
  const d = new Date(Date.UTC(j, mo - 1, t, 0, min));
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}T${z(d.getUTCHours())}${z(d.getUTCMinutes())}00`;
}

const datumKompakt = (datum: string) => datum.replace(/-/g, "");

export function plusTage(datum: string, tage: number): string {
  const [j, mo, t] = datum.split("-").map(Number);
  const d = new Date(Date.UTC(j, mo - 1, t + tage));
  return d.toISOString().slice(0, 10);
}

const wochentagVon = (datum: string) => JS_TAG[new Date(`${datum}T12:00:00Z`).getUTCDay()];

// Erster Tag ab `ab`, der auf einen der Wochentage fällt (Anker für RRULE).
export function ersterPassenderTag(ab: string, wochentage: string[]): string | null {
  for (let i = 0; i < 7; i++) {
    const d = plusTage(ab, i);
    if (wochentage.includes(wochentagVon(d))) return d;
  }
  return null;
}

function ereignis(zeilen: string[], { uid, stempel, titel, tz, datum, start, ende, ganztags, rrule }: { uid: string; stempel: string; titel: string; tz: string; datum: string; start?: number; ende?: number; ganztags?: boolean; rrule?: string }) {
  zeilen.push("BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stempel}`, `SUMMARY:${textEscapen(titel)}`);
  if (ganztags || start == null) {
    zeilen.push(`DTSTART;VALUE=DATE:${datumKompakt(datum)}`, `DTEND;VALUE=DATE:${datumKompakt(plusTage(datum, 1))}`);
  } else {
    const e = ende != null && ende > start ? ende : start + 60;
    zeilen.push(`DTSTART;TZID=${tz}:${lokalZeit(datum, start)}`, `DTEND;TZID=${tz}:${lokalZeit(datum, e)}`);
  }
  if (rrule) zeilen.push(`RRULE:${rrule}`);
  zeilen.push("TRANSP:TRANSPARENT", "END:VEVENT");
}

export function kalenderIcs(daten: KalenderDaten): string {
  const tz = daten.zeitzone || "Europe/Berlin";
  const { heute, stempel } = daten;
  const anker = plusTage(heute, -7);
  const z: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AKA//Kalender-Abo//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:AKA", `X-WR-TIMEZONE:${tz}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  if (tz === "Europe/Berlin") z.push(...BERLIN);

  for (const r of daten.routinen || []) {
    const start = minuten(r.start);
    if (start == null) continue;
    const titel = r.key === "morgen" ? "☀️ Morgenroutine" : "🌙 Abendroutine";
    ereignis(z, { uid: `routine-${r.key}@aka`, stempel, titel, tz, datum: anker, start, ende: minuten(r.ende) ?? undefined, rrule: "FREQ=DAILY" });
  }

  for (const e of daten.alltag || []) {
    const start = minuten(e.start);
    if (start == null) continue;
    const titel = e.titel;
    const ende = minuten(e.ende) ?? undefined;
    if (e.datum) {
      ereignis(z, { uid: `alltag-${e.id}@aka`, stempel, titel, tz, datum: e.datum, start, ende });
      continue;
    }
    const tage = (e.wochentage || []).filter((t) => BYDAY[t]);
    const erster = tage.length ? ersterPassenderTag(anker, tage) : null;
    if (!erster) continue;
    ereignis(z, { uid: `alltag-${e.id}@aka`, stempel, titel, tz, datum: erster, start, ende, rrule: `FREQ=WEEKLY;BYDAY=${tage.map((t) => BYDAY[t]).join(",")}` });
  }

  for (const a of daten.aufgaben || []) {
    if (a.geplant_am) {
      const start = minuten(a.uhrzeit);
      ereignis(z, { uid: `aufgabe-${a.id}@aka`, stempel, titel: `📝 ${a.titel}`, tz, datum: a.geplant_am, start: start ?? undefined, ende: start != null ? start + (Number(a.dauer_min) || 30) : undefined, ganztags: start == null });
    } else if (a.frist) {
      ereignis(z, { uid: `frist-${a.id}@aka`, stempel, titel: `⏰ Frist: ${a.titel}`, tz, datum: a.frist, ganztags: true });
    }
  }

  for (const t of daten.training || []) {
    const start = minuten(t.uhrzeit);
    const tag = BYDAY[t.wochentag] ? t.wochentag : null;
    if (start == null || !tag) continue;
    const erster = ersterPassenderTag(anker, [tag]);
    if (!erster) continue;
    ereignis(z, { uid: `training-${t.id}@aka`, stempel, titel: `🏋️ ${t.name || t.art || "Training"}`, tz, datum: erster, start, ende: start + 60, rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[tag]}` });
  }

  z.push("END:VCALENDAR");
  return z.map(falten).join("\r\n") + "\r\n";
}
