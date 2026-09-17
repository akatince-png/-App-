import { toLocalISODate } from "./dates";

// Tages-Status einer Morgen-/Abendroutine (Nutzerin-Vorgabe, 17.09.: "die
// ganze Routine pro Tag, aber draufklicken und die Einzelschritte
// einsehen"). Bewusst NICHT Teil von buildDayItems() (siehe dortiger
// Kommentar) — eigene, kleine Quelle für die Pseudo-Punkte in Tagesplan/
// Wochenübersicht/Monatsansicht.
//
// "Abgeschlossen" (ein fertiger `routine_durchlaeufe`-Eintrag für diesen
// Tag) zählt automatisch ALLE aktuell konfigurierten Schritte als erledigt
// — der geführte Ablauf (RoutineAblauf.jsx) schreibt beim Durchlaufen keine
// einzelnen `routine_schritt_logs`, sondern nur den fertigen Durchlauf am
// Ende. Ohne einen solchen Durchlauf zählt `routineSchrittErledigt`
// (Direkt-Bestätigung einzelner Schritte, z. B. über die Checkliste).
export function routineTagesStatus(routine, datum, { routineSchritte, routineDurchlaeufe, routineSchrittErledigt }) {
  const datumStr = typeof datum === "string" ? datum : toLocalISODate(datum);
  const schritte = (routineSchritte || []).filter((s) => s.routine === routine).sort((a, b) => a.reihenfolge - b.reihenfolge);
  const abgeschlossen = (routineDurchlaeufe || []).some((d) => d.routine === routine && d.datum === datumStr);
  const schrittIstErledigt = (schrittId) => abgeschlossen || !!(routineSchrittErledigt || {})[`${datumStr}__${schrittId}`];
  const anzahlErledigt = schritte.filter((s) => schrittIstErledigt(s.id)).length;
  return {
    datum: datumStr,
    schritte,
    abgeschlossen,
    anzahlErledigt,
    anzahlGesamt: schritte.length,
    schrittIstErledigt,
  };
}

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_KATEGORIE = { morgen: "morgenroutine", abend: "abendroutine" };
// Kein konfigurierter Zeitrahmen (routineEinstellungen[routine].startZeit)
// → grober Richtwert, an dem sich die Kategorien in buildDayItems() ohnehin
// schon orientieren (morgens < 11 Uhr, abends >= 18 Uhr, siehe dayItems.js).
const ROUTINE_FALLBACK_UHRZEIT = { morgen: "06:00", abend: "20:00" };

// Ein Pseudo-Punkt pro Tag und Routine (Nutzerin-Vorgabe, 17.09.: "die
// ganze Routine pro Tag sehen, aber draufklicken und die Einzelschritte
// einsehen") — bewusst NICHT Teil von buildDayItems() (siehe Kommentar
// dort), aber im selben Item-Format, damit Tagesplan/Wochenübersicht/
// Monatsansicht sie ohne Sonderfall-Rendering mitanzeigen können. Eine
// Routine ohne konfigurierte Schritte erzeugt keinen Punkt (nichts zum
// Reingucken da).
export function routinePseudoItems(datum, ctx) {
  const datumStr = typeof datum === "string" ? datum : toLocalISODate(datum);
  return ["morgen", "abend"]
    .map((routine) => {
      const status = routineTagesStatus(routine, datumStr, ctx);
      if (status.anzahlGesamt === 0) return null;
      const uhrzeit = ctx?.routineEinstellungen?.[routine]?.startZeit || ROUTINE_FALLBACK_UHRZEIT[routine];
      return {
        kategorie: ROUTINE_KATEGORIE[routine],
        key: `${ROUTINE_KATEGORIE[routine]}-${datumStr}`,
        refId: null,
        hour: uhrzeit.slice(0, 2),
        uhrzeit,
        name: ROUTINE_LABEL[routine],
        detail: `${status.anzahlErledigt}/${status.anzahlGesamt} Schritte`,
        done: status.abgeschlossen,
        raw: { routine, datum: datumStr },
      };
    })
    .filter(Boolean);
}

// Fügt die Routine-Pseudo-Punkte in eine bereits von buildDayItems()
// gelieferte Liste ein und sortiert wie dort (siehe dayItems.js) neu nach
// Uhrzeit — sonst stünden die Routinen immer hinter allen "echten" Punkten.
export function mitRoutinePseudoItems(items, datum, ctx) {
  const kombiniert = [...items, ...routinePseudoItems(datum, ctx)];
  kombiniert.sort((a, b) => {
    const ha = a.hour ?? "99";
    const hb = b.hour ?? "99";
    if (ha !== hb) return ha.localeCompare(hb);
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });
  return kombiniert;
}
