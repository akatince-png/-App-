import React, { createContext, useContext, useMemo, useState } from "react";
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
  // Zusatzprotokolle (Migration 0093): solange ein Zusatzprotokoll als
  // "Eintrags-Ziel" gewählt ist (Banner "Du fügst gerade Einträge zu … hinzu",
  // siehe ui/ZusatzprotokollBanner.jsx), landen NEU angelegte Supplemente/
  // Medikamente/Mahlzeiten/Gewohnheiten dort statt im Hauptprotokoll. Ist das
  // gewählte Zusatzprotokoll nicht (mehr) aktiv, gilt automatisch wieder das
  // Hauptprotokoll.
  const [eintragsZielId, setEintragsZielId] = useState(null);
  const eintragsProtokollId = hauptprotokollData.zusatzprotokolle.some((z) => z.id === eintragsZielId) ? eintragsZielId : hauptprotokollId;
  const hormoneData = useHormoneData(userId, protocolData.startdatum, protocolData.dauer, eintragsProtokollId, profileData.belohnungPufferMin);

  // Medikamente beendeter Zusatzprotokolle aus Liste und Dosisplan nehmen
  // (Verlauf/Logs bleiben unberührt).
  const ausgeblendet = hauptprotokollData.ausgeblendeteProtokollIds;
  const { sichtbareHormone, sichtbarerHormonPlan } = useMemo(() => {
    if (ausgeblendet.length === 0) return { sichtbareHormone: hormoneData.hormone, sichtbarerHormonPlan: hormoneData.hormonPlan };
    const ids = new Set(ausgeblendet);
    const versteckt = new Set(hormoneData.hormone.filter((n) => ids.has(hormoneData.hormonDosierung[n]?.hauptprotokollId)));
    return {
      sichtbareHormone: hormoneData.hormone.filter((n) => !versteckt.has(n)),
      sichtbarerHormonPlan: hormoneData.hormonPlan.filter((d) => !versteckt.has(d.name)),
    };
  }, [ausgeblendet, hormoneData.hormone, hormoneData.hormonPlan, hormoneData.hormonDosierung]);

  const value = useShallowStableValue({
    userId,
    ...profileData,
    ...protocolData,
    // Bewusst nur diese Teilmenge, nicht `...hormoneData` (unverändert
    // übernommen aus dem früheren AppDataContext.jsx).
    hormone: sichtbareHormone,
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
    hormonPlan: sichtbarerHormonPlan,
    // Muss nach den Spreads gesetzt werden, da profileData/protocolData
    // jeweils ein eigenes `loading`-Feld mitbringen (unverändert
    // übernommene Begründung aus dem früheren AppDataContext.jsx).
    loading: profileData.loading || protocolData.loading,
    // Nur intern für Tracking-/PlatformDataProvider — nicht Teil der
    // "historischen" öffentlichen Feldliste oben, aber harmlos additiv,
    // falls künftiger Code sie direkt braucht statt sie erneut abzuleiten.
    hauptprotokollId,
    hauptprotokollData,
    eintragsZielId: eintragsProtokollId !== hauptprotokollId ? eintragsProtokollId : null,
    setEintragsZielId,
    eintragsProtokollId,
  });

  return <CoreDataContext.Provider value={value}>{children}</CoreDataContext.Provider>;
}

export function useCoreData() {
  const ctx = useContext(CoreDataContext);
  if (!ctx) throw new Error("useCoreData muss innerhalb von CoreDataProvider verwendet werden.");
  return ctx;
}
