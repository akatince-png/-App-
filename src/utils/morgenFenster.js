// Morgenfenster (06.10., Nutzerin: „Die App muss direkt auffordern: Starte
// jetzt deine Morgenroutine – mit einem eigenen Fenster, das nicht einfach
// weggeklickt wird, bis man startet oder ‚Heute nicht‘ sagt“).
// Reine Logik: wann das Fenster erscheint und wie die Entscheidung des Tages
// gemerkt wird (pro Gerät, je Datum).

const SPEICHER = "aka-morgenfenster";
const VORLAUF_MIN = 60; // ab 1 Std. vor der geplanten Startzeit
const BIS_STUNDE = 14; // danach gilt die Abendroutine (wie RoutineStart)

const minuten = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

/**
 * @param {object} p
 * @param {Date} p.jetzt
 * @param {string} [p.startZeit] geplante Startzeit der Morgenroutine „HH:MM“
 * @param {{anzahlGesamt:number, abgeschlossen:boolean}} p.status
 * @param {string|null} p.entscheidung heutige Entscheidung („gestartet“/„nicht“) oder null
 * @param {boolean} [p.erzwungen] per Link geöffnet (?morgen=1, z. B. iOS-Kurzbefehl nach dem Wecker)
 */
export function zeigeMorgenFenster({ jetzt, startZeit, status, entscheidung, erzwungen = false }) {
  if (!status || status.anzahlGesamt === 0 || status.abgeschlossen) return false;
  if (erzwungen) return true;
  if (entscheidung) return false;
  const jetztMin = jetzt.getHours() * 60 + jetzt.getMinutes();
  if (jetzt.getHours() >= BIS_STUNDE) return false;
  const start = minuten(startZeit);
  const ab = start === null ? 5 * 60 : Math.max(0, start - VORLAUF_MIN);
  return jetztMin >= ab;
}

export function heutigeEntscheidung(datum) {
  try {
    if (localStorage.getItem(`${SPEICHER}-aus`) === "1") return "aus";
    const roh = JSON.parse(localStorage.getItem(SPEICHER) || "null");
    return roh?.datum === datum ? roh.wahl : null;
  } catch {
    return null;
  }
}

export function entscheidungMerken(datum, wahl) {
  try {
    localStorage.setItem(SPEICHER, JSON.stringify({ datum, wahl }));
  } catch {
    // ohne Speicher erscheint das Fenster beim nächsten Öffnen erneut
  }
}

export const HEUTE_NICHT_GRUENDE = ["Krank", "Verschlafen", "Anderer Plan heute", "Keine Kraft", "Unterwegs"];
