import React from "react";
import { Shell, Card } from "../../ui/primitives";
import { accent, accentDark, cardBorder, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { fmtDate } from "../../utils/dates";
import PlanTab from "./PlanTab";
import StatistikTab from "./StatistikTab";
import ProfilTab from "./ProfilTab";
import CommunityTab from "./CommunityTab";
import ArchivTab from "./ArchivTab";
import MehrTab from "./MehrTab";

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "statistik", label: "Statistik" },
  { id: "profil", label: "Profil" },
  { id: "community", label: "Community" },
  { id: "archiv", label: "Archiv" },
  { id: "mehr", label: "Mehr" },
];

export default function PlanView({ planTab, setPlanTab, protokollTyp, setProtokollTyp, onHome, onEditProtocol }) {
  const { plan, peptide, startdatum, dauer, erledigt } = useAppData();
  const today = new Date();
  const naechste = plan.find((d) => d.date >= today && !erledigt[`${d.date.toDateString()}__${d.peptid}`]);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Dein Plan</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
        {startdatum} · {dauer} Wochen
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{plan.length}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Injektionen gesamt</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{peptide.length}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Peptide</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{naechste ? fmtDate(naechste.date) : "—"}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Nächste Injektion</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPlanTab(t.id)}
            style={{
              flex: "1 1 30%",
              padding: "9px 0",
              borderRadius: 10,
              border: `1px solid ${planTab === t.id ? accent : cardBorder}`,
              background: planTab === t.id ? accent : "#fff",
              color: planTab === t.id ? "#fff" : textMuted,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {planTab === "plan" && <PlanTab protokollTyp={protokollTyp} setProtokollTyp={setProtokollTyp} />}
      {planTab === "statistik" && <StatistikTab />}
      {planTab === "profil" && <ProfilTab />}
      {planTab === "community" && <CommunityTab />}
      {planTab === "archiv" && <ArchivTab />}
      {planTab === "mehr" && <MehrTab />}

      <button
        onClick={onEditProtocol}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 12,
          border: `1px solid ${cardBorder}`,
          background: "#fff",
          color: textMuted,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        Zurück zum Protokoll bearbeiten
      </button>
    </Shell>
  );
}
