import React from "react";
import { Shell, Pill } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { accentDark, accentSoft, cardBorder, textMuted } from "../../ui/theme";
import { PLAENE_TABS } from "../../constants";
import { KATEGORIE_META } from "../../utils/dayItems";
import Icon from "../../ui/Icon";
import { useAppData } from "../../context/AppDataContext";
import SchlafView from "../SchlafView";
import HydrationView from "../HydrationView";
import TageslichtView from "../TageslichtView";
import NutritionView from "../NutritionView";
import TrainingView from "../TrainingView";
import SupplementeView from "../SupplementeView";
import MedikamenteView from "../MedikamenteView";
import WochenuebersichtView from "../WochenuebersichtView";
import RoutineTabView from "../RoutineTabView";

function MorgenroutineTabView(props) {
  return <RoutineTabView routine="morgen" {...props} />;
}
function AbendroutineTabView(props) {
  return <RoutineTabView routine="abend" {...props} />;
}

const VIEWS = {
  morgenroutine: MorgenroutineTabView,
  abendroutine: AbendroutineTabView,
  schlaf: SchlafView,
  hydration: HydrationView,
  tageslicht: TageslichtView,
  ernaehrung: NutritionView,
  training: TrainingView,
  supplemente: SupplementeView,
  medikamente: MedikamenteView,
  wochenuebersicht: WochenuebersichtView,
};

// planeTab-Id → KATEGORIE_META-Schlüssel (weichen an 2 Stellen vom Tab-Namen
// ab: "ernaehrung"→"mahlzeit", "medikamente"→"hormon"). Peptide sind seit
// der Datenzusammenlegung (13.08., Migration 0042) Teil von "medikamente"/
// "hormon" und haben keinen eigenen Reiter mehr.
// "wochenuebersicht" bleibt ohne Zuordnung (mischt alle Bereiche, keine
// einzelne Farbe sinnvoll) — Shell fällt dann auf die generische Akzentfarbe
// zurück.
const TAB_ZU_KATEGORIE = {
  schlaf: "schlaf",
  hydration: "hydration",
  tageslicht: "tageslicht",
  ernaehrung: "mahlzeit",
  training: "training",
  supplemente: "supplement",
  medikamente: "hormon",
};

// Eigene Farben für Reiter-Buttons ohne KATEGORIE_META-Eintrag: bewusst
// NICHT die generische Akzentfarbe (`accent`), sonst sehen mehrere Reiter
// beim Anwählen identisch aus (bestätigter Bug, 29.07., damals Peptide vs.
// Wochenübersicht). Morgen-/Abendroutine bekommen hier ebenfalls keinen
// KATEGORIE_META-Eintrag (siehe RoutineTabView.jsx) — sonst tauchen sie als
// tote Einträge in der Monatsansicht-Farblegende auf, weil buildDayItems()
// nie Tagesplan-Punkte mit dieser Kategorie erzeugt.
const EIGENE_TAB_FARBE = {
  wochenuebersicht: "#64748B",
  morgenroutine: "#E08A3E",
  abendroutine: "#4E6690",
};

// Eigene, kleine Liste statt eines einzelnen Knopfes (Nutzerinnen-Vorgabe,
// 29.07.): Gewohnheiten lassen sich hier NICHT wie die 9 Reiter oben mit
// Zeiten/Zielen "aktiv planen", gehören inhaltlich aber trotzdem zu "Alle
// Pläne" — deshalb ein eigener Abschnitt darunter statt ein zehnter Reiter.
// Bewusst als Liste angelegt, nicht als einzelner Knopf: Morgenroutine/
// Abendroutine (noch nicht gebaut, siehe UEBERGABEPROTOKOLL.md Abschnitt 4d)
// reihen sich hier später einfach als weitere Einträge ein.
const ROUTINEN_EINTRAEGE = [{ id: "routinen", icon: "target", label: "Gewohnheiten" }];

// Nachvollziehbarkeit (Nutzerinnen-Vorgabe, 31.07.): "Alle Pläne" soll auch
// der Ort sein, an dem man sieht, was tatsächlich passiert ist — inkl. was
// Aka im Gespräch für einen angelegt hat (z. B. ein mit Aka erstellter
// Trainingsplan). Verlinkt auf denselben "📖 Akas fertige Protokolle"-
// Screen, den es unter "Archiv" schon gibt (ProtokollLogView, über den
// PlanView-Tab "verlauf") — keine neue Ansicht, nur ein zweiter, näher
// liegender Einstiegspunkt dorthin.
const NACHVOLLZIEHEN_EINTRAEGE = [{ id: "verlauf", icon: "archive", label: "Protokolle" }];

// Bausteine des aktiven Hauptprotokolls, an-/abschaltbar ohne den kompletten
// Onboarding-Assistenten (der dabei archiviert + neu anlegt) durchlaufen zu
// müssen (Nutzerinnen-Vorgabe, 15.08.: "möchte nicht die Möglichkeit haben,
// diese Protokolle dann immer irgendwie abzubrechen" — die vorherige einzige
// Stelle, um teilprotokolle.aktiv zu setzen, war OnboardingCategoriesView).
// Schlaf & Hydration sind bewusst nicht abschaltbar ("Kernessenz"), Morgen-/
// Abendroutine erscheinen hier gar nicht — die sind gar keine teilprotokolle
// (siehe RoutineTabView.jsx), sondern ohnehin immer erreichbar.
const BAUSTEINE_KATEGORIEN = [
  { kategorie: "schlaf", label: "Schlaf", kern: true },
  { kategorie: "hydration", label: "Hydration", kern: true },
  { kategorie: "tageslicht", label: "Tageslicht", kern: false },
  { kategorie: "ernaehrung", label: "Ernährung", kern: false },
  { kategorie: "training", label: "Training", kern: false },
  { kategorie: "gewohnheiten", label: "Gewohnheiten", kern: false },
  { kategorie: "supplemente", label: "Supplemente", kern: false },
  { kategorie: "medikamente", label: "Medikamente", kern: false },
];

function BausteineUebersicht() {
  const { aktivesHauptprotokoll, teilprotokolle, teilprotokollSpeichern } = useAppData();

  if (!aktivesHauptprotokoll) return null;

  const zeileFuer = (kategorie) => teilprotokolle.find((t) => t.hauptprotokoll_id === aktivesHauptprotokoll.id && t.kategorie === kategorie);

  const umschalten = (kategorie) => {
    const bestehend = zeileFuer(kategorie);
    teilprotokollSpeichern(aktivesHauptprotokoll.id, kategorie, {
      aktiv: !(bestehend?.aktiv ?? false),
      eigenerStartdatum: bestehend?.eigenes_startdatum ?? null,
      laufzeitWochen: bestehend?.laufzeit_wochen ?? null,
    });
  };

  // "Seit Woche X" relativ zum Hauptprotokoll-Start — beantwortet direkt die
  // Nutzerinnen-Vorgabe ("Woche eins nur Schlaf, Woche zwei + Hydration, ...").
  // Nur eine grobe Orientierung: aktiviert_am wird nur beim Übergang
  // inaktiv→aktiv aktualisiert (siehe useHauptprotokollData.js), nicht bei
  // jedem Deaktivieren/Reaktivieren im Detail nachgehalten.
  const seitWoche = (kategorie) => {
    const zeile = zeileFuer(kategorie);
    if (!zeile?.aktiv || !zeile.aktiviert_am) return null;
    const start = new Date(aktivesHauptprotokoll.startdatum);
    const aktiviert = new Date(zeile.aktiviert_am);
    const wochen = Math.floor((aktiviert - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, wochen);
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Bausteine dieses Protokolls</div>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10, lineHeight: 1.5 }}>
        An-/ausschalten, ohne das Protokoll abzubrechen. Zum Bearbeiten unten auf den passenden Reiter tippen.
      </div>
      <div style={{ marginBottom: 20 }}>
        {BAUSTEINE_KATEGORIEN.map((b, i) => {
          const aktiv = b.kern || !!zeileFuer(b.kategorie)?.aktiv;
          const woche = b.kern ? 1 : seitWoche(b.kategorie);
          return (
            <div
              key={b.kategorie}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < BAUSTEINE_KATEGORIEN.length - 1 ? `1px solid ${cardBorder}` : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{b.label}</div>
                {aktiv && woche && <div style={{ fontSize: 10.5, color: textMuted, marginTop: 1 }}>Seit Woche {woche}</div>}
              </div>
              {b.kern ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: accentDark, background: accentSoft, padding: "4px 10px", borderRadius: 10 }}>
                  Immer aktiv
                </span>
              ) : (
                <Pill label={aktiv ? "Aktiv" : "Inaktiv"} selected={aktiv} onClick={() => umschalten(b.kategorie)} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ListenEintrag({ eintrag, onClick }) {
  return (
    <button
      onClick={onClick}
      className="mp-tap"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 16px",
        borderRadius: 14,
        border: `1px solid ${cardBorder}`,
        background: "#fff",
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={eintrag.icon} size={16} color={KATEGORIE_META.gewohnheit.dot} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{eintrag.label}</span>
      </div>
      <span style={{ color: textMuted, fontSize: 16 }}>›</span>
    </button>
  );
}

// "Alle Pläne"-Hub — bündelt die 7 Kategorien, die aktiv mit Zeiten/Zielen
// geplant werden, unter einem gemeinsamen Reiter-Kopf statt als eigene
// Dashboard-Kacheln. Gleiches Muster wie PlanView.jsx (Statistik/Profil/
// Community/Archiv). Jede Kategorie-View wird mit `embedded` gerendert,
// damit sie ihren eigenen Shell/Header nicht dupliziert.
export default function PlaeneView({ planeTab, setPlaneTab, onHome, initialSessionId, onConsumedInitialSession }) {
  const Aktiv = VIEWS[planeTab] || VIEWS.schlaf;

  return (
    <Shell bereich={TAB_ZU_KATEGORIE[planeTab]}>
      <ViewHeader title="Deine aktiven Systeme" onHome={onHome} />

      <BausteineUebersicht />

      {/* Routinen bewusst VOR den 9 Reitern (Nutzerinnen-Vorgabe, 29.07.:
          Priorität) — nicht nachträglich angehängt. */}
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Routinen</div>
      {ROUTINEN_EINTRAEGE.map((r) => (
        <ListenEintrag key={r.id} eintrag={r} onClick={() => setPlaneTab(r.id)} />
      ))}

      <div style={{ fontSize: 14, fontWeight: 800, margin: "20px 0 8px" }}>Pläne</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {PLAENE_TABS.map((t) => {
          const dot = KATEGORIE_META[TAB_ZU_KATEGORIE[t.id]]?.dot || EIGENE_TAB_FARBE[t.id] || "#64748B";
          const aktiv = planeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPlaneTab(t.id)}
              style={{
                flex: "1 1 30%",
                padding: "9px 4px",
                borderRadius: 10,
                border: `1px solid ${aktiv ? dot : cardBorder}`,
                background: aktiv ? dot : "#fff",
                color: aktiv ? "#fff" : textMuted,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Aktiv embedded initialSessionId={initialSessionId} onConsumedInitialSession={onConsumedInitialSession} />

      <div style={{ fontSize: 14, fontWeight: 800, margin: "20px 0 8px" }}>Nachvollziehen</div>
      {NACHVOLLZIEHEN_EINTRAEGE.map((r) => (
        <ListenEintrag key={r.id} eintrag={r} onClick={() => setPlaneTab(r.id)} />
      ))}
    </Shell>
  );
}
