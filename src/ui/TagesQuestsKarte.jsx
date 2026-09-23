import React from "react";
import { Card } from "./primitives";
import { success, textMuted } from "./theme";

// Automatische Tages-Quests (Spiel-Ausbau 23.09., Logik: utils/tagesQuests.js)
// — kleine Etappenziele des eigenen Tages, für alle sichtbar (auch ohne vom
// Coach vergebene Quests).
export default function TagesQuestsKarte({ quests }) {
  if (!quests || quests.length === 0) return null;
  const geschafft = quests.filter((q) => q.geschafft).length;
  return (
    <Card style={{ marginBottom: 20, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>🎯 Tages-Quests</div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: geschafft === quests.length ? success : textMuted }}>
          {geschafft}/{quests.length} {geschafft === quests.length ? "— alle geschafft! 🎉" : "geschafft"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {quests.map((q) => {
          const anteil = q.ziel > 0 ? Math.min(1, q.aktuell / q.ziel) : 0;
          return (
            <div key={q.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, textAlign: "center", fontSize: 18, flexShrink: 0 }}>{q.geschafft ? "✅" : q.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, fontWeight: 700 }}>
                  <span style={{ textDecoration: q.geschafft ? "line-through" : "none", color: q.geschafft ? textMuted : "inherit" }}>{q.titel}</span>
                  <span style={{ color: textMuted, whiteSpace: "nowrap" }}>
                    {q.aktuell}/{q.ziel}
                    {q.einheit ? ` ${q.einheit}` : ""}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "#EEF1F0", marginTop: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(anteil * 100)}%`, height: "100%", borderRadius: 99, background: success, transition: "width 0.5s ease-out" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
