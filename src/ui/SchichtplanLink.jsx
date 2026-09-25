import React from "react";
import { cardBorder, textMuted } from "./theme";

// Einstieg zur Seite "Routine-Zeiten & Schichtplan" (25.09.) unter dem
// Zeitrahmen-Editor — der Zeitrahmen dort ist die normale Zeit, an
// Schichttagen gilt die Zeit der Schicht.
export function zumSchichtplan() {
  window.location.hash = "#/schichtplan";
}

export default function SchichtplanLink({ heutePlan, anzahlVarianten }) {
  const heuteText = heutePlan && heutePlan.art !== "standard" ? `Heute gilt ${heutePlan.icon || ""} ${heutePlan.label}` : null;
  return (
    <button
      type="button"
      className="mp-tap"
      onClick={zumSchichtplan}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginTop: 12, border: `1.5px solid ${cardBorder}`, borderRadius: 14, padding: "10px 12px", background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
    >
      <span style={{ fontSize: 20 }}>📅</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 800 }}>Zeiten je Schicht & Schichtplan</span>
        <span style={{ display: "block", fontSize: 11.5, color: textMuted }}>
          {heuteText || (anzahlVarianten ? `${anzahlVarianten} Zeit-Varianten angelegt` : "Für Früh-/Spätschicht oder wechselnde Wochen")}
        </span>
      </span>
      <span style={{ fontSize: 18, color: textMuted }}>›</span>
    </button>
  );
}
