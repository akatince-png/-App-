import React from "react";
import { Shell } from "../../ui/primitives";
import { accent, cardBorder, textMuted } from "../../ui/theme";
import { PLAENE_TABS } from "../../constants";
import SchlafView from "../SchlafView";
import HydrationView from "../HydrationView";
import NutritionView from "../NutritionView";
import TrainingView from "../TrainingView";
import SupplementeView from "../SupplementeView";
import MedikamenteView from "../MedikamenteView";
import PeptidView from "../PeptidView";
import WochenuebersichtView from "../WochenuebersichtView";

const VIEWS = {
  schlaf: SchlafView,
  hydration: HydrationView,
  ernaehrung: NutritionView,
  training: TrainingView,
  supplemente: SupplementeView,
  medikamente: MedikamenteView,
  peptide: PeptidView,
  wochenuebersicht: WochenuebersichtView,
};

// "Alle Pläne"-Hub — bündelt die 7 Kategorien, die aktiv mit Zeiten/Zielen
// geplant werden, unter einem gemeinsamen Reiter-Kopf statt als eigene
// Dashboard-Kacheln. Gleiches Muster wie PlanView.jsx (Statistik/Profil/
// Community/Archiv). Jede Kategorie-View wird mit `embedded` gerendert,
// damit sie ihren eigenen Shell/Header nicht dupliziert.
export default function PlaeneView({ planeTab, setPlaneTab, onHome, initialSessionId, onConsumedInitialSession }) {
  const Aktiv = VIEWS[planeTab] || VIEWS.schlaf;

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Alle Pläne</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {PLAENE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPlaneTab(t.id)}
            style={{
              flex: "1 1 30%",
              padding: "9px 4px",
              borderRadius: 10,
              border: `1px solid ${planeTab === t.id ? accent : cardBorder}`,
              background: planeTab === t.id ? accent : "#fff",
              color: planeTab === t.id ? "#fff" : textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <Aktiv embedded initialSessionId={initialSessionId} onConsumedInitialSession={onConsumedInitialSession} />
    </Shell>
  );
}
