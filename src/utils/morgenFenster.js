// Routine-Fenster (06.10., Nutzerin: „Die App muss direkt auffordern: Starte
// jetzt deine Morgenroutine – mit einem eigenen Fenster, das nicht einfach
// weggeklickt wird, bis man startet oder ‚Heute nicht‘ sagt“; am selben Abend:
// dasselbe für die Abendroutine). Reine Logik: wann das Fenster erscheint und
// wie die Entscheidung des Tages gemerkt wird (pro Gerät, je Datum).

const SPEICHER = { morgen: "aka-morgenfenster", abend: "aka-abendfenster" };
const VORLAUF_MIN = { morgen: 60, abend: 30 }; // so lange vor der geplanten Startzeit
const STANDARD_AB = { morgen: 5 * 60, abend: 20 * 60 };
// Morgens bis 14 Uhr (danach gilt die Abendroutine, wie RoutineStart),
// abends ab 14 Uhr bis Mitternacht (danach zählt schon der neue Tag).
const ZEITRAUM = { morgen: [0, 14], abend: [14, 24] };

const minuten = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

/**
 * @param {object} p
 * @param {"morgen"|"abend"} [p.art]
 * @param {Date} p.jetzt
 * @param {string} [p.startZeit] geplante Startzeit der Routine „HH:MM“
 * @param {{anzahlGesamt:number, abgeschlossen:boolean}} p.status
 * @param {string|null} p.entscheidung heutige Entscheidung („gestartet“/„nicht“) oder null
 * @param {boolean} [p.erzwungen] per Link geöffnet (?morgen=1 / ?abend=1, z. B. iOS-Kurzbefehl)
 */
export function zeigeRoutineFenster({ art = "morgen", jetzt, startZeit, status, entscheidung, erzwungen = false }) {
  if (!status || status.anzahlGesamt === 0 || status.abgeschlossen) return false;
  if (erzwungen) return true;
  if (entscheidung) return false;
  const [von, bis] = ZEITRAUM[art];
  if (jetzt.getHours() < von || jetzt.getHours() >= bis) return false;
  const start = minuten(startZeit);
  const ab = start === null ? STANDARD_AB[art] : Math.max(0, start - VORLAUF_MIN[art]);
  return jetzt.getHours() * 60 + jetzt.getMinutes() >= ab;
}

export const zeigeMorgenFenster = (p) => zeigeRoutineFenster({ ...p, art: "morgen" });

export function heutigeEntscheidung(datum, art = "morgen") {
  try {
    if (localStorage.getItem(`${SPEICHER[art]}-aus`) === "1") return "aus";
    const roh = JSON.parse(localStorage.getItem(SPEICHER[art]) || "null");
    return roh?.datum === datum ? roh.wahl : null;
  } catch {
    return null;
  }
}

export function entscheidungMerken(datum, wahl, art = "morgen") {
  try {
    localStorage.setItem(SPEICHER[art], JSON.stringify({ datum, wahl }));
  } catch {
    // ohne Speicher erscheint das Fenster beim nächsten Öffnen erneut
  }
}

export const HEUTE_NICHT_GRUENDE = {
  morgen: ["Krank", "Verschlafen", "Anderer Plan heute", "Keine Kraft", "Unterwegs"],
  abend: ["Krank", "Zu müde", "Noch unterwegs", "Besuch / Termin", "Keine Kraft"],
};
