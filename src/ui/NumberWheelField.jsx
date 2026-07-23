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
          minHeight: 46,
          padding: "12px 14px",
          borderRadius: 14,
          border: `1px solid ${offen ? textMain : cardBorder}`,
          background: "#FAFBFA",
          color: aktuell ? textMain : textMuted,
          fontSize: 14.5,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{aktuell || placeholder || "Wählen"}</span>
        <span style={{ fontSize: 12, color: textMuted }}>{offen ? "▲" : "▼"}</span>
      </button>
      {offen && (
        <div style={{ marginTop: 6, border: `1px solid ${cardBorder}`, borderRadius: 14, background: "#fff", padding: "4px 10px" }}>
          <WheelPicker values={values} value={aktuell || values[0]} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
