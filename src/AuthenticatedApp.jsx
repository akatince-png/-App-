import React, { useState } from "react";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import { useAppData } from "./context/AppDataContext";
import HomeView from "./views/HomeView";
import LexikonView from "./views/LexikonView";
import SupplementeView from "./views/SupplementeView";
import ProtocolFormView from "./views/ProtocolFormView";
import PlanView from "./views/plan/PlanView";

export default function AuthenticatedApp() {
  const { loading } = useAppData();
  const [view, setView] = useState("home"); // 'home' | 'form' | 'plan' | 'lexikon' | 'supplemente'
  const [step, setStep] = useState(0);
  const [planTab, setPlanTab] = useState("plan"); // 'plan' | 'statistik' | 'profil' | 'community' | 'archiv' | 'mehr'
  const [protokollTyp, setProtokollTyp] = useState("peptide"); // 'peptide' | 'schlaf' | 'hormon' | 'weitere'

  if (loading) {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>
          Daten werden geladen...
        </div>
      </Shell>
    );
  }

  const goToPlanTab = (tab) => {
    setPlanTab(tab);
    setView("plan");
  };

  if (view === "form") {
    return <ProtocolFormView step={step} setStep={setStep} onFinish={() => setView("plan")} />;
  }

  if (view === "lexikon") {
    return <LexikonView onHome={() => setView("home")} />;
  }

  if (view === "supplemente") {
    return <SupplementeView onHome={() => setView("home")} />;
  }

  if (view === "plan") {
    return (
      <PlanView
        planTab={planTab}
        setPlanTab={setPlanTab}
        protokollTyp={protokollTyp}
        setProtokollTyp={setProtokollTyp}
        onHome={() => setView("home")}
        onEditProtocol={() => setView("form")}
      />
    );
  }

  return (
    <HomeView
      onOpenView={(id) => {
        if (id === "lexikon" || id === "supplemente") setView(id);
        else goToPlanTab(id);
      }}
      onNewProtocol={() => {
        setView("form");
        setStep(0);
      }}
    />
  );
}
