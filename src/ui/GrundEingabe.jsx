import React, { useState } from "react";
import { TextInput } from "./primitives";
import { accentDark, textMuted } from "./theme";

// Optionale Grund-Erfassung für Änderungsprotokoll-Einträge — folgt dem
// Toggle-dann-Inline-Formular-Muster aus GewohnheitenView (kein Modal, das
// gibt es in dieser App bewusst nicht). Nie ein Pflichtfeld: der Aufrufer
// speichert die eigentliche Änderung auch, wenn grund leer ist.
export default function GrundEingabe({ grund, onChange, label = "Grund (optional)" }) {
  const [offen, setOffen] = useState(false);

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0, marginTop: 6 }}
      >
        + Grund notieren (optional)
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: textMuted, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <TextInput value={grund} onChange={onChange} placeholder="z. B. Nebenwirkungen, Rücksprache mit Arzt …" />
    </div>
  );
}
