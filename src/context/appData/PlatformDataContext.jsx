import React, { createContext, useContext } from "react";
import { useShallowStableValue } from "../useShallowStableValue";
import { useCoreData } from "./CoreDataContext";
import { usePushNotifications } from "../../data/usePushNotifications";
import { useAenderungsprotokoll } from "../../data/useAenderungsprotokoll";
import { useWochenprotokollMeilenstein } from "../../data/useWochenprotokollMeilenstein";
import { useLexikon } from "../../data/useLexikon";
import { useCoachVerlauf } from "../../data/useCoachVerlauf";
import { useAdminNotizen } from "../../data/useAdminNotizen";
import { useSpotifyVerbindung } from "../../data/useSpotifyVerbindung";
import { useUebungsBilder } from "../../data/useUebungsBilder";
import { useRoutinen } from "../../data/useRoutinen";
import { useZeitbloecke } from "../../data/useZeitbloecke";
import { useCoacheeNachrichten } from "../../data/useCoacheeNachrichten";
import { useCoachWissen } from "../../data/useCoachWissen";
import { useWorkflowData } from "../../data/useWorkflowData";
import { useBausteinVersionen } from "../../data/useBausteinVersionen";
import { useQuestData } from "../../data/useQuestData";
import { useTeamData } from "../../data/useTeamData";
import { useGruppenprotokolle } from "../../data/gruppenprotokoll";
import { useTagesplanAusnahmen } from "../../data/useTagesplanAusnahmen";
import { useKompletterReset } from "../../data/useKompletterReset";

const PlatformDataContext = createContext(null);

// Globalen Datentopf aufteilen (App-Bauplan-Punkt) — der Rest: Coaching/
// Social (Team, Quests, Coachee-Nachrichten, Coach-Wissen/-Verlauf),
// Verwaltung (Admin-Notizen, Hauptprotokoll-Verwaltung, Zurücksetzen) und
// App-Infrastruktur (Push, Spotify, Lexikon, Übungsbilder, Änderungs-
// protokoll, Wochenprotokoll-Meilenstein). Seltener aktualisiert und
// seltener zusammen mit den Tracking-Bereichen gebraucht — eigener
// Kontext verhindert, dass z. B. ein neu ankommendes Team-Chat-Update
// jede Komponente neu rendert, die eigentlich nur Trainingsdaten braucht.
export function PlatformDataProvider({ children }) {
  const { userId, belohnungPufferMin, hauptprotokollData } = useCoreData();

  const pushData = usePushNotifications(userId);
  const aenderungsprotokollData = useAenderungsprotokoll(userId);
  const wochenprotokollMeilenstein = useWochenprotokollMeilenstein(userId);
  const lexikon = useLexikon();
  const coachVerlaufData = useCoachVerlauf(userId);
  const adminNotizenData = useAdminNotizen(userId);
  const spotifyData = useSpotifyVerbindung(userId);
  const uebungsBilderData = useUebungsBilder(userId);
  const routinenData = useRoutinen(userId, belohnungPufferMin, aenderungsprotokollData.aenderungVermerken);
  const zeitbloeckeData = useZeitbloecke(userId);
  const coacheeNachrichtenData = useCoacheeNachrichten(userId);
  const coachWissenData = useCoachWissen(userId);
  const workflowData = useWorkflowData(userId);
  const bausteinVersionenData = useBausteinVersionen(userId);
  const questData = useQuestData(userId);
  const teamData = useTeamData(userId);
  // Gruppenprotokolle des eigenen Teams (24.09., data/gruppenprotokoll.js).
  const gruppenData = useGruppenprotokolle(userId, teamData.team?.id || null);
  const tagesplanAusnahmenData = useTagesplanAusnahmen(userId);
  const kompletterResetData = useKompletterReset(userId);

  const value = useShallowStableValue({
    ...pushData,
    ...aenderungsprotokollData,
    ...wochenprotokollMeilenstein,
    ...lexikon,
    ...coachVerlaufData,
    ...adminNotizenData,
    ...spotifyData,
    ...uebungsBilderData,
    // hauptprotokollData kommt aus CoreDataContext (wird dort berechnet,
    // weil hauptprotokollId als Parameter für Tracking-Hooks gebraucht
    // wird) — an derselben Stelle im Feld-Mix wie zuvor im
    // unaufgeteilten AppDataContext.jsx gespreadet.
    ...hauptprotokollData,
    ...routinenData,
    ...zeitbloeckeData,
    ...coacheeNachrichtenData,
    ...coachWissenData,
    ...workflowData,
    ...bausteinVersionenData,
    ...questData,
    ...teamData,
    ...gruppenData,
    ...tagesplanAusnahmenData,
    ...kompletterResetData,
  });

  return <PlatformDataContext.Provider value={value}>{children}</PlatformDataContext.Provider>;
}

export function usePlatformData() {
  const ctx = useContext(PlatformDataContext);
  if (!ctx) throw new Error("usePlatformData muss innerhalb von PlatformDataProvider verwendet werden.");
  return ctx;
}
