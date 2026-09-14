import React, { createContext, useContext } from "react";
import { useShallowStableValue } from "../useShallowStableValue";
import { useProfileData } from "../../data/useProfileData";
import { useProtocolData } from "../../data/useProtocolData";
import { useHauptprotokollData } from "../../data/useHauptprotokollData";
import { useHormoneData } from "../../data/useHormoneData";

const CoreDataContext = createContext(null);

// Globalen Datentopf aufteilen (App-Bauplan-Punkt) — ausführliche
// Begründung in ../AppDataContext.jsx. Dieser Teil bündelt Profil/
// Protokoll-Grunddaten und Peptid-/Hormondosen: die Werte, von denen die
// beiden anderen Datentopf-Teile (Tracking/Plattform) selbst wieder
// abhängen (userId, hauptprotokollId, belohnungPufferMin, startdatum,
// dauer) — deshalb bewusst am weitesten außen verschachtelt, seine Hooks
// laufen zuerst.
//
// Reihenfolge der gespreadeten Felder im Rückgabewert entspricht exakt
// der Reihenfolge, in der Profil-/Protokoll-/Hormondaten schon vorher im
// (jetzt aufgeteilten) AppDataContext.jsx standen — bewusst so belassen,
// nicht nach "sauberer" thematischer Logik neu sortiert: nur so bleibt
// mit Sicherheit ausgeschlossen, dass ein zufällig gleichnamiges Feld
// zwischen zwei Hooks nach der Aufteilung plötzlich den jeweils anderen
// Wert gewinnt, statt wie vorher.
export function CoreDataProvider({ userId, children }) {
  const profileData = useProfileData(userId);
  const protocolData = useProtocolData(userId);
  const hauptprotokollData = useHauptprotokollData(userId);
  const hauptprotokollId = hauptprotokollData.aktivesHauptprotokoll?.id || null;
  const hormoneData = useHormoneData(userId, protocolData.startdatum, protocolData.dauer, hauptprotokollId, profileData.belohnungPufferMin);

  const value = useShallowStableValue({
    userId,
    ...profileData,
    ...protocolData,
    // Bewusst nur diese Teilmenge, nicht `...hormoneData` (unverändert
    // übernommen aus dem früheren AppDataContext.jsx).
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
    // Muss nach den Spreads gesetzt werden, da profileData/protocolData
    // jeweils ein eigenes `loading`-Feld mitbringen (unverändert
    // übernommene Begründung aus dem früheren AppDataContext.jsx).
    loading: profileData.loading || protocolData.loading,
    // Nur intern für Tracking-/PlatformDataProvider — nicht Teil der
    // "historischen" öffentlichen Feldliste oben, aber harmlos additiv,
    // falls künftiger Code sie direkt braucht statt sie erneut abzuleiten.
    hauptprotokollId,
    hauptprotokollData,
  });

  return <CoreDataContext.Provider value={value}>{children}</CoreDataContext.Provider>;
}

export function useCoreData() {
  const ctx = useContext(CoreDataContext);
  if (!ctx) throw new Error("useCoreData muss innerhalb von CoreDataProvider verwendet werden.");
  return ctx;
}
