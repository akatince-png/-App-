import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import HauptprotokollErstellenView from "./HauptprotokollErstellenView";
import OnboardingIntroView from "./OnboardingIntroView";
import OnboardingZieleView from "./OnboardingZieleView";
import OnboardingProfilView from "./OnboardingProfilView";
import OnboardingLaborwerteView from "./OnboardingLaborwerteView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingCompletionView from "./OnboardingCompletionView";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Hauptprotokoll anlegen (Name + Startdatum) →
// Ziel & Grund → Profil & Ausgangslage → Laborwerte → Kategorien
// (Schlaf/Hydration/Ernährung/Training/Gewohnheiten/Supplemente/
// Medikamente/Peptid-Plan, je einzeln überspringbar, alle mit derselben
// "Jetzt einrichten?"-Gate-Seite) → Abschluss-Screen.
//
// Ziel & Grund, Profil und Laborwerte kommen bewusst VOR den Plänen: erst
// klären, warum und von welcher Ausgangslage aus geplant wird, dann planen.
// Ziel & Grund war früher Schritt 1/5 im separaten Peptid-Assistenten,
// Laborwerte waren der letzte Kategorie-Schritt ("Biomarker-Plan") — beide
// gelten aber protokollweit und nicht nur für einen Teilbereich.
//
// Derselbe Ablauf wird auch für den "+"-Button bei bestehenden Konten
// wiederverwendet ("Neues Protokoll") — dort startet er direkt bei
// "hauptprotokoll" (die Willkommens-Folien sind nur für echte
// Erstanmeldungen sinnvoll), durchläuft danach aber exakt dieselben
// Schritte in derselben Reihenfolge, und bekommt über `onCancel` einen
// echten Abbrechen-Knopf, den es beim ursprünglichen Erst-Onboarding nicht
// gibt.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const [phase, setPhase] = useState(startPhase); // welcome | hauptprotokoll | intro | ziele | profil | laborwerte | categories | celebration
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);

  if (phase === "welcome") {
    return <WelcomeView onDone={() => setPhase("hauptprotokoll")} />;
  }

  if (phase === "hauptprotokoll") {
    return <HauptprotokollErstellenView onDone={() => setPhase("intro")} onBack={() => setPhase("welcome")} onCancel={onCancel} />;
  }

  if (phase === "intro") {
    // Bei Coach-Begleitung deckt OnboardingIntroView (über OnboardingCoachGuide)
    // Name, Ziele UND Profil direkt mit ab — dann direkt zu "laborwerte"
    // statt die (bereits erledigten) Phasen "ziele"/"profil" nochmal manuell
    // zu durchlaufen.
    return (
      <OnboardingIntroView
        onDone={(opts) => setPhase(opts?.guided ? "laborwerte" : "ziele")}
        onBack={() => setPhase("hauptprotokoll")}
        onCancel={onCancel}
      />
    );
  }

  if (phase === "ziele") {
    return <OnboardingZieleView onDone={() => setPhase("profil")} onBack={() => setPhase("intro")} onCancel={onCancel} />;
  }

  if (phase === "profil") {
    return <OnboardingProfilView onDone={() => setPhase("laborwerte")} onBack={() => setPhase("ziele")} onCancel={onCancel} />;
  }

  if (phase === "laborwerte") {
    return <OnboardingLaborwerteView onDone={() => setPhase("categories")} onBack={() => setPhase("profil")} onCancel={onCancel} />;
  }

  if (phase === "categories") {
    return (
      <OnboardingCategoriesView
        onCancel={onCancel}
        onBackToStart={() => setPhase("laborwerte")}
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("celebration");
        }}
      />
    );
  }

  return <OnboardingCompletionView eingerichteteBereiche={eingerichteteBereiche} onDone={onDone} onBack={() => setPhase("categories")} />;
}
