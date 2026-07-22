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
import HormonView from "./views/HormonView";
import SchlafView from "./views/SchlafView";
import TrainingView from "./views/TrainingView";
import NutritionView from "./views/NutritionView";
import BlutzuckerView from "./views/BlutzuckerView";
import ProtokolleView from "./views/ProtokolleView";

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
    return (
      <ProtocolFormView
        step={step}
        setStep={setStep}
        onFinish={() => {
          completeOnboarding();
          setView("home");
        }}
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
    return <TagesplanView onHome={() => setView("home")} />;
  }

  if (view === "protokolle") {
    return <ProtokolleView onHome={() => setView("home")} />;
  }

  if (view === "peptide") {
    return <PeptidView onHome={() => setView("home")} />;
  }

  if (view === "hormone") {
    return <HormonView onHome={() => setView("home")} />;
  }

  if (view === "schlaf") {
    return <SchlafView onHome={() => setView("home")} />;
  }

  if (view === "training") {
    return <TrainingView onHome={() => setView("home")} />;
  }

  if (view === "ernaehrung") {
    return <NutritionView onHome={() => setView("home")} />;
  }

  if (view === "blutzucker") {
    return <BlutzuckerView onHome={() => setView("home")} />;
  }

  if (view === "statistik" || view === "profil" || view === "community" || view === "archiv" || view === "mehr") {
    return (
      <PlanView
        planTab={view}
        setPlanTab={setView}
        onHome={() => setView("home")}
        onEditProtocol={() => setView("form")}
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
