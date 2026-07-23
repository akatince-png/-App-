import React from "react";
import { Shell } from "../../ui/primitives";
import { cardBorder } from "../../ui/theme";
import MehrTab from "./MehrTab";

// Dünner Shell/Header-Wrapper um MehrTab.jsx — "Mehr" ist jetzt ein
// eigenständiges Ziel der unteren Tab-Leiste statt ein Reiter innerhalb
// des Archiv-Hubs (PlanView.jsx).
export default function MehrView({ onHome, onOpenLexikon }) {
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>⚙️ Mehr</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>
      <MehrTab onOpenLexikon={onOpenLexikon} />
    </Shell>
  );
}
