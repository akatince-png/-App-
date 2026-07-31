import React from "react";
import { Shell } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, textMuted } from "../../ui/theme";
import { PLAENE_TABS } from "../../constants";
import { KATEGORIE_META } from "../../utils/dayItems";
import Icon from "../../ui/Icon";
import SchlafView from "../SchlafView";
import HydrationView from "../HydrationView";
import TageslichtView from "../TageslichtView";
import NutritionView from "../NutritionView";
import TrainingView from "../TrainingView";
import SupplementeView from "../SupplementeView";
import MedikamenteView from "../MedikamenteView";
import PeptidView from "../PeptidView";
import WochenuebersichtView from "../WochenuebersichtView";

const VIEWS = {
  schlaf: SchlafView,
  hydration: HydrationView,
  tageslicht: TageslichtView,
  ernaehrung: NutritionView,
  training: TrainingView,
  supplemente: SupplementeView,
  medikamente: MedikamenteView,
  peptide: PeptidView,
  wochenuebersicht: WochenuebersichtView,
};

// planeTab-Id → KATEGORIE_META-Schlüssel (weichen an 2 Stellen vom Tab-Namen
// ab: "ernaehrung"→"mahlzeit", "medikamente"→"hormon", "peptide"→"peptid").
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
  peptide: "peptid",
};

// Eigene Farbe für den Reiter-Button von "wochenuebersicht" — bewusst NICHT
// die generische Akzentfarbe (`accent`), weil genau die schon fest an
// "Peptide" vergeben ist (KATEGORIE_META.peptid.dot) und beide Reiter sonst
// beim Anwählen identisch aussehen (bestätigter Bug, 29.07.).
const WOCHENUEBERSICHT_FARBE = "#64748B";

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

      {/* Routinen bewusst VOR den 9 Reitern (Nutzerinnen-Vorgabe, 29.07.:
          Priorität) — nicht nachträglich angehängt. */}
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Routinen</div>
      {ROUTINEN_EINTRAEGE.map((r) => (
        <ListenEintrag key={r.id} eintrag={r} onClick={() => setPlaneTab(r.id)} />
      ))}

      <div style={{ fontSize: 14, fontWeight: 800, margin: "20px 0 8px" }}>Pläne</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {PLAENE_TABS.map((t) => {
          const dot = KATEGORIE_META[TAB_ZU_KATEGORIE[t.id]]?.dot || WOCHENUEBERSICHT_FARBE;
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
