import React from "react";
import { Shell } from "../../ui/primitives";
import { accent, cardBorder, textMuted } from "../../ui/theme";
import StatistikTab from "./StatistikTab";
import ProfilTab from "./ProfilTab";
import CommunityTab from "./CommunityTab";
import ArchivTab from "./ArchivTab";
import ProtokollLogView from "../ProtokollLogView";
import BlutzuckerView from "../BlutzuckerView";

const TABS = [
  { id: "verlauf", label: "Protokolle" },
  { id: "archiv", label: "Archiv" },
  { id: "statistik", label: "Statistik" },
  { id: "profil", label: "Profil" },
  { id: "blutzucker", label: "Blutzucker" },
  { id: "community", label: "Community" },
];

// "Archiv"-Hub — bündelt alles, was der Rückschau/Dokumentation dient
// (Protokolle, Archiv, Statistik, Profil/Biomarker, Blutzucker, Community)
// unter einem gemeinsamen Reiter-Kopf. "Mehr" ist bewusst kein Reiter mehr
// hier, sondern ein eigenständiges Ziel der unteren Tab-Leiste (MehrView.jsx).
export default function PlanView({ planTab, setPlanTab, onHome, onEditProtocol }) {
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Archiv</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

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

      {planTab === "verlauf" && <ProtokollLogView embedded />}
      {planTab === "statistik" && <StatistikTab />}
      {planTab === "profil" && <ProfilTab />}
      {planTab === "community" && <CommunityTab />}
      {planTab === "archiv" && <ArchivTab />}
      {planTab === "blutzucker" && <BlutzuckerView embedded />}

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
        Zu deinem Peptid-Protokoll
      </button>
    </Shell>
  );
}
