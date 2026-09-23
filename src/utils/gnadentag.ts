import { addDays, toLocalISODate } from "./dates";
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

export interface WochenStats {
  completedDays: number;
  pauseDays: number;
  totalDays: number;
}

// `appData` bleibt bewusst locker typisiert (nicht überall `any`, aber auch
// keine vollständige Schnittstelle für das ~150-Felder-Objekt aus
// useAppData()): buildDayItems() selbst ist noch eine ungeprüfte .js-Datei
// (siehe tsconfig.json, `checkJs: false`) — TypeScript leitet aus deren
// Ziel-Objekt-Destrukturierung trotzdem einen strikten Parametertyp ab
// (u. a. mehrere als "erforderlich" erkannte Felder). Eine ebenso strikte
// Schnittstelle hier hätte ohne eine ebenso strikte, geprüfte Gegenseite
// dort keinen echten Nutzen, nur Schein-Sicherheit — daher der bewusste,
// einzelne `as any` genau an der Grenze zu dieser ungeprüften Datei, statt
// `appData` app-weit unnötig aufzuweichen.
export function berechneWochenStats(appData: Record<string, unknown>, heute: Date = new Date()): WochenStats {
  let completedDays = 0;
  let pauseDays = 0;
  let totalDays = 0;
  // Bug-Fix Dauertest 23.09.: Tage VOR dem Protokollstart zählen nicht —
  // sonst hatte ein neues Konto am ersten Tag schon "7 Pausen".
  const hauptprotokoll = appData.aktivesHauptprotokoll as { startdatum?: string } | null | undefined;
  const start = (hauptprotokoll?.startdatum || (appData.startdatum as string | undefined) || "").slice(0, 10);

  for (let i = 1; i <= TAGE_ZURUECK; i++) {
    const tag = addDays(heute, -i);
    if (start && toLocalISODate(tag) < start) continue;
    totalDays += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = buildDayItems(tag, appData as any);
    if (items.length === 0) {
      completedDays += 1; // nichts geplant -> kein verpasster Tag
      continue;
    }
    const erledigtAnteil = items.filter((it: { done: boolean }) => it.done).length / items.length;
    if (erledigtAnteil >= AKTIV_SCHWELLE) completedDays += 1;
    else pauseDays += 1;
  }

  return { completedDays, pauseDays, totalDays };
}
