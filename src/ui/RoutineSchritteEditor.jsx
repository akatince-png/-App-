import React, { useState } from "react";
import { Label, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { accentDark, cardBorder, danger, textMuted } from "./theme";

// Konfiguration der Morgen-/Abendroutine-Schritte (Phase 1, 13.08.) — frei
// benennbare Schritte mit geplanter Dauer, nicht an bestehende Kategorien
// gebunden (z. B. "Duschen", "Kosmetik" sind kein eigener Tracker in der
// App, aber ein Schritt in der Routine). Reihenfolge per Pfeil-Tasten statt
// Drag&Drop, reicht für die üblichen wenigen Schritte einer Routine.
export default function RoutineSchritteEditor({ schritte, onHinzufuegen, onEntfernen, onVerschieben }) {
  const [name, setName] = useState("");
  const [dauerMin, setDauerMin] = useState("10");

  const hinzufuegen = () => {
    if (!name.trim()) return;
    onHinzufuegen(name, dauerMin);
    setName("");
    setDauerMin("10");
  };

  const sortiert = [...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);

  return (
    <div style={{ marginTop: 10 }}>
      {sortiert.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              type="button"
              onClick={() => onVerschieben(s.id, "hoch")}
              disabled={i === 0}
              style={{ border: "none", background: "transparent", color: i === 0 ? cardBorder : accentDark, fontSize: 11, cursor: i === 0 ? "default" : "pointer", padding: 0 }}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onVerschieben(s.id, "runter")}
              disabled={i === sortiert.length - 1}
              style={{ border: "none", background: "transparent", color: i === sortiert.length - 1 ? cardBorder : accentDark, fontSize: 11, cursor: i === sortiert.length - 1 ? "default" : "pointer", padding: 0 }}
            >
              ▼
            </button>
          </div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.name}</div>
          <div style={{ fontSize: 11.5, color: textMuted }}>{s.dauerMin} Min.</div>
          <button
            type="button"
            onClick={() => onEntfernen(s.id)}
            style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer", padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Label>Neuer Schritt</Label>
          <TextInput value={name} onChange={setName} placeholder="z. B. Duschen" />
        </div>
        <div style={{ width: 80 }}>
          <Label>Min.</Label>
          <NumberWheelField value={dauerMin} onChange={setDauerMin} min={1} max={120} step={5} />
        </div>
        <button
          type="button"
          onClick={hinzufuegen}
          style={{ minHeight: 46, padding: "0 14px", borderRadius: 12, border: "none", background: accentDark, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
