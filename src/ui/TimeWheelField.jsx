import React, { useState } from "react";
import { cardBorder, textMain, textMuted } from "./theme";

// Nutzer-Feedback: das eigene Scroll-Rad wirkte weniger flüssig als die
// native Zeitauswahl (auf iOS ein flüssiges, 3D wirkendes Rad) — deshalb
// bewusst zurück zu `input[type="time"]`, nur einheitlich größer gestylt
// statt der kleinen Standardgröße. Gleicher `value`/`onChange(string)`-
// Vertrag wie zuvor, also an allen bisherigen Einsatzstellen austauschbar.
export default function TimeWheelField({ value, onChange, ariaLabel, kompakt = false }) {
  const [fokussiert, setFokussiert] = useState(false);
  return (
    <input
      type="time"
      className="mp-tap"
      value={value || ""}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFokussiert(true)}
      onBlur={() => setFokussiert(false)}
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: kompakt ? 48 : 56,
        padding: kompakt ? "10px 8px" : "14px 18px",
        borderRadius: 16,
        border: `1.5px solid ${fokussiert ? textMain : cardBorder}`,
        background: "color-mix(in srgb, #FAFBFA var(--mp-flaeche), var(--mp-karte))",
        color: value ? textMain : textMuted,
        fontSize: kompakt ? 16 : 18,
        fontWeight: 700,
        outline: "none",
      }}
    />
  );
}
