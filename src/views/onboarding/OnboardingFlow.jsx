import React, { useEffect, useState } from "react";
import WelcomeView from "../WelcomeView";
import HauptprotokollErstellenView from "./HauptprotokollErstellenView";
import OnboardingQuickWinView from "./OnboardingQuickWinView";
import OnboardingWerteAktualisierenView from "./OnboardingWerteAktualisierenView";
import OnboardingIntroView from "./OnboardingIntroView";
import OnboardingKiWahlView from "./OnboardingKiWahlView";
import OnboardingZieleView from "./OnboardingZieleView";
import OnboardingProfilView from "./OnboardingProfilView";
import OnboardingLaborwerteView from "./OnboardingLaborwerteView";
import OnboardingRoutinenView from "./OnboardingRoutinenView";
import OnboardingCategoriesView from "./OnboardingCategoriesView";
import OnboardingSteckbriefView from "./OnboardingSteckbriefView";
import OnboardingCompletionView from "./OnboardingCompletionView";
import { useAppData } from "../../context/AppDataContext";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";

// Bug-Fix (Nutzerinnen-Report, 16.09.: "wenn ich die Seite aktualisiere, bin
// ich wieder ganz am Anfang"): `phase` lebte bisher nur in useState — ein
// Browser-Reload (z. B. weil ein Speichern-Versuch mittendrin fehlschlug und
// die Person die Seite neu geladen hat) warf den kompletten Fortschritt weg
// und startete wieder bei `startPhase`. Jetzt wird die aktuelle Phase bei
// jedem Wechsel in localStorage gespiegelt und beim (Wieder-)Laden zurück-
// gelesen — aber nur, wenn sie zu genau diesem Lauf gehört (gleiche
// `userId`+`startPhase`), damit ein Reload mitten im normalen
// Erst-Onboarding nicht versehentlich in einem alten "Neues Protokoll"-Lauf
// (oder umgekehrt) landet. Wird bewusst gelöscht, sobald der Ablauf normal
// zu Ende läuft (`onDone`) oder abgebrochen wird (`onCancel`) — ein danach
// neu gestarteter Durchlauf soll wieder ganz vorne beginnen, nicht im alten
// Fortschritt stecken bleiben.
const ONBOARDING_PHASE_KEY = "onboardingPhaseFortschritt";

function ladeGespeichertePhase(userId, startPhase) {
  if (typeof window === "undefined") return null;
  try {
    const gespeichert = JSON.parse(localStorage.getItem(ONBOARDING_PHASE_KEY) || "null");
    if (!gespeichert || gespeichert.userId !== userId || gespeichert.startPhase !== startPhase) return null;
    return gespeichert.phase || null;
  } catch {
    return null;
  }
}

function speicherePhase(userId, startPhase, phase) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_PHASE_KEY, JSON.stringify({ userId, startPhase, phase }));
  } catch {
    // LocalStorage nicht verfügbar — Fortschritt geht bei einem Reload dann weiter verloren, wie bisher.
  }
}

function loescheGespeichertePhase() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ONBOARDING_PHASE_KEY);
  } catch {
    // ignorieren
  }
}

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
// bei einem bereits bestehenden Konto keinen Sinn. Startet direkt bei
// "hauptprotokoll" (Name+Datum fürs neue Protokoll), geht danach zu
// "kiWahl" (Nutzerinnen-Vorgabe, 16.09.: "ob ich es alleine oder mit der KI
// machen möchte", siehe OnboardingKiWahlView.jsx — bewusst früh, direkt
// nach dem Protokollnamen) und dann zu "ziele" — die Phasen "quickwin" und
// "intro" (Name erneut abfragen) werden dabei komplett übersprungen.
//
// "Ziel & Grund" bleibt bewusst ein PFLICHT-Schritt auch für "Neues
// Protokoll" (Nutzerinnen-Vorgabe, 15.09.: "es ist ja ohnehin klar, dass
// ein Ziel für das jeweilige Protokoll definiert werden muss oder wird...
// kann auch einfach nur Alltagsprotokoll sein") — jedes neue Protokoll
// bekommt sein eigenes Ziel (oder ausdrücklich keins, leer lassen und
// "Weiter" reicht). Die Checkbox-Liste ist dabei garantiert LEER, nicht
// mit den alten Zielen vorausgefüllt: `neuesProtokoll()` in
// AuthenticatedApp.jsx archiviert das bisherige aktive Peptid-Protokoll
// und legt ein neues mit `ziele: []` an (useProtocolData.js,
// protokollArchivieren), bevor dieser Bildschirm überhaupt erreichbar
// ist — anders als die Profildaten (Geschlecht/Geburtsdatum/Größe/
// Gewicht), die sich sinnvollerweise NICHT pro Protokoll zurücksetzen,
// weil sie die Person selbst beschreiben, nicht das einzelne Protokoll.
//
// Nach "ziele" kommt "werteAktualisieren" (siehe
// OnboardingWerteAktualisierenView.jsx) — fragt NUR noch nach den
// Profildaten: "Nein, weiter" springt direkt zu den inhaltlichen
// Protokoll-Schritten, "Ja" führt noch kurz durch Profil, vorausgefüllt
// mit den bestehenden gespeicherten Werten (hier ist Vorausfüllen
// richtig — man bearbeitet echte, weiterhin gültige Personendaten, legt
// kein neues Protokoll-Ziel fest). Der ursprüngliche Erst-Onboarding-
// Ablauf (ohne startPhase="hauptprotokoll") bleibt davon unberührt.
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
  const { user } = useAuth();
  const istAdminModus = proband !== null || isAdmin;
  const vollstaendigesOnboarding = istAdminModus || onboardingModus === "lang";
  const [phase, setPhase] = useState(
    () => ladeGespeichertePhase(user?.id, startPhase) || startPhase
  ); // welcome | hauptprotokoll | kiWahl | quickwin | intro | ziele | werteAktualisieren | profil | laborwerte | routinen | categories | steckbrief | celebration
  useEffect(() => {
    speicherePhase(user?.id, startPhase, phase);
  }, [user?.id, startPhase, phase]);
  const handleDone = onDone
    ? (...args) => {
        loescheGespeichertePhase();
        onDone(...args);
      }
    : onDone;
  const handleCancel = onCancel
    ? (...args) => {
        loescheGespeichertePhase();
        onCancel(...args);
      }
    : onCancel;
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
  // Nur relevant für istDirekterNeuStart: ob "Profil" in diesem Lauf
  // tatsächlich gezeigt wurde (über "Ja, kurz aktualisieren" in
  // OnboardingWerteAktualisierenView) — steuert die Zurück-Ziele von
  // "laborwerte"/"steckbrief" weiter unten, damit der Zurück-Pfeil nie auf
  // eine in diesem Lauf übersprungene Phase zeigt. Beim normalen
  // Erst-Onboarding immer wahr, weil dort ohnehin jede Phase der Reihe
  // nach durchlaufen wird. "Ziel & Grund" selbst braucht kein eigenes
  // Flag mehr — die Phase wird bei istDirekterNeuStart jetzt IMMER gezeigt.
  const [profilBesucht, setProfilBesucht] = useState(!istDirekterNeuStart);

  let screen;

  if (phase === "welcome") {
    screen = <WelcomeView onDone={() => setPhase("hauptprotokoll")} onCancel={handleCancel} />;
  } else if (phase === "hauptprotokoll") {
    screen = (
      <HauptprotokollErstellenView
        onDone={() => setPhase(istDirekterNeuStart ? "kiWahl" : "quickwin")}
        onBack={() => setPhase("welcome")}
        onCancel={handleCancel}
        zeigeBestehendesAlsOption={!istDirekterNeuStart}
      />
    );
  } else if (phase === "kiWahl") {
    screen = <OnboardingKiWahlView onDone={() => setPhase("ziele")} onBack={() => setPhase("hauptprotokoll")} onCancel={handleCancel} />;
  } else if (phase === "quickwin") {
    screen = <OnboardingQuickWinView onDone={() => setPhase("intro")} onBack={() => setPhase("hauptprotokoll")} />;
  } else if (phase === "intro") {
    // Bei Coach-Begleitung deckt OnboardingIntroView (über OnboardingCoachGuide)
    // Name, Ziele UND Profil direkt mit ab — dann direkt zu "laborwerte"
    // statt die (bereits erledigten) Phasen "ziele"/"profil" nochmal manuell
    // zu durchlaufen.
    screen = (
      <OnboardingIntroView
        onDone={(opts) => setPhase(opts?.guided ? "laborwerte" : "ziele")}
        onBack={() => setPhase("quickwin")}
        onCancel={handleCancel}
        nurManuell={!istAdminModus}
      />
    );
  } else if (phase === "ziele") {
    screen = (
      <OnboardingZieleView
        onDone={() => setPhase(istDirekterNeuStart ? "werteAktualisieren" : "profil")}
        onBack={() => setPhase(istDirekterNeuStart ? "kiWahl" : "intro")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "werteAktualisieren") {
    screen = (
      <OnboardingWerteAktualisierenView
        onJa={() => {
          setProfilBesucht(true);
          setPhase("profil");
        }}
        onNein={() => setPhase(vollstaendigesOnboarding ? "laborwerte" : "steckbrief")}
        onBack={() => setPhase("ziele")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "profil") {
    screen = (
      <OnboardingProfilView
        onDone={() => setPhase(vollstaendigesOnboarding ? "laborwerte" : "steckbrief")}
        onBack={() => setPhase(istDirekterNeuStart ? "werteAktualisieren" : "ziele")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "steckbrief") {
    screen = (
      <OnboardingSteckbriefView
        onDone={() => setPhase("celebration")}
        onBack={() => setPhase(profilBesucht ? "profil" : "werteAktualisieren")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "laborwerte") {
    screen = (
      <OnboardingLaborwerteView
        onDone={() => setPhase("routinen")}
        onBack={() => setPhase(profilBesucht ? "profil" : "werteAktualisieren")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "routinen") {
    screen = (
      <OnboardingRoutinenView
        onDone={(schlafBereich) => {
          if (schlafBereich) {
            setEingerichteteBereiche((prev) => [...prev.filter((b) => b.key !== "schlaf"), schlafBereich]);
          }
          setPhase("categories");
        }}
        onBack={() => setPhase("laborwerte")}
        onCancel={handleCancel}
      />
    );
  } else if (phase === "categories") {
    screen = (
      <OnboardingCategoriesView
        onCancel={handleCancel}
        onBackToStart={() => setPhase("routinen")}
        onFinished={(bereiche) => {
          const neueSchluessel = bereiche.map((b) => b.key);
          setEingerichteteBereiche((prev) => [...prev.filter((b) => !neueSchluessel.includes(b.key)), ...bereiche]);
          setPhase("celebration");
        }}
      />
    );
  } else {
    screen = (
      <OnboardingCompletionView
        eingerichteteBereiche={eingerichteteBereiche}
        onDone={handleDone}
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
