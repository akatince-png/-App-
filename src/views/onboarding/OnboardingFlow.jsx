import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import ProtocolFormView from "../ProtocolFormView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingCompletionView from "./OnboardingCompletionView";
import { useAppData } from "../../context/AppDataContext";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Protokoll-Fragebogen (Peptide) → Kategorien
// (Gewohnheiten/Schlaf/Hydration/Ernährung/Training/Supplemente/
// Medikamente, je einzeln überspringbar) → Abschluss-Screen.
//
// Derselbe Ablauf wird auch für den "+"-Button bei bestehenden Konten
// wiederverwendet ("Neues Protokoll") — dort startet er per `startPhase`
// direkt bei "protocol" (die Willkommens-Folien sind nur für echte
// Erstanmeldungen sinnvoll) und bekommt über `onCancel` einen echten
// Abbrechen-Knopf, den es beim ursprünglichen Erst-Onboarding nicht gibt.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const { ziele, peptide } = useAppData();
  const [phase, setPhase] = useState(startPhase); // welcome | protocol | categories | celebration
  const [protocolStep, setProtocolStep] = useState(0);
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);

  if (phase === "welcome") {
    return <WelcomeView onDone={() => setPhase("protocol")} />;
  }

  if (phase === "protocol") {
    return (
      <ProtocolFormView
        step={protocolStep}
        setStep={setProtocolStep}
        onFinish={() => setPhase("categories")}
        onHome={onCancel}
      />
    );
  }

  if (phase === "categories") {
    return (
      <OnboardingCategoriesView
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("celebration");
        }}
      />
    );
  }

  const peptidProtokollEingerichtet = ziele.length > 0 || peptide.length > 0;
  return (
    <OnboardingCompletionView
      eingerichteteBereiche={
        peptidProtokollEingerichtet ? [{ icon: "💊", label: "Peptid-Protokoll" }, ...eingerichteteBereiche] : eingerichteteBereiche
      }
      onDone={onDone}
    />
  );
}
