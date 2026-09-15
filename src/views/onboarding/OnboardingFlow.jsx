import React, { useState } from "react";
import WelcomeView from "../WelcomeView";
import HauptprotokollErstellenView from "./HauptprotokollErstellenView";
import OnboardingQuickWinView from "./OnboardingQuickWinView";
import OnboardingWerteAktualisierenView from "./OnboardingWerteAktualisierenView";
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
// Quick-Win-Zwischenscreen → Vorstellung (Name) → Ziel & Grund → Profil &
// Ausgangslage → Laborwerte → Morgen-/Abendroutine → Kategorien (Schlaf/
// Hydration/Ernährung/Training/Gewohnheiten/Supplemente/Medikamente/
// Peptid-Plan, je einzeln überspringbar, alle mit derselben "Jetzt
// einrichten?"-Gate-Seite) → Abschluss-Screen.
//
// Quick-Win-Zwischenscreen (App-Bauplan-Punkt, ADHS-Perspektive, siehe
// OnboardingQuickWinView.jsx): direkt nach dem allerersten, kleinsten
// Schritt (Hauptprotokoll anlegen) gibt's schon eine echte, sichtbare
// Bestätigung — statt dass der einzige Erfolgsmoment erst ganz am Ende
// nach dem gesamten langen Fragebogen-Teil kommt.
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
// "Neues Protokoll" beim "+"-Button (Nutzerinnen-Vorgabe, 15.09.,
// istDirekterNeuStart unten): läuft NICHT mehr den kompletten
// Erst-Onboarding-Fragebogen nochmal durch — Name/Quick-Win-Feier machen
// bei einem bereits bestehenden Konto keinen Sinn, und Ziel/Profildaten
// sind schon gespeichert. Startet direkt bei "hauptprotokoll" (Name+Datum
// fürs neue Protokoll), geht danach sofort zu "werteAktualisieren" (siehe
// OnboardingWerteAktualisierenView.jsx: "Nein, weiter" springt direkt zu
// den inhaltlichen Protokoll-Schritten, "Ja" führt noch kurz durch Ziel +
// Profil, beide vorausgefüllt mit den bestehenden Werten) — die Phasen
// "quickwin" und "intro" (Name erneut abfragen) werden dabei komplett
// übersprungen. Der ursprüngliche Erst-Onboarding-Ablauf (ohne
// startPhase="hauptprotokoll") bleibt davon unberührt.
//
// Coach-verwaltetes Modell (Nutzerinnen-Vorgabe, 13.08.): eine Person, die
// NICHT selbst Admin ist und auch nicht gerade von der Admin verwaltet
// wird ("Verwalten als"), ist ein Coachee — die Admin richtet für sie
// Laborwerte/Routinen/Kategorien stellvertretend ein. Der Coachee
// durchläuft deshalb nach "profil" standardmäßig nur noch einen kurzen
// "steckbrief" statt der vollen Kategorie-Einrichtung. `istAdminModus` ist
// dieselbe Logik wie überall sonst (KiChat.jsx, AuthenticatedApp.jsx):
// entweder man ist selbst Admin, oder man verwaltet gerade jemanden
// stellvertretend.
//
// Erweiterung 16.08. (Nutzerinnen-Vorgabe: "verschiedene Coaching-Modelle
// anbieten ... manche werden mehr selbst geführt, manche komplett von mir
// geleitet"): die Admin kann pro Coachee (bei Einladung oder nachträglich
// im Admin-Dashboard) `onboarding_modus` auf "lang" statt "kurz" stellen —
// dann durchläuft auch die Coachee selbst die volle Kategorie-Einrichtung
// statt nur den Steckbrief. Betrifft NUR den Steckbrief/Kategorien-Zweig
// unten (`vollstaendigesOnboarding`) — `nurManuell` bei OnboardingIntroView
// bleibt an `istAdminModus` hängen, weil die Coach-geführte Variante dort
// wirklich die Admin persönlich im Chat braucht, nicht nur einen längeren
// Fragebogen.
export default function OnboardingFlow({ onDone, startPhase = "welcome", onCancel }) {
  const { proband } = useAdmin();
  const { isAdmin, onboardingModus } = useAppData();
  const istAdminModus = proband !== null || isAdmin;
  const vollstaendigesOnboarding = istAdminModus || onboardingModus === "lang";
  const [phase, setPhase] = useState(startPhase); // welcome | hauptprotokoll | quickwin | werteAktualisieren | intro | ziele | profil | laborwerte | routinen | categories | steckbrief | celebration
  const [eingerichteteBereiche, setEingerichteteBereiche] = useState([]);
  // Nur beim normalen Durchlauf (Erst-Onboarding oder erneutes Durchlaufen
  // über "Mehr") darf HauptprotokollErstellenView ein bestehendes aktives
  // Hauptprotokoll als "Weiter damit"-Option anbieten, statt ungefragt ein
  // neues anzulegen. Der explizite "+"-Button ("Neues Protokoll") startet
  // absichtlich direkt mit startPhase="hauptprotokoll" — dort ist ein neues
  // Protokoll der ganze Zweck, also bleibt es beim bisherigen Verhalten.
  // Dieselbe Unterscheidung steuert jetzt auch, ob nach dem Hauptprotokoll-
  // Schritt der volle Fragebogen (Erst-Onboarding) oder der verkürzte
  // Ablauf über "werteAktualisieren" (bestehendes Konto) folgt.
  const [istDirekterNeuStart] = useState(startPhase === "hauptprotokoll");
  // Nur relevant für istDirekterNeuStart: ob "Ziel"/"Profil" in diesem Lauf
  // tatsächlich gezeigt wurden (über "Ja, kurz aktualisieren" in
  // OnboardingWerteAktualisierenView) — steuert die Zurück-Ziele von
  // "ziele"/"laborwerte"/"steckbrief" weiter unten, damit der
  // Zurück-Pfeil nie auf eine in diesem Lauf übersprungene Phase
  // (z. B. "intro"/"profil") zeigt. Beim normalen Erst-Onboarding immer
  // wahr, weil dort ohnehin jede Phase der Reihe nach durchlaufen wird.
  const [zieleProfilBesucht, setZieleProfilBesucht] = useState(!istDirekterNeuStart);

  let screen;

  if (phase === "welcome") {
    screen = <WelcomeView onDone={() => setPhase("hauptprotokoll")} onCancel={onCancel} />;
  } else if (phase === "hauptprotokoll") {
    screen = (
      <HauptprotokollErstellenView
        onDone={() => setPhase(istDirekterNeuStart ? "werteAktualisieren" : "quickwin")}
        onBack={() => setPhase("welcome")}
        onCancel={onCancel}
        zeigeBestehendesAlsOption={!istDirekterNeuStart}
      />
    );
  } else if (phase === "quickwin") {
    screen = <OnboardingQuickWinView onDone={() => setPhase("intro")} onBack={() => setPhase("hauptprotokoll")} />;
  } else if (phase === "werteAktualisieren") {
    screen = (
      <OnboardingWerteAktualisierenView
        onJa={() => {
          setZieleProfilBesucht(true);
          setPhase("ziele");
        }}
        onNein={() => setPhase(vollstaendigesOnboarding ? "laborwerte" : "steckbrief")}
        onBack={() => setPhase("hauptprotokoll")}
        onCancel={onCancel}
      />
    );
  } else if (phase === "intro") {
    // Bei Coach-Begleitung deckt OnboardingIntroView (über OnboardingCoachGuide)
    // Name, Ziele UND Profil direkt mit ab — dann direkt zu "laborwerte"
    // statt die (bereits erledigten) Phasen "ziele"/"profil" nochmal manuell
    // zu durchlaufen.
    screen = (
      <OnboardingIntroView
        onDone={(opts) => setPhase(opts?.guided ? "laborwerte" : "ziele")}
        onBack={() => setPhase("quickwin")}
        onCancel={onCancel}
        nurManuell={!istAdminModus}
      />
    );
  } else if (phase === "ziele") {
    screen = (
      <OnboardingZieleView
        onDone={() => setPhase("profil")}
        onBack={() => setPhase(istDirekterNeuStart ? "werteAktualisieren" : "intro")}
        onCancel={onCancel}
      />
    );
  } else if (phase === "profil") {
    screen = (
      <OnboardingProfilView
        onDone={() => setPhase(vollstaendigesOnboarding ? "laborwerte" : "steckbrief")}
        onBack={() => setPhase("ziele")}
        onCancel={onCancel}
      />
    );
  } else if (phase === "steckbrief") {
    screen = (
      <OnboardingSteckbriefView
        onDone={() => setPhase("celebration")}
        onBack={() => setPhase(zieleProfilBesucht ? "profil" : "werteAktualisieren")}
        onCancel={onCancel}
      />
    );
  } else if (phase === "laborwerte") {
    screen = (
      <OnboardingLaborwerteView
        onDone={() => setPhase("routinen")}
        onBack={() => setPhase(zieleProfilBesucht ? "profil" : "werteAktualisieren")}
        onCancel={onCancel}
      />
    );
  } else if (phase === "routinen") {
    screen = <OnboardingRoutinenView onDone={() => setPhase("categories")} onBack={() => setPhase("laborwerte")} onCancel={onCancel} />;
  } else if (phase === "categories") {
    screen = (
      <OnboardingCategoriesView
        onCancel={onCancel}
        onBackToStart={() => setPhase("routinen")}
        onFinished={(bereiche) => {
          setEingerichteteBereiche(bereiche);
          setPhase("celebration");
        }}
      />
    );
  } else {
    screen = (
      <OnboardingCompletionView
        eingerichteteBereiche={eingerichteteBereiche}
        onDone={onDone}
        onBack={() => setPhase(vollstaendigesOnboarding ? "categories" : "steckbrief")}
      />
    );
  }

  // Verbesserung ("Übergänge nicht flüssig"): siehe AuthenticatedApp.jsx für
  // dieselbe Begründung — jeder Phasenwechsel war bisher ein harter,
  // unanimierter Komponentenaustausch. key={phase} + die vorhandene
  // fadeInUp-Animation (wie schon in WelcomeView.jsx) sorgt für ein sanftes
  // Einblenden statt eines harten Schnitts bei jedem "Weiter"/"Zurück".
  return (
    <div key={phase} style={{ animation: "fadeInUp 0.35s ease-out" }}>
      {screen}
    </div>
  );
}
