import React, { useState } from "react";
import WheelPicker from "./WheelPicker";
import { cardBorder, textMain, textMuted } from "./theme";

const STUNDEN = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTEN = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// Drop-in-Ersatz für `TextInput type="time"` — zwei Scroll-Räder
// (Stunde/Minute) statt Tastatur bzw. nativem Zeit-Picker. Erzeugt
// denselben `"HH:MM"`-String wie das bisherige Feld, also direkt austauschbar.
export default function TimeWheelField({ value, onChange }) {
  const [offen, setOffen] = useState(false);
  const [h, m] = (value || "20:00").split(":");

  const setStunde = (neueH) => onChange(`${neueH}:${m || "00"}`);
  const setMinute = (neueM) => onChange(`${h || "20"}:${neueM}`);

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
          color: value ? textMain : textMuted,
          fontSize: 14.5,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{value || "Uhrzeit wählen"}</span>
        <span style={{ fontSize: 12, color: textMuted }}>{offen ? "▲" : "▼"}</span>
      </button>
      {offen && (
        <div
          style={{
            marginTop: 6,
            border: `1px solid ${cardBorder}`,
            borderRadius: 14,
            background: "#fff",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <WheelPicker values={STUNDEN} value={h || "20"} onChange={setStunde} />
          <div style={{ fontSize: 18, fontWeight: 800, color: textMuted }}>:</div>
          <WheelPicker values={MINUTEN} value={m || "00"} onChange={setMinute} />
        </div>
      )}
    </div>
  );
}
