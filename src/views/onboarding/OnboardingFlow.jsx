import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import ProtocolFormView from "../ProtocolFormView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingCompletionView from "./OnboardingCompletionView";
import { useAppData } from "../../context/AppDataContext";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Protokoll-Fragebogen (Peptide) → Kategorien
// (Gewohnheiten/Schlaf/Hydration/Ernährung/Training/Supplemente/
// Medikamente, je einzeln überspringbar) → Abschluss-Screen. Danach führt
// kein Weg mehr zurück in diesen Ablauf — spätere Änderungen an laufenden
// Plänen passieren direkt in den jeweiligen Kategorie-Ansichten.
export default function OnboardingFlow({ onDone }) {
  const { ziele, peptide } = useAppData();
  const [phase, setPhase] = useState("welcome"); // welcome | protocol | categories | celebration
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
