import React, { createContext, useContext, useEffect, useRef } from "react";
import { pruefeAusgefalleneEintraege } from "../utils/ausgefallenSweep";
import { useAuth } from "./AuthContext";
import { useAdmin } from "./AdminContext";
import { useProfileData } from "../data/useProfileData";
import { useProtocolData } from "../data/useProtocolData";
import { usePeptideLogs } from "../data/usePeptideLogs";
import { useHormoneData } from "../data/useHormoneData";
import { useSupplementData } from "../data/useSupplementData";
import { useDrinkRecipes } from "../data/useDrinkRecipes";
import { useMealData } from "../data/useMealData";
import { useGewohnheitenData } from "../data/useGewohnheitenData";
import { useHydrationData } from "../data/useHydrationData";
import { useTageslichtData } from "../data/useTageslichtData";
import { useTrainingData } from "../data/useTrainingData";
import { useTrainingTemplates } from "../data/useTrainingTemplates";
import { useCheckinData } from "../data/useCheckinData";
import { useSleepData } from "../data/useSleepData";
import { useBiomarkerData } from "../data/useBiomarkerData";
import { usePushNotifications } from "../data/usePushNotifications";
import { useAenderungsprotokoll } from "../data/useAenderungsprotokoll";
import { useWochenprotokollMeilenstein } from "../data/useWochenprotokollMeilenstein";
import { useLexikon } from "../data/useLexikon";
import { useCoachVerlauf } from "../data/useCoachVerlauf";
import { useAdminNotizen } from "../data/useAdminNotizen";
import { useSpotifyVerbindung } from "../data/useSpotifyVerbindung";
import { useHauptprotokollData } from "../data/useHauptprotokollData";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  // Im "Verwalten als"-Modus (Admin-Dashboard) lädt/speichert die App die
  // Daten der ausgewählten Probandin/des Probanden statt der eigenen —
  // jeder Hook unten nimmt userId ohnehin schon als Parameter, dadurch
  // reicht dieser eine Umschaltpunkt, um die komplette App stellvertretend
  // zu bedienen. Root() in App.jsx erzwingt beim Wechsel einen Remount
  // (key={proband?.id || "self"}), damit kein alter State übrig bleibt.
  const { proband } = useAdmin();
  const userId = proband?.id || user?.id;

  const profileData = useProfileData(userId);
  const protocolData = useProtocolData(userId);
  const hauptprotokollData = useHauptprotokollData(userId);
  const hauptprotokollId = hauptprotokollData.aktivesHauptprotokoll?.id || null;
  const peptideLogs = usePeptideLogs(userId, protocolData.protocolId);
  const hormoneData = useHormoneData(userId, protocolData.startdatum, protocolData.dauer, hauptprotokollId);
  const supplementData = useSupplementData(userId, hauptprotokollId);
  const drinkData = useDrinkRecipes(userId);
  const mealData = useMealData(userId, hauptprotokollId);
  const gewohnheitenData = useGewohnheitenData(userId, hauptprotokollId);
  const hydrationData = useHydrationData(userId);
  const tageslichtData = useTageslichtData(userId);
  const trainingData = useTrainingData(userId);
  const trainingTemplates = useTrainingTemplates(userId);
  const checkinData = useCheckinData(userId);
  const sleepData = useSleepData(userId);
  const biomarkerData = useBiomarkerData(userId);
  const pushData = usePushNotifications(userId);
  const aenderungsprotokollData = useAenderungsprotokoll(userId);
  const wochenprotokollMeilenstein = useWochenprotokollMeilenstein(userId);
  const lexikon = useLexikon();
  const coachVerlaufData = useCoachVerlauf(userId);
  const adminNotizenData = useAdminNotizen(userId);
  const spotifyData = useSpotifyVerbindung(userId);

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
    setHormonDose: hormoneData.setHormonDose,
    setHormonDoseBatch: hormoneData.setHormonDoseBatch,
    hormonErledigt: hormoneData.hormonErledigt,
    toggleHormonErledigt: hormoneData.toggleHormonErledigt,
    hormonFeedback: hormoneData.hormonFeedback,
    saveHormonFeedback: hormoneData.saveHormonFeedback,
    skipHormonFeedback: hormoneData.skipHormonFeedback,
    hormonPlan: hormoneData.hormonPlan,
    ...supplementData,
    ...drinkData,
    ...mealData,
    ...gewohnheitenData,
    ...hydrationData,
    ...tageslichtData,
    ...trainingData,
    ...trainingTemplates,
    ...checkinData,
    ...sleepData,
    ...biomarkerData,
    ...pushData,
    ...aenderungsprotokollData,
    ...wochenprotokollMeilenstein,
    ...lexikon,
    ...coachVerlaufData,
    ...adminNotizenData,
    ...spotifyData,
    ...hauptprotokollData,
    // Muss nach den Spreads gesetzt werden, da profileData/protocolData
    // jeweils ein eigenes `loading`-Feld mitbringen.
    loading: profileData.loading || protocolData.loading,
  };

  // Einmal pro Kalendertag und pro echtem App-Start prüfen, was gestern
  // (bzw. seit dem letzten Öffnen) geplant, aber nie bestätigt wurde, und
  // automatisch als "ausgefallen" im Änderungsprotokoll vermerken — siehe
  // utils/ausgefallenSweep.js. sweepLaufendRef verhindert einen zweiten
  // Lauf durch StrictMode/Re-Renders innerhalb derselben Sitzung.
  const sweepLaufendRef = useRef(false);
  useEffect(() => {
    if (value.loading || !userId || sweepLaufendRef.current) return;
    sweepLaufendRef.current = true;
    pruefeAusgefalleneEintraege(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.loading, userId]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData muss innerhalb von AppDataProvider verwendet werden.");
  return ctx;
}
