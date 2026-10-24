// Schnellzugriff per Abkürzung (24.10., Nutzerin: für alles unter „⚡ Schnell“
// ein eigenes Symbol auf dem Tablet-Home-Bildschirm). Die Seiten unter
// public/kurz/ springen nach „/?schnell=<id>#/home“; hier wird der Wert einmal
// gelesen und aus der Adresse entfernt (Neuladen öffnet ihn nicht erneut).
export const SCHNELL_IDS = ["trinken", "snack", "nickerchen", "training", "einnahme", "workflow", "spielen"];
// Diese öffnen ihre Auswahl auf der Startseite statt im Kreis.
export const SCHNELL_AUF_STARTSEITE = ["training", "workflow", "spielen"];

let gelesen = false;
let wert = null;
const verbraucht = new Set();

function lesen() {
  if (gelesen || typeof window === "undefined") return;
  gelesen = true;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("schnell");
  if (!SCHNELL_IDS.includes(id)) return;
  wert = id;
  params.delete("schnell");
  const rest = params.toString();
  window.history.replaceState(window.history.state, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
}

// Kam die App gerade über eine Schnell-Abkürzung? (Dann kein Routine-Vollbild davor.)
export function kamUeberSchnell() {
  lesen();
  return wert !== null;
}

// Den Wert genau einmal abholen, nur wenn er zu `gruppe` gehört.
export function nimmSchnellStart(gruppe) {
  lesen();
  if (!wert || verbraucht.has(wert) || !gruppe.includes(wert)) return null;
  verbraucht.add(wert);
  return wert;
}

// Nur für Tests.
export function _zuruecksetzen() {
  gelesen = false;
  wert = null;
  verbraucht.clear();
}
