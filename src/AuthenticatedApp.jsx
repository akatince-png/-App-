import React, { useEffect, useState } from "react";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import { useAppData } from "./context/AppDataContext";
import HomeView from "./views/HomeView";
import LexikonView from "./views/LexikonView";
import SupplementeView from "./views/SupplementeView";
import TagesplanView from "./views/TagesplanView";
import ProtocolFormView from "./views/ProtocolFormView";
import PlanView from "./views/plan/PlanView";
import PeptidView from "./views/PeptidView";
import MedikamenteView from "./views/MedikamenteView";
import SchlafView from "./views/SchlafView";
import TrainingView from "./views/TrainingView";
import NutritionView from "./views/NutritionView";
import BlutzuckerView from "./views/BlutzuckerView";
import HydrationView from "./views/HydrationView";
import ProtokollLogView from "./views/ProtokollLogView";
import GewohnheitenView from "./views/GewohnheitenView";
import OnboardingFlow from "./views/onboarding/OnboardingFlow";

// Übersetzt die Kategorie eines Tagesplan-Eintrags in die zuständige View —
// für den ✏️-Bearbeiten-Kurzweg direkt aus dem Tagesplan.
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
  const { loading, onboardingComplete, completeOnboarding } = useAppData();
  const [view, setView] = useState(null); // null = noch nicht entschieden, dann 'home' | 'form' | 'plan' | 'lexikon' | 'supplemente' | ...
  const [step, setStep] = useState(0);
  // Trägt die Trainings-ID, wenn der Tagesplan direkt ins Live-Workout
  // springen soll — wird von TrainingView nach dem Öffnen zurückgesetzt.
  const [offenesTrainingId, setOffenesTrainingId] = useState(null);

  useEffect(() => {
    if (!loading && view === null) {
      // Neue Konten ohne abgeschlossenes Onboarding starten direkt im Frage-Assistenten.
      setView(onboardingComplete ? "home" : "form");
    }
  }, [loading, onboardingComplete, view]);

  if (loading || view === null) {
    return <LoadingScreen />;
  }

  if (view === "form") {
    if (!onboardingComplete) {
      return (
        <OnboardingFlow
          onDone={() => {
            completeOnboarding();
            setView("home");
          }}
        />
      );
    }
    // Bestehendes Konto startet hier ein zusätzliches, komplett neues
    // Protokoll — kein erneutes Durchlaufen des Einrichtungs-Abschlusses.
    return (
      <ProtocolFormView
        step={step}
        setStep={setStep}
        onFinish={() => setView("home")}
      />
    );
  }

  if (view === "lexikon") {
    return <LexikonView onHome={() => setView("home")} />;
  }

  if (view === "supplemente") {
    return <SupplementeView onHome={() => setView("home")} />;
  }

  if (view === "tagesplan") {
    return (
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
  }

  if (view === "verlauf") {
    return <ProtokollLogView onHome={() => setView("home")} />;
  }

  if (view === "routinen") {
    return <GewohnheitenView onHome={() => setView("home")} />;
  }

  if (view === "peptide") {
    return <PeptidView onHome={() => setView("home")} />;
  }

  if (view === "medikamente") {
    return <MedikamenteView onHome={() => setView("home")} />;
  }

  if (view === "schlaf") {
    return <SchlafView onHome={() => setView("home")} />;
  }

  if (view === "training") {
    return (
      <TrainingView
        onHome={() => setView("home")}
        initialSessionId={offenesTrainingId}
        onConsumedInitialSession={() => setOffenesTrainingId(null)}
      />
    );
  }

  if (view === "ernaehrung") {
    return <NutritionView onHome={() => setView("home")} />;
  }

  if (view === "blutzucker") {
    return <BlutzuckerView onHome={() => setView("home")} />;
  }

  if (view === "hydration") {
    return <HydrationView onHome={() => setView("home")} />;
  }

  if (view === "statistik" || view === "profil" || view === "community" || view === "archiv" || view === "mehr") {
    return (
      <PlanView
        planTab={view}
        setPlanTab={setView}
        onHome={() => setView("home")}
        onEditProtocol={() => setView("peptide")}
      />
    );
  }

  return (
    <HomeView
      onOpenView={(id) => setView(id)}
      onNewProtocol={() => {
        setView("form");
        setStep(0);
      }}
    />
  );
}
