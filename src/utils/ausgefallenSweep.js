import { addDays, toLocalISODate } from "./dates";
import { buildDayItems } from "./dayItems";

// Automatische "ausgefallen"-Erfassung: läuft beim Laden der App höchstens
// einmal pro Kalendertag (lokaler Zeitstempel in localStorage) und trägt für
// jeden vergangenen, noch nicht geprüften Tag alle geplanten, aber nie
// bestätigten Einträge als "ausgefallen" ins Änderungsprotokoll ein — ohne
// dass die Person selbst etwas tun muss. Nutzt buildDayItems() (dieselbe
// Funktion, die auch Tagesplan/Home für die Anzeige verwenden), damit die
// Ist-geplant-Logik nirgends ein zweites Mal nachgebaut werden musste.
//
// Deckt dieselben Bereiche ab, die buildDayItems() kennt: Peptide,
// Medikamente, Supplemente, Mahlzeiten, Gewohnheiten, Training — NICHT
// Hydration/Tageslicht/Schlaf (kumulative Tageswerte ohne Einzeltermin,
// siehe UEBERGABEPROTOKOLL.md).
const SWEEP_KEY = "letzterAusfallSweep";
const MAX_NACHHOL_TAGE = 14; // Deckel gegen ausufernde Nachhol-Läufe nach langer Abwesenheit.

function ausgefallenDetail(datumStr) {
  return `Nicht bestätigt am ${datumStr}`;
}

export async function pruefeAusgefalleneEintraege(appData) {
  if (typeof window === "undefined" || !appData?.userId) return;

  const heute = new Date();
  const heuteStr = toLocalISODate(heute);

  let letzterSweep;
  try {
    letzterSweep = window.localStorage.getItem(SWEEP_KEY);
  } catch {
    return; // Kein localStorage verfügbar — Sweep überspringen statt abzustürzen.
  }
  if (letzterSweep === heuteStr) return; // Heute schon gelaufen.

  // Erster Lauf überhaupt: nur die Grundlage legen, nicht die komplette
  // Vergangenheit vor Einführung dieser Funktion rückwirkend als
  // "ausgefallen" markieren — das wäre eine Flut sinnloser Einträge.
  if (!letzterSweep) {
    try {
      window.localStorage.setItem(SWEEP_KEY, heuteStr);
    } catch {
      // Ignorieren — beim nächsten Laden wird es erneut versucht.
    }
    return;
  }

  // Tage zwischen dem letzten Sweep und heute (exklusive heute selbst, das
  // ist noch nicht vorbei) — bei einer langen Pause auf die letzten
  // MAX_NACHHOL_TAGE gedeckelt, ältere Tage werden stillschweigend
  // übersprungen statt einen riesigen Nachhol-Lauf auszulösen.
  const letzterSweepDatum = new Date(`${letzterSweep}T00:00:00`);
  const heuteDatum = new Date(`${heuteStr}T00:00:00`);
  const luecke = Math.round((heuteDatum - letzterSweepDatum) / 86400000);
  const anzahlTage = Math.min(MAX_NACHHOL_TAGE, Math.max(0, luecke - 1));

  for (let i = anzahlTage; i >= 1; i--) {
    const tag = addDays(heuteDatum, -i);
    const tagStr = toLocalISODate(tag);

    const items = buildDayItems(tag, appData);
    const detailText = ausgefallenDetail(tagStr);
    for (const item of items) {
      if (item.done) continue;
      const schonGeloggt = (appData.protokollEintraege || []).some(
        (e) => e.kategorie === item.kategorie && e.itemName === item.name && e.aktion === "ausgefallen" && e.detail === detailText
      );
      if (schonGeloggt) continue;
      // Bewusst sequenziell statt Promise.all — vermeidet, dass bei vielen
      // Nachhol-Tagen zu viele parallele Inserts gleichzeitig laufen.
      await appData.aenderungVermerken({
        kategorie: item.kategorie,
        itemName: item.name,
        aktion: "ausgefallen",
        detail: detailText,
      });
    }
  }

  try {
    window.localStorage.setItem(SWEEP_KEY, heuteStr);
  } catch {
    // Ignorieren — beim nächsten Laden wird es erneut versucht.
  }
}
