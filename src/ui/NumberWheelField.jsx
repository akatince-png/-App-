import React, { useState } from "react";
import WheelPicker from "./WheelPicker";
import { cardBorder, textMain, textMuted } from "./theme";

// Drop-in-Ersatz für `TextInput type="number"` bei kleinen, festen
// Zahlenbereichen (z. B. Sätze, Wiederholungen, Pause-Sekunden) — tippen
// öffnet ein Scroll-Rad direkt unter dem Feld statt die Tastatur.
// Gleicher `value`/`onChange(string)`-Vertrag wie TextInput.
export default function NumberWheelField({ value, onChange, min, max, step = 1, placeholder }) {
  const [offen, setOffen] = useState(false);
  const values = [];
  for (let v = min; v <= max; v += step) values.push(String(v));
  const aktuell = value !== "" && value !== undefined && value !== null ? String(value) : "";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        className="mp-tap"
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: 56,
          padding: "14px 18px",
          borderRadius: 16,
          border: `1.5px solid ${offen ? textMain : cardBorder}`,
          background: "#FAFBFA",
          color: aktuell ? textMain : textMuted,
          fontSize: 18,
          fontWeight: 700,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{aktuell || placeholder || "Wählen"}</span>
        <span style={{ fontSize: 14, color: textMuted }}>{offen ? "▲" : "▼"}</span>
      </button>
      {offen && (
        <div style={{ marginTop: 8, border: `1px solid ${cardBorder}`, borderRadius: 16, background: "#fff", padding: "4px 14px" }}>
          <WheelPicker values={values} value={aktuell || values[0]} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
