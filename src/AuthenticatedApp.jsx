import React, { useEffect, useState } from "react";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import { useAppData } from "./context/AppDataContext";
import { useAuth } from "./context/AuthContext";
import { useAdmin } from "./context/AdminContext";
import HomeView from "./views/HomeView";
import AdminDashboardView from "./views/admin/AdminDashboardView";
import LexikonView from "./views/LexikonView";
import TagesplanView from "./views/TagesplanView";
import PlanView from "./views/plan/PlanView";
import PlaeneView from "./views/plan/PlaeneView";
import MehrView from "./views/plan/MehrView";
import GewohnheitenView from "./views/GewohnheitenView";
import OnboardingFlow from "./views/onboarding/OnboardingFlow";
import Fab from "./ui/Fab";
import { PLAENE_TABS } from "./constants";
import { wochenprotokollFaellig, baueWochenprotokollDaten } from "./utils/wochenprotokollSnapshot";
import { spotifyCodeAustauschen } from "./services/spotify";

const PLAENE_VIEW_IDS = PLAENE_TABS.map((t) => t.id);
const ARCHIV_VIEW_IDS = ["verlauf", "archiv", "statistik", "profil", "blutzucker", "community"];

// Übersetzt die Kategorie eines Tagesplan-Eintrags in die zuständige View —
// für den ✏️-Bearbeiten-Kurzweg direkt aus dem Tagesplan. Die Pläne-
// Kategorien landen jetzt alle im "Alle Pläne"-Hub (PlaeneView), der
// jeweilige `view`-Wert dient dort direkt als aktiver Reiter.
const KATEGORIE_TO_VIEW = {
  hormon: "medikamente",
  supplement: "supplemente",
  gewohnheit: "routinen",
  hydration: "hydration",
  mahlzeit: "ernaehrung",
};

function LoadingScreen() {
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>Daten werden geladen...</div>
    </Shell>
  );
}

export default function AuthenticatedApp() {
  const appData = useAppData();
  const { signOut } = useAuth();
  const { proband, verwalteAls, verlasseVerwaltung } = useAdmin();
  const {
    loading,
    onboardingComplete,
    completeOnboarding,
    protocolId,
    startdatum,
    wochenprotokollSnapshots,
    wochenprotokollSnapshotErzeugen,
    ziele,
    peptide,
    protokollArchivieren,
    isAdmin,
    userId,
    spotifyVerbindungNeuLaden,
  } = appData;
  const [view, setView] = useState(null); // null = noch nicht entschieden, dann 'home' | 'form' | 'plan' | 'lexikon' | ...
  // Trägt die Trainings-ID, wenn der Tagesplan direkt ins Live-Workout
  // springen soll — wird von TrainingView nach dem Öffnen zurückgesetzt.
  const [offenesTrainingId, setOffenesTrainingId] = useState(null);

  // Rückkehr von der Spotify-Anmeldung (accounts.spotify.com leitet mit
  // ?code=...&state=... zurück auf die App) — Code gegen Zugangsdaten
  // tauschen (siehe spotify-auth-callback Edge Function) und danach direkt
  // wieder bei "Mehr" landen, wo die Verbindung angestoßen wurde.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code || params.get("state") !== "aka_spotify_connect" || !userId) return;
    window.history.replaceState({}, "", window.location.pathname);
    spotifyCodeAustauschen(code, userId)
      .then(() => spotifyVerbindungNeuLaden?.())
      .catch((err) => console.error(err))
      .finally(() => setView("mehr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!loading && view === null) {
      // Neue Konten ohne abgeschlossenes Onboarding starten direkt im Frage-Assistenten.
      setView(onboardingComplete ? "home" : "form");
    }
  }, [loading, onboardingComplete, view]);

  // "Automatisch" heißt hier: beim nächsten App-Öffnen nach Ablauf der
  // ersten 7 Tage seit Protokoll-Start prüfen, ob schon ein Erste-Woche-
  // Snapshot existiert — falls nicht, einmalig erzeugen (siehe
  // src/utils/wochenprotokollSnapshot.js).
  useEffect(() => {
    if (loading || !onboardingComplete || !protocolId) return;
    if (!wochenprotokollFaellig({ startdatum, wochenprotokollSnapshots })) return;
    wochenprotokollSnapshotErzeugen(protocolId, 1, baueWochenprotokollDaten(appData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, onboardingComplete, protocolId, startdatum, wochenprotokollSnapshots]);

  if (loading || view === null) {
    return <LoadingScreen />;
  }

  // "Neues Protokoll" muss wirklich leer starten. Die Formularfelder hängen
  // direkt am aktiven Protokoll (useProtocolData) — ohne diesen Schritt
  // würde der Aufruf einfach das laufende Protokoll mit alten Werten zum
  // Bearbeiten öffnen (bestätigter Bug: alte Auswahl blieb stehen). Ist das
  // aktive Protokoll schon leer (z. B. direkt nach dem Archivieren), ist
  // nichts zu tun.
  const neuesProtokoll = async () => {
    if (ziele.length > 0 || peptide.length > 0) {
      await protokollArchivieren();
    }
    setView("form");
  };

  let screen;

  if (view === "form") {
    screen = !onboardingComplete ? (
      // onCancel=signOut: ohne abgeschlossenes Onboarding gibt es noch keine
      // "home"-Ansicht, in die man abbrechen könnte — einzig sinnvoller
      // Ausweg ist das Abmelden (Bug: Nutzerin blieb sonst ohne jeden Ausgang
      // im Willkommens-Screen hängen, wenn sie das Onboarding nicht in einem
      // Zug durchlief).
      <OnboardingFlow
        onDone={() => {
          completeOnboarding();
          setView("home");
        }}
        onCancel={signOut}
      />
    ) : (
      // Bestehendes Konto durchläuft hier denselben Fragebogen-Ablauf wie
      // beim Erst-Onboarding (alle Kategorien + Peptid-Protokoll, jede
      // einzeln überspringbar) — nur ohne die Willkommens-Folien und mit
      // einem echten Abbrechen-Knopf.
      <OnboardingFlow startPhase="hauptprotokoll" onCancel={() => setView("home")} onDone={() => setView("home")} />
    );
  } else if (view === "lexikon") {
    screen = <LexikonView onHome={() => setView("home")} />;
  } else if (view === "tagesplan") {
    screen = (
      <TagesplanView
        onHome={() => setView("home")}
        onOpenTraining={(id) => {
          setOffenesTrainingId(id);
          setView("training");
        }}
        onEditItem={(kategorie) => {
          const ziel = KATEGORIE_TO_VIEW[kategorie];
          if (ziel) setView(ziel);
        }}
      />
    );
  } else if (view === "routinen") {
    screen = <GewohnheitenView onHome={() => setView("home")} />;
  } else if (PLAENE_VIEW_IDS.includes(view)) {
    screen = (
      <PlaeneView
        planeTab={view}
        setPlaneTab={setView}
        onHome={() => setView("home")}
        initialSessionId={offenesTrainingId}
        onConsumedInitialSession={() => setOffenesTrainingId(null)}
      />
    );
  } else if (ARCHIV_VIEW_IDS.includes(view)) {
    screen = <PlanView planTab={view} setPlanTab={setView} onHome={() => setView("home")} onEditProtocol={() => setView("medikamente")} />;
  } else if (view === "mehr") {
    screen = <MehrView onHome={() => setView("home")} onOpenLexikon={() => setView("lexikon")} onOpenAdmin={isAdmin ? () => setView("admin") : undefined} />;
  } else if (view === "admin") {
    // Nur erreichbar aus dem eigenen Konto heraus (nicht während man schon
    // "als" jemand anderes verwaltet, proband ist dann null) — der
    // key={proband?.id || "self"}-Remount in App.jsx sorgt dafür, dass
    // dieser view-State beim Betreten/Verlassen des Verwalten-als-Modus
    // ohnehin zurückgesetzt wird.
    screen = <AdminDashboardView onHome={() => setView("home")} onVerwalteAls={verwalteAls} />;
  } else {
    screen = <HomeView onOpenView={(id) => setView(id)} />;
  }

  // Coach-verwaltetes Modell (13.08.): "Neues Protokoll" bleibt Admins und
  // dem "Verwalten als"-Modus vorbehalten — ein Coachee soll nicht selbst
  // ein komplett neues Protokoll starten können, das läuft über den Coach.
  const istAdminModus = proband !== null || isAdmin;
  const zeigeFab = view !== "form" && istAdminModus;

  return (
    <>
      {proband && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "10px 16px",
            background: "#1E2B29",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>Du verwaltest gerade: {proband.vorname || proband.email}</span>
          <button
            onClick={verlasseVerwaltung}
            className="mp-tap"
            style={{ border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            Zurück zum Dashboard
          </button>
        </div>
      )}
      {screen}
      {zeigeFab && <Fab onClick={neuesProtokoll} />}
    </>
  );
}
