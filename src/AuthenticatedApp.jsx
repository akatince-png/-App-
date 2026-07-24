import React, { useEffect, useState } from "react";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import { useAppData } from "./context/AppDataContext";
import HomeView from "./views/HomeView";
import LexikonView from "./views/LexikonView";
import TagesplanView from "./views/TagesplanView";
import PlanView from "./views/plan/PlanView";
import PlaeneView from "./views/plan/PlaeneView";
import MehrView from "./views/plan/MehrView";
import GewohnheitenView from "./views/GewohnheitenView";
import OnboardingFlow from "./views/onboarding/OnboardingFlow";
import Fab from "./ui/Fab";
import { PLAENE_TABS } from "./constants";
import { wochenprotokollFaellig, baueWochenprotokollDaten } from "./utils/wochenprotokollSnapshot";

const PLAENE_VIEW_IDS = PLAENE_TABS.map((t) => t.id);
const ARCHIV_VIEW_IDS = ["verlauf", "archiv", "statistik", "profil", "blutzucker", "community"];

// Übersetzt die Kategorie eines Tagesplan-Eintrags in die zuständige View —
// für den ✏️-Bearbeiten-Kurzweg direkt aus dem Tagesplan. Die Pläne-
// Kategorien landen jetzt alle im "Alle Pläne"-Hub (PlaeneView), der
// jeweilige `view`-Wert dient dort direkt als aktiver Reiter.
const KATEGORIE_TO_VIEW = {
  peptid: "peptide",
  hormon: "medikamente",
  supplement: "supplemente",
  gewohnheit: "routinen",
  hydration: "hydration",
  mahlzeit: "ernaehrung",
};

function LoadingScreen() {
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>Daten werden geladen...</div>
    </Shell>
  );
}

export default function AuthenticatedApp() {
  const appData = useAppData();
  const {
    loading,
    onboardingComplete,
    completeOnboarding,
    protocolId,
    startdatum,
    wochenprotokollSnapshots,
    wochenprotokollSnapshotErzeugen,
    ziele,
    peptide,
    protokollArchivieren,
  } = appData;
  const [view, setView] = useState(null); // null = noch nicht entschieden, dann 'home' | 'form' | 'plan' | 'lexikon' | ...
  // Trägt die Trainings-ID, wenn der Tagesplan direkt ins Live-Workout
  // springen soll — wird von TrainingView nach dem Öffnen zurückgesetzt.
  const [offenesTrainingId, setOffenesTrainingId] = useState(null);

  useEffect(() => {
    if (!loading && view === null) {
      // Neue Konten ohne abgeschlossenes Onboarding starten direkt im Frage-Assistenten.
      setView(onboardingComplete ? "home" : "form");
    }
  }, [loading, onboardingComplete, view]);

  // "Automatisch" heißt hier: beim nächsten App-Öffnen nach Ablauf der
  // ersten 7 Tage seit Protokoll-Start prüfen, ob schon ein Erste-Woche-
  // Snapshot existiert — falls nicht, einmalig erzeugen (siehe
  // src/utils/wochenprotokollSnapshot.js).
  useEffect(() => {
    if (loading || !onboardingComplete || !protocolId) return;
    if (!wochenprotokollFaellig({ startdatum, wochenprotokollSnapshots })) return;
    wochenprotokollSnapshotErzeugen(protocolId, 1, baueWochenprotokollDaten(appData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, onboardingComplete, protocolId, startdatum, wochenprotokollSnapshots]);

  if (loading || view === null) {
    return <LoadingScreen />;
  }

  // "Neues Protokoll" muss wirklich leer starten. Die Formularfelder hängen
  // direkt am aktiven Protokoll (useProtocolData) — ohne diesen Schritt
  // würde der Aufruf einfach das laufende Protokoll mit alten Werten zum
  // Bearbeiten öffnen (bestätigter Bug: alte Auswahl blieb stehen). Ist das
  // aktive Protokoll schon leer (z. B. direkt nach dem Archivieren), ist
  // nichts zu tun.
  const neuesProtokoll = async () => {
    if (ziele.length > 0 || peptide.length > 0) {
      await protokollArchivieren();
    }
    setView("form");
  };

  let screen;

  if (view === "form") {
    screen = !onboardingComplete ? (
      <OnboardingFlow
        onDone={() => {
          completeOnboarding();
          setView("home");
        }}
      />
    ) : (
      // Bestehendes Konto durchläuft hier denselben Fragebogen-Ablauf wie
      // beim Erst-Onboarding (Peptid-Protokoll + alle Kategorien, jede
      // einzeln überspringbar) — nur ohne die Willkommens-Folien und mit
      // einem echten Abbrechen-Knopf.
      <OnboardingFlow startPhase="protocol" onCancel={() => setView("home")} onDone={() => setView("home")} />
    );
  } else if (view === "lexikon") {
    screen = <LexikonView onHome={() => setView("home")} />;
  } else if (view === "tagesplan") {
    screen = (
      <TagesplanView
        onHome={() => setView("home")}
        onOpenTraining={(id) => {
          setOffenesTrainingId(id);
          setView("training");
        }}
        onEditItem={(kategorie) => {
          const ziel = KATEGORIE_TO_VIEW[kategorie];
          if (ziel) setView(ziel);
        }}
      />
    );
  } else if (view === "routinen") {
    screen = <GewohnheitenView onHome={() => setView("home")} />;
  } else if (PLAENE_VIEW_IDS.includes(view)) {
    screen = (
      <PlaeneView
        planeTab={view}
        setPlaneTab={setView}
        onHome={() => setView("home")}
        initialSessionId={offenesTrainingId}
        onConsumedInitialSession={() => setOffenesTrainingId(null)}
      />
    );
  } else if (ARCHIV_VIEW_IDS.includes(view)) {
    screen = <PlanView planTab={view} setPlanTab={setView} onHome={() => setView("home")} onEditProtocol={() => setView("peptide")} />;
  } else if (view === "mehr") {
    screen = <MehrView onHome={() => setView("home")} onOpenLexikon={() => setView("lexikon")} />;
  } else {
    screen = <HomeView onOpenView={(id) => setView(id)} />;
  }

  const zeigeFab = view !== "form";

  return (
    <>
      <div style={{ paddingBottom: zeigeFab ? 90 : 0 }}>{screen}</div>
      {zeigeFab && <Fab onClick={neuesProtokoll} />}
    </>
  );
}
