import React from "react";
import { Shell, Card } from "../ui/primitives";
import { cardBorder, textMuted } from "../ui/theme";

export default function BlutzuckerView({ onHome }) {
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🩸 Blutzucker / CGM</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>🚧</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Blutzucker / CGM — bald verfügbar</div>
        <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
          Hier entsteht die Anbindung an Blutzuckermessung / CGM-Sensoren, um Werte im
          Zeitverlauf zu erfassen und auszuwerten.
        </div>
      </Card>
    </Shell>
  );
}
