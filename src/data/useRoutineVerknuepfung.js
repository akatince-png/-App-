import { useCallback } from "react";
import { useAppData } from "../context/AppDataContext";
import { routineTagesStatus } from "../utils/routineStatus";
import { schritteDurchItems, verknuepfteItems } from "../utils/routineVerknuepfung";

// Beide Richtungen der Verknüpfung Routine ↔ Tagespunkte (utils/routineVerknuepfung.js).
// `items` = ungebündelte Tagespunkte des Tages (buildDayItems).
export function useRoutineVerknuepfung(items, tagStr) {
  const {
    routineSchritte = [],
    routineDurchlaeufe = [],
    routineSchrittErledigt = {},
    routineSchrittErledigtUmschalten,
    toggleSupplementErledigt,
    toggleHormonErledigt,
    toggleMahlzeitErledigt,
    toggleGewohnheitErledigt,
    aenderungVermerken,
  } = useAppData();

  // Schritt fertig (geführter Ablauf oder Checkliste) → verknüpfte offene Punkte abhaken.
  const schrittErledigt = useCallback(
    (schritt) => {
      for (const it of verknuepfteItems(schritt, items).filter((x) => !x.done)) {
        const zeit = it.originalUhrzeit ?? it.uhrzeit;
        if (it.raw?.name) aenderungVermerken?.({ kategorie: it.kategorie, itemName: it.raw.name, aktion: "erledigt", detail: `mit „${schritt.name}“` });
        if (it.kategorie === "supplement" && it.raw?.id) toggleSupplementErledigt?.(tagStr, it.raw.id, zeit);
        else if (it.kategorie === "hormon" && it.raw?.name) toggleHormonErledigt?.(tagStr, it.raw.name, zeit);
        else if (it.kategorie === "mahlzeit" && it.refId) toggleMahlzeitErledigt?.(tagStr, it.refId, it.logZeit ?? zeit);
        else if (it.kategorie === "gewohnheit" && it.raw?.id) toggleGewohnheitErledigt?.(tagStr, it.raw.id);
      }
    },
    [items, tagStr, aenderungVermerken, toggleSupplementErledigt, toggleHormonErledigt, toggleMahlzeitErledigt, toggleGewohnheitErledigt]
  );

  // Punkte auf der Startseite abgehakt → passende Routine-Schritte mit abhaken.
  const itemsErledigt = useCallback(
    (erledigt) => {
      const keys = new Set(erledigt.map((x) => x.key));
      for (const routine of ["morgen", "abend"]) {
        const status = routineTagesStatus(routine, tagStr, { routineSchritte, routineDurchlaeufe, routineSchrittErledigt });
        if (status.abgeschlossen) continue;
        const offen = status.schritte.filter((sc) => !status.schrittIstErledigt(sc.id)).map((sc) => ({ ...sc, routine }));
        for (const sc of schritteDurchItems(offen, items, keys)) routineSchrittErledigtUmschalten?.(sc.id, tagStr);
      }
    },
    [items, tagStr, routineSchritte, routineDurchlaeufe, routineSchrittErledigt, routineSchrittErledigtUmschalten]
  );

  return { schrittErledigt, itemsErledigt };
}
