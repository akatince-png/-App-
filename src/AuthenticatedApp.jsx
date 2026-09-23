import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import { useT } from "./i18n/translate";
import { useAppData } from "./context/AppDataContext";
import { useAuth } from "./context/AuthContext";
import { useAdmin } from "./context/AdminContext";
import HomeView from "./views/HomeView";
import AppSidebar from "./ui/AppSidebar";
import Belohnungsfenster from "./ui/Belohnungsfenster";
import { ZusatzprotokollBanner } from "./ui/Zusatzprotokolle";
import GlobalerAka from "./ui/GlobalerAka";
import AkutModusGlobal from "./ui/AkutModusGlobal";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { PLAENE_TABS } from "./constants";
import { wochenprotokollFaellig, baueWochenprotokollDaten } from "./utils/wochenprotokollSnapshot";
import { spotifyCodeAustauschen } from "./services/spotify";
import { viewAusHash, hashFuerView } from "./utils/routing";

// Code-Splitting (App-Bauplan-Punkt): vorher landeten ALLE Bildschirme —
// Admin-Bereich, Onboarding-Fragebogen, jede einzelne Kategorie-Ansicht —
// in einem einzigen JS-Bundle (Build-Warnung: > 2,3 MB nach Minifizierung),
// obwohl pro Sitzung immer nur einer davon tatsächlich gebraucht wird. Jetzt
// per `lazy()` als eigener Chunk nachgeladen, genau dann, wenn `view`
// erstmals darauf wechselt — der Suspense-Fallback unten (derselbe
// LoadingScreen wie beim ersten App-Start) deckt die kurze Ladezeit ab.
// HomeView bleibt bewusst ein normaler, eager Import: sie wird in praktisch
// jeder Sitzung sofort nach dem Laden gebraucht, ein zusätzlicher
// Netzwerk-Sprung würde dort nur schaden statt nutzen.
const AdminDashboardView = lazy(() => import("./views/admin/AdminDashboardView"));
const AdminWissenView = lazy(() => import("./views/admin/AdminWissenView"));
const AdminFormulareView = lazy(() => import("./views/admin/AdminFormulareView"));
const AdminCoachUebersichtView = lazy(() => import("./views/admin/AdminCoachUebersichtView"));
const AdminQuestsView = lazy(() => import("./views/admin/AdminQuestsView"));
const AdminTeamsView = lazy(() => import("./views/admin/AdminTeamsView"));
const LexikonView = lazy(() => import("./views/LexikonView"));
const TagesplanView = lazy(() => import("./views/TagesplanView"));
const PlanView = lazy(() => import("./views/plan/PlanView"));
const PlaeneView = lazy(() => import("./views/plan/PlaeneView"));
const MehrView = lazy(() => import("./views/plan/MehrView"));
const GewohnheitenView = lazy(() => import("./views/GewohnheitenView"));
const AtemuebungenView = lazy(() => import("./views/AtemuebungenView"));
const OnboardingFlow = lazy(() => import("./views/onboarding/OnboardingFlow"));
const NeuesProtokollBestaetigenView = lazy(() => import("./views/onboarding/NeuesProtokollBestaetigenView"));
const ZusatzprotokollErstellenView = lazy(() => import("./views/onboarding/ZusatzprotokollErstellenView"));

const PLAENE_VIEW_IDS = PLAENE_TABS.map((t) => t.id);
const ARCHIV_VIEW_IDS = ["verlauf", "archiv", "statistik", "erfolge", "tagebuch", "profil", "blutzucker", "community"];
// Alle eigenständigen (nicht in PLAENE_VIEW_IDS/ARCHIV_VIEW_IDS enthaltenen)
// `view`-Werte, die der Screen-Switch unten kennt — Grundlage für
// `istGueltigerView()` unten, das einen aus der URL gelesenen Hash prüft,
// bevor er als Startansicht übernommen wird (siehe utils/routing.js).
const EINZEL_VIEWS = ["home", "form", "lexikon", "tagesplan", "routinen", "atemuebungen", "mehr", "zusatzprotokoll"];
// Seiten, die bereits einen eigenen, fachlich zugeschnittenen Aka (KiChat)
// mitbringen — alle anderen bekommen den universellen GlobalerAka (siehe
// ui/GlobalerAka.jsx), damit Aka auf jeder Seite erreichbar ist.
const VIEWS_MIT_EIGENEM_AKA = new Set(["home", "tagesplan", "routinen", "form", ...PLAENE_VIEW_IDS.filter((id) => id !== "bildschirmzeit")]);
const ADMIN_VIEWS = ["admin", "admin-wissen", "admin-formulare", "admin-uebersicht", "admin-quests", "admin-teams"];

// Nur bekannte Werte übernehmen — ein veralteter/manipulierter Hash (z. B.
// von einem geteilten Link nach einem App-Update) soll nie auf einen
// unbekannten `view`-Wert führen, das würde beim Screen-Switch unten
// stillschweigend im Home-Fallback landen, aber mit falscher URL stehen
// bleiben. admin-* zusätzlich an `isAdmin` gebunden: ein direkt
// aufgerufener Admin-Link darf eine Coachee nicht in eine Admin-Ansicht
// bringen, die sie sowieso nicht sehen könnte (RLS blockt die Daten
// serverseitig ohnehin, aber die Ansicht soll erst gar nicht aufblitzen).
function istGueltigerView(view, isAdmin) {
  if (!view) return false;
  if (EINZEL_VIEWS.includes(view) || PLAENE_VIEW_IDS.includes(view) || ARCHIV_VIEW_IDS.includes(view)) return true;
  if (ADMIN_VIEWS.includes(view)) return isAdmin;
  return false;
}

// Modul-weit statt Komponenten-State (siehe Kommentar an der Nutzung
// weiter unten): muss genau einmal pro Browser-Registerkarte "wahr"
// werden, nicht bei jedem Remount von AuthenticatedApp.
let anfangsHashSchonVerwendet = false;

// Übersetzt die Kategorie eines Tagesplan-Eintrags in die zuständige View —
// für den ✏️-Bearbeiten-Kurzweg direkt aus dem Tagesplan. Die Pläne-
// Kategorien landen jetzt alle im "Alle Pläne"-Hub (PlaeneView), der
// jeweilige `view`-Wert dient dort direkt als aktiver Reiter.
const KATEGORIE_TO_VIEW = {
  hormon: "medikamente",
  supplement: "supplemente",
  gewohnheit: "routinen",
  workflow: "routinen",
  hydration: "hydration",
  mahlzeit: "ernaehrung",
};

// Gleicher Ladebildschirm wie in App.jsx (dort für den Login-/Auth-Ladezustand,
// hier für den Datenlade-Zustand danach) — beide über dieselbe i18n-Zeichenkette
// statt eines zweiten, fest auf Deutsch verdrahteten Textes.
function LoadingScreen() {
  const { t } = useT();
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>{t("common.loading")}</div>
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
    setSpotifyVerbindungFehler,
    setEintragsZielId,
  } = appData;
  const istAdminModus = proband !== null || isAdmin;
  const [view, setView] = useState(null); // null = noch nicht entschieden, dann 'home' | 'form' | 'plan' | 'lexikon' | ...
  // Zusatzprotokoll als Eintrags-Ziel wählen und direkt zu den Plänen, wo
  // Supplemente/Medikamente/Mahlzeiten/Gewohnheiten angelegt werden.
  const zusatzEintraegeHinzufuegen = (id) => {
    setEintragsZielId(id);
    setView("supplemente");
  };
  // Trägt die Trainings-ID, wenn der Tagesplan direkt ins Live-Workout
  // springen soll — wird von TrainingView nach dem Öffnen zurückgesetzt.
  const [offenesTrainingId, setOffenesTrainingId] = useState(null);
  // Bug-Fix ("Zustände gehen beim View-Wechsel verloren"): TagesplanView
  // wird bei jedem Verlassen/Wiederbetreten komplett neu gemountet (siehe
  // `screen`-Switch unten) — ausgewähltes Datum und Tag/Woche-Modus liegen
  // deshalb hier statt in TagesplanView.jsx selbst, damit ein "Home →
  // woanders hin → zurück zum Tagesplan" nicht wieder bei "heute"/"Tag"
  // landet, sondern genau da weitermacht, wo man war.
  const [tagesplanDatum, setTagesplanDatum] = useState(new Date());
  const [tagesplanModus, setTagesplanModus] = useState("tag");
  // Dieselbe Begründung wie bei tagesplanDatum/-Modus, für die Wochenübersicht
  // innerhalb von "Alle Pläne" (PlaeneView.jsx) — die remountet ihre aktive
  // Unteransicht bei jedem Reiterwechsel genauso hart wie AuthenticatedApp.jsx
  // seine Hauptansichten.
  const [wochenuebersichtDatum, setWochenuebersichtDatum] = useState(new Date());
  const [wochenuebersichtModus, setWochenuebersichtModus] = useState("day");
  const [wochenuebersichtMonat, setWochenuebersichtMonat] = useState(new Date());

  // Rückkehr von der Spotify-Anmeldung (accounts.spotify.com leitet mit
  // ?code=...&state=... zurück auf die App) — Code gegen Zugangsdaten
  // tauschen (siehe spotify-auth-callback Edge Function) und danach direkt
  // wieder bei "Mehr" landen, wo die Verbindung angestoßen wurde.
  //
  // Bei Ablehnung/Fehler auf Spotify-Seite (z. B. falsche App-Konfiguration,
  // Nutzerin bricht ab) kommt STATT ?code=... ein ?error=...-Parameter
  // zurück — wurde bisher komplett ignoriert (Bug-Report: "Seite lädt neu,
  // aber nichts passiert", ohne jede sichtbare Fehlermeldung, weil der
  // frühere `if (!code) return;` diesen Fall stillschweigend überging, noch
  // bevor überhaupt eine Fehlermeldung gesetzt werden konnte).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authFehler = params.get("error");
    if ((!code && !authFehler) || params.get("state") !== "aka_spotify_connect" || !userId) return;
    window.history.replaceState({}, "", window.location.pathname);
    setSpotifyVerbindungFehler?.(null);

    if (authFehler) {
      setSpotifyVerbindungFehler?.(`Spotify hat die Verbindung abgelehnt: ${authFehler}`);
      setView("mehr");
      return;
    }

    spotifyCodeAustauschen(code, userId)
      .then(() => spotifyVerbindungNeuLaden?.())
      .catch((err) => {
        console.error(err);
        setSpotifyVerbindungFehler?.(err.message || "Verbindung mit Spotify fehlgeschlagen.");
      })
      .finally(() => setView("mehr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!loading && view === null) {
      // Neue Konten ohne abgeschlossenes Onboarding starten direkt im Frage-
      // Assistenten, unabhängig von einem evtl. vorhandenen Hash — sonst
      // könnte ein alter Lesezeichen-/geteilter Link den Fragebogen umgehen.
      if (!onboardingComplete) {
        setView("form");
        return;
      }
      // Bug-Fix (Nachkontrolle): ein aus der URL gelesener View darf nur
      // beim allerersten Laden dieser Browser-Registerkarte übernommen
      // werden. AuthenticatedApp wird nämlich nicht nur beim echten
      // Seitenaufruf neu gemountet, sondern auch bei jedem Wechsel in den
      // oder aus dem "Verwalten als"-Modus (key={proband?.id || "self"} in
      // App.jsx) — ohne diese Sperre hätte z. B. ein Admin, der gerade auf
      // #/tagesplan steht, beim Start einer Coachee-Verwaltung sofort
      // deren Tagesplan gesehen statt wie vorher (und wie von "Verwalten
      // als" erwartet) auf Home zu landen. anfangsHashSchonVerwendet lebt
      // auf Modul-Ebene und überlebt daher genau diese Remounts, obwohl
      // der Komponenten-State jedes Mal frisch startet.
      if (!anfangsHashSchonVerwendet) {
        anfangsHashSchonVerwendet = true;
        const ausUrl = viewAusHash();
        if (istGueltigerView(ausUrl, isAdmin)) {
          setView(ausUrl);
          return;
        }
      }
      setView("home");
    }
  }, [loading, onboardingComplete, isAdmin, view]);

  // Echtes Routing (App-Bauplan-Punkt, siehe utils/routing.js): `view` mit
  // der Browser-URL verknüpfen, statt es reinen React-State bleiben zu
  // lassen. `skipNaechstenPushRef` verhindert eine Endlosschleife/kaputte
  // Historie beim Zurück-/Vorwärts-Knopf: dessen `popstate`-Handler setzt
  // `view` direkt aus dem (schon vom Browser geänderten) Hash — würde der
  // Push-Effekt darunter danach nochmal `pushState` aufrufen, würde jedes
  // "Zurück" einen neuen Vorwärts-Eintrag erzeugen und den Knopf faktisch
  // funktionslos machen.
  const skipNaechstenPushRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      const ausUrl = viewAusHash();
      if (istGueltigerView(ausUrl, isAdmin) && ausUrl !== view) {
        skipNaechstenPushRef.current = true;
        setView(ausUrl);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [view, isAdmin]);

  useEffect(() => {
    if (view === null) return;
    // Jede neue Ansicht beginnt oben — vorher blieb die Scroll-Position der
    // vorigen Seite stehen (z. B. von weit unten auf Home ins Archiv), und
    // man landete mitten in der neuen Seite ohne Überschrift.
    window.scrollTo(0, 0);
    if (skipNaechstenPushRef.current) {
      skipNaechstenPushRef.current = false;
      return;
    }
    const zielHash = hashFuerView(view);
    if (window.location.hash !== zielHash) {
      window.history.pushState({ view }, "", zielHash);
    }
  }, [view]);

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
  //
  // Läuft jetzt NICHT mehr blind beim Knopf-Klick (Nutzerinnen-Vorgabe,
  // 15.09.: "möchte ich erstmal gefragt werden, möchtest du das
  // archivieren ... und über den Stand des alten Protokolls informiert
  // werden") — der "+"-Button wechselt stattdessen nur noch zu
  // view="neuesProtokollBestaetigen" (siehe unten), diese Funktion hier
  // wird erst nach explizitem "Ja" auf dem Bestätigungs-Screen aufgerufen.
  const neuesProtokoll = async () => {
    if (ziele.length > 0 || peptide.length > 0) {
      await protokollArchivieren();
    }
    setView("form");
  };

  let screen;

  if (view === "neuesProtokollBestaetigen") {
    screen = (
      <NeuesProtokollBestaetigenView
        onBestaetigt={neuesProtokoll}
        onParallel={() => setView("zusatzprotokoll")}
        onAbbrechen={() => setView("home")}
      />
    );
  } else if (view === "zusatzprotokoll") {
    screen = <ZusatzprotokollErstellenView onErstellt={(z) => zusatzEintraegeHinzufuegen(z.id)} onAbbrechen={() => setView("home")} />;
  } else if (view === "form") {
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
        selectedDate={tagesplanDatum}
        onSelectedDateChange={setTagesplanDatum}
        modus={tagesplanModus}
        onModusChange={setTagesplanModus}
      />
    );
  } else if (view === "routinen") {
    screen = <GewohnheitenView onHome={() => setView("home")} />;
  } else if (view === "atemuebungen") {
    screen = <AtemuebungenView onHome={() => setView("home")} />;
  } else if (PLAENE_VIEW_IDS.includes(view)) {
    screen = (
      <PlaeneView
        planeTab={view}
        setPlaneTab={setView}
        onHome={() => setView("home")}
        initialSessionId={offenesTrainingId}
        onConsumedInitialSession={() => setOffenesTrainingId(null)}
        wochenuebersichtDatum={wochenuebersichtDatum}
        onWochenuebersichtDatumChange={setWochenuebersichtDatum}
        wochenuebersichtModus={wochenuebersichtModus}
        onWochenuebersichtModusChange={setWochenuebersichtModus}
        wochenuebersichtMonat={wochenuebersichtMonat}
        onWochenuebersichtMonatChange={setWochenuebersichtMonat}
        zeigeZusatzprotokolle={istAdminModus}
        onZusatzprotokollNeu={() => setView("zusatzprotokoll")}
        onZusatzEintraegeHinzufuegen={zusatzEintraegeHinzufuegen}
      />
    );
  } else if (ARCHIV_VIEW_IDS.includes(view)) {
    screen = <PlanView planTab={view} setPlanTab={setView} onHome={() => setView("home")} />;
  } else if (view === "mehr") {
    screen = (
      <MehrView
        onHome={() => setView("home")}
        onOpenLexikon={() => setView("lexikon")}
        onOpenAdmin={isAdmin ? () => setView("admin") : undefined}
        onOpenErfolge={() => setView("erfolge")}
      />
    );
  } else if (view === "admin") {
    // Nur erreichbar aus dem eigenen Konto heraus (nicht während man schon
    // "als" jemand anderes verwaltet, proband ist dann null) — der
    // key={proband?.id || "self"}-Remount in App.jsx sorgt dafür, dass
    // dieser view-State beim Betreten/Verlassen des Verwalten-als-Modus
    // ohnehin zurückgesetzt wird.
    screen = (
      <AdminDashboardView
        onHome={() => setView("home")}
        onVerwalteAls={verwalteAls}
        onOpenWissen={() => setView("admin-wissen")}
        onOpenFormulare={() => setView("admin-formulare")}
        onOpenUebersicht={() => setView("admin-uebersicht")}
        onOpenQuests={() => setView("admin-quests")}
        onOpenTeams={() => setView("admin-teams")}
      />
    );
  } else if (view === "admin-wissen") {
    screen = <AdminWissenView onHome={() => setView("admin")} />;
  } else if (view === "admin-formulare") {
    screen = <AdminFormulareView onHome={() => setView("admin")} />;
  } else if (view === "admin-uebersicht") {
    screen = <AdminCoachUebersichtView onHome={() => setView("admin")} onVerwalteAls={verwalteAls} />;
  } else if (view === "admin-quests") {
    screen = <AdminQuestsView onHome={() => setView("admin")} />;
  } else if (view === "admin-teams") {
    screen = <AdminTeamsView onHome={() => setView("admin")} />;
  } else {
    screen = (
      <HomeView
        onOpenView={(id) => setView(id)}
        onOpenTraining={(id) => {
          setOffenesTrainingId(id);
          setView("training");
        }}
        onNeuesProtokoll={() => setView("neuesProtokollBestaetigen")}
      />
    );
  }

  // Seitenleiste (Tablet/Desktop, siehe .mp-app-sidebar in index.css) nur
  // außerhalb des geführten Onboarding-Fragebogens — mittendrin woanders
  // hinzuspringen würde den linearen Ablauf durchbrechen, ohne dass dafür
  // ein echter Bedarf gemeldet wurde.
  const zeigeSidebar = view !== "form";

  return (
    <div className="mp-app-shell">
      <Belohnungsfenster />
      <AkutModusGlobal sichtbar={view !== "home" && view !== "form"} />
      {zeigeSidebar && <AppSidebar view={view} onNavigate={setView} isAdmin={isAdmin} />}
      <div className="mp-app-main">
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
        {/* Bug-Fix/Verbesserung ("Übergänge nicht flüssig"): Der View-Wechsel
            hier ist ein harter Komponentenaustausch (anderer Komponententyp
            je nach `view`, kein gemeinsamer DOM-Knoten) — ganz ohne jede
            Übergangsanimation sprang jeder Wechsel bisher hart. `key={view}`
            erzwingt bei jedem Wechsel einen frischen Mount dieses Wrappers,
            was die vorhandene fadeInUp-Animation auslöst (dieselbe Technik
            wie bereits in WelcomeView.jsx) — ein sanftes Einblenden statt
            eines harten Schnitts, ohne den Remount selbst zu ändern. Ist
            @media (prefers-reduced-motion: reduce) gesetzt, ist die
            @keyframes-Regel in index.css gar nicht registriert, die
            Animation bleibt dann automatisch aus. */}
        {/* Bildschirm-genaues Auffangnetz (14.09., Nutzerinnen-Vorgabe): stürzt
            ein einzelner Bildschirm ab, bringt "Zurück zur Startseite"
            (setView("home")) den key={view}-Wechsel gleich mit — der ganze
            Wrapper hier remountet dabei automatisch neu, das Auffangnetz
            setzt sich also von selbst zurück, ohne dass die App komplett neu
            geladen werden muss. */}
        {view !== "form" && <ZusatzprotokollBanner />}
        <div key={view} style={{ animation: "fadeInUp 0.35s ease-out" }}>
          <ErrorBoundary onReset={() => setView("home")}>
            <Suspense fallback={<LoadingScreen />}>{screen}</Suspense>
            {!VIEWS_MIT_EIGENEM_AKA.has(view) && <GlobalerAka />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
