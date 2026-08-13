import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import HauptprotokollErstellenView from "./HauptprotokollErstellenView";
import OnboardingIntroView from "./OnboardingIntroView";
import OnboardingZieleView from "./OnboardingZieleView";
import OnboardingProfilView from "./OnboardingProfilView";
import OnboardingLaborwerteView from "./OnboardingLaborwerteView";
import OnboardingRoutinenView from "./OnboardingRoutinenView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingSteckbriefView from "./OnboardingSteckbriefView";
import OnboardingCompletionView from "./OnboardingCompletionView";
import { useAppData } from "../../context/AppDataContext";
import { useAdmin } from "../../context/AdminContext";

// Koordiniert den einmaligen Einrichtungs-Ablauf nach der Registrierung:
// Willkommens-Folien → Hauptprotokoll anlegen (Name + Startdatum) →
// Ziel & Grund → Profil & Ausgangslage → Laborwerte → Morgen-/Abendroutine
// → Kategorien (Schlaf/Hydration/Ernährung/Training/Gewohnheiten/
// Supplemente/Medikamente/Peptid-Plan, je einzeln überspringbar, alle mit
// derselben "Jetzt einrichten?"-Gate-Seite) → Abschluss-Screen.
//
// Morgen-/Abendroutine bewusst VOR den Kategorien (Nutzerinnen-Vorgabe,
// 13.08.): der eigentliche Ursprungsgedanke der App war ADHS-gerechte
// Tagesstruktur, nicht Peptid-/Supplement-Tracking — alle Kategorien sind
// aus dieser Sicht Bausteine, die sich später der Routine zuordnen.
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
//
// Coach-verwaltetes Modell (Nutzerinnen-Vorgabe, 13.08.): eine Person, die
// NICHT selbst Admin ist und auch nicht gerade von der Admin verwaltet
// wird ("Verwalten als"), ist ein Coachee — die Admin richtet für sie
// Laborwerte/Routinen/Kategorien stellvertretend ein. Der Coachee
// durchläuft deshalb nach "profil" nur noch einen kurzen "steckbrief"
// statt der vollen Kategorie-Einrichtung. `istAdminModus` ist dieselbe
// Logik wie überall sonst (KiChat.jsx, AuthenticatedApp.jsx): entweder man
// ist selbst Admin, oder man verwaltet gerade jemanden stellvertretend.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const { proband } = useAdmin();
  const { isAdmin } = useAppData();
  const istAdminModus = proband !== null || isAdmin;
  const [phase, setPhase] = useState(startPhase); // welcome | hauptprotokoll | intro | ziele | profil | laborwerte | routinen | categories | steckbrief | celebration
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);

  if (phase === "welcome") {
    return <WelcomeView onDone={() => setPhase("hauptprotokoll")} onCancel={onCancel} />;
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
        nurManuell={!istAdminModus}
      />
    );
  }

  if (phase === "ziele") {
    return <OnboardingZieleView onDone={() => setPhase("profil")} onBack={() => setPhase("intro")} onCancel={onCancel} />;
  }

  if (phase === "profil") {
    return (
      <OnboardingProfilView
        onDone={() => setPhase(istAdminModus ? "laborwerte" : "steckbrief")}
        onBack={() => setPhase("ziele")}
        onCancel={onCancel}
      />
    );
  }

  if (phase === "steckbrief") {
    return <OnboardingSteckbriefView onDone={() => setPhase("celebration")} onBack={() => setPhase("profil")} onCancel={onCancel} />;
  }

  if (phase === "laborwerte") {
    return <OnboardingLaborwerteView onDone={() => setPhase("routinen")} onBack={() => setPhase("profil")} onCancel={onCancel} />;
  }

  if (phase === "routinen") {
    return <OnboardingRoutinenView onDone={() => setPhase("categories")} onBack={() => setPhase("laborwerte")} onCancel={onCancel} />;
  }

  if (phase === "categories") {
    return (
      <OnboardingCategoriesView
        onCancel={onCancel}
        onBackToStart={() => setPhase("routinen")}
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("celebration");
        }}
      />
    );
  }

  return (
    <OnboardingCompletionView
      eingerichteteBereiche={eingerichteteBereiche}
      onDone={onDone}
      onBack={() => setPhase(istAdminModus ? "categories" : "steckbrief")}
    />
  );
}
