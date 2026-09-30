import { useCallback } from "react";
import { useAppData } from "../context/AppDataContext";
import { buildDayItems } from "../utils/dayItems";
import { bloeckeFuerTag } from "../utils/kalender";
import { ereignisseAmTag } from "../utils/ereignisse";
import { toLocalISODate } from "../utils/dates";

// Alle Blöcke eines Tages für Kalender und Startseite (30.09. aus
// KalenderView herausgezogen): Plan, Routinen, Mein Alltag und spontan
// Passiertes als Ereignisse.
export function useTagesBloecke() {
  const a = useAppData();
  return useCallback(
    (date) => {
      const items = buildDayItems(date, {
        hormonPlan: a.hormonPlan || [],
        hormonErledigt: a.hormonErledigt || {},
        hormonDosierung: a.hormonDosierung || {},
        supplemente: a.supplemente || [],
        supplementErledigt: a.supplementErledigt || {},
        mahlzeiten: a.mahlzeiten || [],
        mahlzeitErledigt: a.mahlzeitErledigt || {},
        mealWochenplan: a.mealWochenplan || [],
        trainingEintraege: a.trainingEintraege || [],
        trainingNachDatum: a.trainingNachDatum || null,
        trainingWochenplan: a.trainingWochenplan || [],
        trainingTemplates: a.trainingTemplates || [],
        gewohnheiten: a.gewohnheiten || [],
        gewohnheitErledigt: a.gewohnheitErledigt || {},
        workflowPlaene: a.workflowPlaene || [],
        workflowPresets: a.workflowPresets || [],
        projekte: a.projekte || [],
        zeitbloecke: a.zeitbloecke || [],
        ausnahmenNachSchluessel: a.ausnahmenNachSchluessel || null,
      });
      return bloeckeFuerTag(date, {
        items,
        routineEinstellungen: a.routineEinstellungen || {},
        alltagEintraege: a.alltagEintraege || [],
        alltagBereiche: a.alltagBereiche || [],
        alltagErledigt: a.alltagErledigt || {},
        ereignisse: ereignisseAmTag(toLocalISODate(date), a),
      });
    },
    [a],
  );
}
