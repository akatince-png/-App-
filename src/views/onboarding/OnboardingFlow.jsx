import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import HauptprotokollErstellenView from "./HauptprotokollErstellenView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingCompletionView from "./OnboardingCompletionView";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Hauptprotokoll anlegen (Name + Startdatum) →
// Kategorien (Schlaf/Hydration/Ernährung/Training/Gewohnheiten/Supplemente/
// Medikamente/Peptid-Protokoll, je einzeln überspringbar, alle mit derselben
// "Jetzt einrichten?"-Gate-Seite) → Abschluss-Screen. Die Kategorie-
// Reihenfolge geht bewusst vom natürlichsten/alltäglichsten Tracking-Punkt
// zum unnatürlichsten/klinischsten — Peptide laufen deshalb ganz am Ende,
// als letzter Kategorie-Schritt (siehe categorySteps.js).
//
// Derselbe Ablauf wird auch für den "+"-Button bei bestehenden Konten
// wiederverwendet ("Neues Protokoll") — dort startet er direkt bei
// "hauptprotokoll" (die Willkommens-Folien sind nur für echte
// Erstanmeldungen sinnvoll), legt also ein neues, benanntes Hauptprotokoll
// an (archiviert dabei automatisch das vorherige), und bekommt über
// `onCancel` einen echten Abbrechen-Knopf, den es beim ursprünglichen
// Erst-Onboarding nicht gibt.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const [phase, setPhase] = useState(startPhase); // welcome | hauptprotokoll | categories | celebration
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);

  if (phase === "welcome") {
    return <WelcomeView onDone={() => setPhase("hauptprotokoll")} />;
  }

  if (phase === "hauptprotokoll") {
    return <HauptprotokollErstellenView onDone={() => setPhase("categories")} onCancel={onCancel} />;
  }

  if (phase === "categories") {
    return (
      <OnboardingCategoriesView
        onCancel={onCancel}
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("celebration");
        }}
      />
    );
  }

  return <OnboardingCompletionView eingerichteteBereiche={eingerichteteBereiche} onDone={onDone} />;
}
