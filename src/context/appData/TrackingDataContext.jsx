import React, { createContext, useContext, useMemo } from "react";
import { useShallowStableValue } from "../useShallowStableValue";
import { useCoreData } from "./CoreDataContext";
import { useSupplementData } from "../../data/useSupplementData";
import { useDrinkRecipes } from "../../data/useDrinkRecipes";
import { useMealData } from "../../data/useMealData";
import { useGewohnheitenData } from "../../data/useGewohnheitenData";
import { useAtemuebungenData } from "../../data/useAtemuebungenData";
import { useHydrationData } from "../../data/useHydrationData";
import { useTageslichtData } from "../../data/useTageslichtData";
import { useBildschirmzeitData } from "../../data/useBildschirmzeitData";
import { useDenkpauseData } from "../../data/useDenkpauseData";
import { useTrainingData } from "../../data/useTrainingData";
import { useTrainingTemplates } from "../../data/useTrainingTemplates";
import { useCheckinData } from "../../data/useCheckinData";
import { useSleepData } from "../../data/useSleepData";
import { useBiomarkerData } from "../../data/useBiomarkerData";

const TrackingDataContext = createContext(null);

// Globalen Datentopf aufteilen (App-Bauplan-Punkt) — der eigentliche
// Kern der Aufteilung: die "Lebensbereiche" (Supplemente, Mahlzeiten,
// Gewohnheiten, Atemübungen, Hydration, Tageslicht, Training, Schlaf,
// Laborwerte/Blutwerte, ...) sind mit Abstand die am häufigsten
// aktualisierten Daten in der App (jedes Abhaken eines Punkts ändert
// hier etwas) — genau dieser Teil trieb bisher die meisten unnötigen
// Re-Renders in weit entfernten Komponenten, die z. B. nur Team-/Quest-
// Daten brauchten. Eigener Kontext + eigenes useShallowStableValue heißt:
// eine Änderung hier stabilisiert sich jetzt für sich, statt zusammen mit
// buchstäblich allem anderen in einem einzigen ~150-Felder-Objekt
// neu bewertet zu werden.
export function TrackingDataProvider({ children }) {
  const { userId, eintragsProtokollId, belohnungPufferMin, hauptprotokollData } = useCoreData();

  // Neue Einträge landen im gerade gewählten Eintrags-Ziel (Haupt- oder
  // Zusatzprotokoll, siehe CoreDataContext).
  const supplementData = useSupplementData(userId, eintragsProtokollId, belohnungPufferMin);
  const drinkData = useDrinkRecipes(userId);
  const mealData = useMealData(userId, eintragsProtokollId, belohnungPufferMin);
  const gewohnheitenData = useGewohnheitenData(userId, eintragsProtokollId);

  // Einträge beendeter Zusatzprotokolle ausblenden (Verlauf bleibt).
  const ausgeblendet = hauptprotokollData.ausgeblendeteProtokollIds;
  const sichtbar = useMemo(() => {
    const ids = new Set(ausgeblendet);
    const filter = (liste) => (ids.size === 0 ? liste : liste.filter((e) => !ids.has(e.hauptprotokollId)));
    return {
      supplemente: filter(supplementData.supplemente),
      mahlzeiten: filter(mealData.mahlzeiten),
      gewohnheiten: filter(gewohnheitenData.gewohnheiten),
    };
  }, [ausgeblendet, supplementData.supplemente, mealData.mahlzeiten, gewohnheitenData.gewohnheiten]);
  const atemuebungenData = useAtemuebungenData(userId);
  const hydrationData = useHydrationData(userId);
  const tageslichtData = useTageslichtData(userId);
  const bildschirmzeitData = useBildschirmzeitData(userId);
  const denkpauseData = useDenkpauseData(userId);
  const trainingData = useTrainingData(userId);
  const trainingTemplates = useTrainingTemplates(userId);
  const checkinData = useCheckinData(userId);
  const sleepData = useSleepData(userId);
  const biomarkerData = useBiomarkerData(userId);

  const value = useShallowStableValue({
    ...supplementData,
    ...drinkData,
    ...mealData,
    ...gewohnheitenData,
    ...atemuebungenData,
    ...hydrationData,
    ...tageslichtData,
    ...bildschirmzeitData,
    ...denkpauseData,
    ...trainingData,
    ...trainingTemplates,
    ...checkinData,
    ...sleepData,
    ...biomarkerData,
    supplemente: sichtbar.supplemente,
    mahlzeiten: sichtbar.mahlzeiten,
    gewohnheiten: sichtbar.gewohnheiten,
  });

  return <TrackingDataContext.Provider value={value}>{children}</TrackingDataContext.Provider>;
}

export function useTrackingData() {
  const ctx = useContext(TrackingDataContext);
  if (!ctx) throw new Error("useTrackingData muss innerhalb von TrackingDataProvider verwendet werden.");
  return ctx;
}
