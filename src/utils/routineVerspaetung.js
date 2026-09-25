// Verspätete Morgen-/Abendroutine (25.09., Nutzerinnen-Vorgabe): Später
// erledigt ist kein Grund, dass etwas "nicht mehr stattfindet" — die
// Verspätung wird vermerkt und es wird darauf reagiert:
//   1. jede verspätete Routine → Hinweis in der Feier + Tagesprotokoll,
//   2. Muster (3 von 5 Tagen > 30 Min. später) → Karte "Passt deine
//      Zeit noch?" (umstellen / mit Coach besprechen / 1 Woche Ruhe),
//   3. Coach-Übersicht zeigt dasselbe Muster als "braucht dich".
// Grenzwerte bewusst als Konstanten: erstmal so festgesetzt, in der Praxis
// ausprobieren und bei Bedarf anpassen (Nutzerin, 25.09.).
export const MUSTER_TAGE = 5;
export const MUSTER_MINDESTENS = 3;
export const MUSTER_GRENZE_MIN = 30;
export const HINWEIS_RUHE_TAGE = 7;
// itemName der Protokoll-Einträge zur Hinweis-Karte (Wahl der Person) —
// daran wird auch die Woche Ruhe erkannt, geräteübergreifend.
export const ZEIT_HINWEIS_NAME = "Zeit-Hinweis";
// sessionStorage: vorbereiteter Satz für den Coach-Chat (CoachChatView).
export const COACH_CHAT_ENTWURF_KEY = "coachChatEntwurf";

const LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };

function isoTag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uhrzeitMin(hhmm) {
  const t = String(hhmm || "").match(/^(\d{1,2}):(\d{2})/);
  return t ? Number(t[1]) * 60 + Number(t[2]) : null;
}

export function minZuUhrzeit(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Minuten nach der geplanten Startzeit (negativ = früher), gemessen an der
// lokalen Uhrzeit des Zeitpunkts. null ohne Startzeit/Zeitpunkt.
export function verspaetungMin(startZeit, zeitpunkt) {
  const geplant = uhrzeitMin(startZeit);
  if (geplant === null || !zeitpunkt) return null;
  const d = new Date(zeitpunkt);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes() - geplant;
}

export function dauerText(min) {
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return `${h} Std.${r ? ` ${r} Min.` : ""}`;
}

// Text für Feier + Protokoll, null wenn innerhalb des Puffers.
export function verspaetungHinweis(startZeit, zeitpunkt, pufferMin = 0) {
  const min = verspaetungMin(startZeit, zeitpunkt);
  if (min === null || min <= Math.max(0, Number(pufferMin) || 0)) return null;
  return `Heute ${dauerText(min)} später als geplant (${startZeit.slice(0, 5)})`;
}

// Muster der letzten MUSTER_TAGE Tage (heute eingeschlossen). Gemessen wird
// der START des Durchlaufs (wie beim Belohnungsfenster). `tage` enthält
// alle Tage, auch ohne Durchlauf (min null), für die Balken der Karte.
export function verspaetungsMuster(durchlaeufe, routine, startZeit, heute = new Date()) {
  if (uhrzeitMin(startZeit) === null) return null;
  const tage = [];
  for (let i = MUSTER_TAGE - 1; i >= 0; i--) {
    const d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - i);
    const iso = isoTag(d);
    const lauf = (durchlaeufe || []).find((x) => x.routine === routine && x.datum === iso);
    const zeitpunkt = lauf ? lauf.gestartetUm || lauf.abgeschlossenUm : null;
    const min = lauf ? verspaetungMin(startZeit, zeitpunkt) : null;
    tage.push({ datum: iso, kurz: d.toLocaleDateString("de-DE", { weekday: "short" }).slice(0, 2), min, uhrzeit: min === null ? null : minZuUhrzeit(uhrzeitMin(startZeit) + min) });
  }
  const spaet = tage.filter((t) => t.min !== null && t.min > MUSTER_GRENZE_MIN);
  if (spaet.length < MUSTER_MINDESTENS) return null;
  // Typische Uhrzeit = Median der verspäteten Tage, auf 15 Min. gerundet.
  const sortiert = spaet.map((t) => uhrzeitMin(startZeit) + t.min).sort((a, b) => a - b);
  const median = sortiert[Math.floor(sortiert.length / 2)];
  const vorschlag = minZuUhrzeit(Math.round(median / 15) * 15);
  return { routine, label: LABEL[routine], startZeit: startZeit.slice(0, 5), tage, spaetAnzahl: spaet.length, vorschlag };
}

// Hat die Person in den letzten HINWEIS_RUHE_TAGE Tagen schon auf die Karte
// reagiert (egal wie)? Dann erstmal nicht erneut fragen.
export function hinweisRuht(protokollEintraege, routine, heute = new Date()) {
  const kategorie = routine === "morgen" ? "morgenroutine" : "abendroutine";
  const grenze = heute.getTime() - HINWEIS_RUHE_TAGE * 86400000;
  return (protokollEintraege || []).some((e) => e.kategorie === kategorie && e.itemName === ZEIT_HINWEIS_NAME && new Date(e.erstelltAm).getTime() > grenze);
}

// Für die Coach-Übersicht: aus Durchläufen + Startzeiten aller Personen
// (RPC admin_routine_zeiten) je Person das auffälligste Muster.
export function coachVerspaetungen(zeilen, heute = new Date()) {
  const proPerson = new Map();
  for (const z of zeilen || []) {
    const e = proPerson.get(z.user_id) || { startZeiten: {}, durchlaeufe: [] };
    if (z.start_zeit) e.startZeiten[z.routine] = String(z.start_zeit).slice(0, 5);
    if (z.datum) e.durchlaeufe.push({ routine: z.routine, datum: z.datum, gestartetUm: z.gestartet_um, abgeschlossenUm: z.abgeschlossen_um });
    proPerson.set(z.user_id, e);
  }
  const ergebnis = {};
  for (const [id, e] of proPerson) {
    for (const routine of ["morgen", "abend"]) {
      const m = verspaetungsMuster(e.durchlaeufe, routine, e.startZeiten[routine], heute);
      if (m && !ergebnis[id]) ergebnis[id] = m;
    }
  }
  return ergebnis;
}

// Vorformulierte Sätze (Coachee → Coach, Coach → Coachee).
export function satzAnCoach(m) {
  return `Meine ${m.label} klappt meist erst gegen ${m.vorschlag} statt um ${m.startZeit}. Können wir die Zeit gemeinsam anschauen?`;
}
export function satzVomCoach(m, vorname) {
  return `Hallo${vorname ? ` ${vorname}` : ""}, mir ist aufgefallen, dass deine ${m.label} meist erst gegen ${m.vorschlag} klappt statt um ${m.startZeit}. Wollen wir die Zeit gemeinsam anpassen?`;
}
