import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import ProtocolFormView from "../ProtocolFormView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingCompletionView from "./OnboardingCompletionView";
import { useAppData } from "../../context/AppDataContext";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Kategorien (Schlaf/Hydration/Ernährung/Training/
// Gewohnheiten/Supplemente/Medikamente, je einzeln überspringbar) →
// Protokoll-Fragebogen (Peptide) → Abschluss-Screen. Die Reihenfolge geht
// bewusst vom natürlichsten/alltäglichsten Tracking-Punkt zum
// unnatürlichsten/klinischsten — Peptide laufen deshalb ganz am Ende, nicht
// direkt nach den Willkommens-Folien.
//
// Derselbe Ablauf wird auch für den "+"-Button bei bestehenden Konten
// wiederverwendet ("Neues Protokoll") — dort startet er per `startPhase`
// direkt bei "categories" (die Willkommens-Folien sind nur für echte
// Erstanmeldungen sinnvoll) und bekommt über `onCancel` einen echten
// Abbrechen-Knopf, den es beim ursprünglichen Erst-Onboarding nicht gibt.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const { ziele, peptide } = useAppData();
  const [phase, setPhase] = useState(startPhase); // welcome | categories | protocol | celebration
  const [protocolStep, setProtocolStep] = useState(0);
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);

  if (phase === "welcome") {
    return <WelcomeView onDone={() => setPhase("categories")} />;
  }

  if (phase === "categories") {
    return (
      <OnboardingCategoriesView
        onCancel={onCancel}
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("protocol");
        }}
      />
    );
  }

  if (phase === "protocol") {
    return (
      <ProtocolFormView
        step={protocolStep}
        setStep={setProtocolStep}
        onFinish={() => setPhase("celebration")}
        onHome={onCancel}
      />
    );
  }

  const peptidProtokollEingerichtet = ziele.length > 0 || peptide.length > 0;
  return (
    <OnboardingCompletionView
      eingerichteteBereiche={
        peptidProtokollEingerichtet ? [...eingerichteteBereiche, { icon: "💊", label: "Peptid-Protokoll" }] : eingerichteteBereiche
      }
      onDone={onDone}
    />
  );
}
