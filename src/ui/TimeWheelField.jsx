import React, { useState } from "react";
import { cardBorder, textMain, textMuted } from "./theme";

// Nutzer-Feedback: das eigene Scroll-Rad wirkte weniger flüssig als die
// native Zeitauswahl (auf iOS ein flüssiges, 3D wirkendes Rad) — deshalb
// bewusst zurück zu `input[type="time"]`, nur einheitlich größer gestylt
// statt der kleinen Standardgröße. Gleicher `value`/`onChange(string)`-
// Vertrag wie zuvor, also an allen bisherigen Einsatzstellen austauschbar.
export default function TimeWheelField({ value, onChange }) {
  const [fokussiert, setFokussiert] = useState(false);
  return (
    <input
      type="time"
      className="mp-tap"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFokussiert(true)}
      onBlur={() => setFokussiert(false)}
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: 56,
        padding: "14px 18px",
        borderRadius: 16,
        border: `1.5px solid ${fokussiert ? textMain : cardBorder}`,
        background: "#FAFBFA",
        color: value ? textMain : textMuted,
        fontSize: 18,
        fontWeight: 700,
        outline: "none",
      }}
    />
  );
}
