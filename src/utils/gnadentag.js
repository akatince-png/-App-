import { addDays } from "./dates";
import { buildDayItems } from "./dayItems";

// Gnadentag-/Anti-Scham-Statistik für den Wochenrückblick (GraceDayCard.jsx)
// — App-Bauplan-Punkt: die ursprüngliche Komponente stand komplett
// eigenständig da, ohne echte Daten dahinter (Code-Audit Teil 5, 13.09.,
// entfernt als toter Code — zu Recht, sie war nirgends verdrahtet). Diese
// Funktion liefert jetzt die tatsächliche Grundlage: dieselbe Ist-geplant-
// Logik wie ausgefallenSweep.js/Tagesplan (buildDayItems()), nicht noch
// einmal separat nachgebaut.
//
// Ein Tag zählt NICHT automatisch als "Pause" (verpasst), nur weil nicht
// alles erledigt wurde — genau das war der Kritikpunkt an klassischen
// Habit-Trackern (Streak reißt bei einem einzigen ausgelassenen Punkt).
// Ab 50%+ erledigten Punkten gilt der Tag als "aktiv", darunter als
// "Pause" — und ein Tag ganz ohne geplante Punkte zählt gar nicht erst als
// Pause (nichts stand an, also gibt's auch nichts zu verpassen).
const TAGE_ZURUECK = 7;
const AKTIV_SCHWELLE = 0.5;

export function berechneWochenStats(appData, heute = new Date()) {
  let completedDays = 0;
  let pauseDays = 0;

  for (let i = 1; i <= TAGE_ZURUECK; i++) {
    const tag = addDays(heute, -i);
    const items = buildDayItems(tag, appData);
    if (items.length === 0) {
      completedDays += 1; // nichts geplant -> kein verpasster Tag
      continue;
    }
    const erledigtAnteil = items.filter((it) => it.done).length / items.length;
    if (erledigtAnteil >= AKTIV_SCHWELLE) completedDays += 1;
    else pauseDays += 1;
  }

  return { completedDays, pauseDays, totalDays: TAGE_ZURUECK };
}
