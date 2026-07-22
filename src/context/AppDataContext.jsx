import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import { useProfileData } from "../data/useProfileData";
import { useProtocolData } from "../data/useProtocolData";
import { usePeptideLogs } from "../data/usePeptideLogs";
import { useHormoneData } from "../data/useHormoneData";
import { useSupplementData } from "../data/useSupplementData";
import { useDrinkRecipes } from "../data/useDrinkRecipes";
import { useMealData } from "../data/useMealData";
import { useRoutines } from "../data/useRoutines";
import { useHydrationData } from "../data/useHydrationData";
import { useCheckinData } from "../data/useCheckinData";
import { useSleepData } from "../data/useSleepData";
import { useBiomarkerData } from "../data/useBiomarkerData";
import { useLexikon } from "../data/useLexikon";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const profileData = useProfileData(userId);
  const protocolData = useProtocolData(userId);
  const peptideLogs = usePeptideLogs(userId, protocolData.protocolId);
  const hormoneData = useHormoneData(userId, protocolData.startdatum, protocolData.dauer);
  const supplementData = useSupplementData(userId);
  const drinkData = useDrinkRecipes(userId);
  const mealData = useMealData(userId);
  const routineData = useRoutines(userId);
  const hydrationData = useHydrationData(userId);
  const checkinData = useCheckinData(userId);
  const sleepData = useSleepData(userId);
  const biomarkerData = useBiomarkerData(userId);
  const lexikon = useLexikon();

  const value = {
    userId,
    ...profileData,
    ...protocolData,
    ...peptideLogs,
    hormone: hormoneData.hormone,
    hormonDosierung: hormoneData.hormonDosierung,
    hormonHinzufuegen: hormoneData.hormonHinzufuegen,
    hormonEntfernen: hormoneData.hormonEntfernen,
    setHormonFoto: hormoneData.setHormonFoto,
    setHormonKategorie: hormoneData.setHormonKategorie,
    setHormonEinnahmeart: hormoneData.setHormonEinnahmeart,
    hormonErledigt: hormoneData.hormonErledigt,
    toggleHormonErledigt: hormoneData.toggleHormonErledigt,
    hormonFeedback: hormoneData.hormonFeedback,
    saveHormonFeedback: hormoneData.saveHormonFeedback,
    skipHormonFeedback: hormoneData.skipHormonFeedback,
    hormonPlan: hormoneData.hormonPlan,
    ...supplementData,
    ...drinkData,
    ...mealData,
    ...routineData,
    ...hydrationData,
    ...checkinData,
    ...sleepData,
    ...biomarkerData,
    ...lexikon,
    // Muss nach den Spreads gesetzt werden, da profileData/protocolData
    // jeweils ein eigenes `loading`-Feld mitbringen.
    loading: profileData.loading || protocolData.loading,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData muss innerhalb von AppDataProvider verwendet werden.");
  return ctx;
}
