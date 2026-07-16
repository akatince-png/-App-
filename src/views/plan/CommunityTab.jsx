import React from "react";
import { Card } from "../../ui/primitives";
import { accent, accentDark, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";

export default function CommunityTab() {
  const { datenteilung, toggleDatenteilung } = useAppData();

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Anonyme Datenteilung</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Daten anonym mit der Community teilen</div>
            <div style={{ fontSize: 12, color: textMuted }}>Hilft, Trends zu Wirksamkeit &amp; Nebenwirkungen zu erkennen. Du bleibst 100% anonym.</div>
          </div>
          <button
            onClick={toggleDatenteilung}
            style={{ width: 46, height: 26, borderRadius: 13, border: "none", background: datenteilung ? accent : "#D9EEE7", position: "relative", cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: datenteilung ? 23 : 3, transition: "left 0.2s ease" }} />
          </button>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Beispiel: BPC-157 zur Sehnenverletzung</div>
      <Card style={{ marginBottom: 14, opacity: datenteilung ? 1 : 0.5 }}>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 10 }}>Anonymisierte Daten von 124 Nutzer:innen</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>Verbesserung nach 4 Wochen</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: accentDark }}>72%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13 }}>Nebenwirkungen (leicht/mittel)</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>18%</span>
        </div>
        {!datenteilung && <div style={{ fontSize: 11, color: textMuted, marginTop: 10 }}>Aktiviere die Datenteilung oben, um Community-Insights freizuschalten.</div>}
      </Card>
    </>
  );
}
