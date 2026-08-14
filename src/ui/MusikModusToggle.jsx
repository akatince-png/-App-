import React from "react";
import { Pill } from "./primitives";
import { textMuted } from "./theme";

// Musik-Verhalten während Intervall-Pausen (14.08., Nutzerin-Vorgabe) —
// geteilt zwischen WorkflowTimer.jsx und TrainingView.jsx (Intervalltimer),
// gespeicherter Wert kommt/geht über utils/intervallMusikStorage.js.
export default function MusikModusToggle({ modus, onChange, label = "🎵 Musik in den Pausen" }) {
  return (
    <div style={{ marginTop: 10 }}>
      {label && <div style={{ fontSize: 11.5, fontWeight: 700, color: textMuted, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Pill label="Durchgehend" selected={modus === "durchgehend"} onClick={() => onChange("durchgehend")} />
        <Pill label="⏸️ Pausiert" selected={modus === "pause"} onClick={() => onChange("pause")} />
      </div>
      <div style={{ fontSize: 10.5, color: textMuted, marginTop: 4 }}>
        Wird vor jeder Pause leiser und zu Beginn der nächsten Arbeitsphase wieder lauter
        {modus === "pause" ? " (und pausiert dazwischen ganz)" : ""}. Zuverlässig nur, solange das Handy entsperrt/die App offen ist.
      </div>
    </div>
  );
}
