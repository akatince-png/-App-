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

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {PLAENE_TABS.map((t) => {
          const dot = KATEGORIE_META[TAB_ZU_KATEGORIE[t.id]]?.dot;
          const aktiv = planeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPlaneTab(t.id)}
              style={{
                flex: "1 1 30%",
                padding: "9px 4px",
                borderRadius: 10,
                border: `1px solid ${aktiv ? dot || cardBorder : cardBorder}`,
                background: aktiv ? dot || "#fff" : "#fff",
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
    </Shell>
  );
}
