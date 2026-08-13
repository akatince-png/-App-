import React from "react";
import { Label, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import AutocompleteInput from "./AutocompleteInput";
import { accentDark, cardBorder, danger } from "./theme";

// Leere Übung: Name + Sätze/Wiederholungen/Gewicht + Pause zwischen Sätzen
// — dieselbe Struktur überall, wo eine Liste einzelner Übungen mit eigenen
// Werten gebraucht wird (echtes Trainingslog UND Wochenplan-Vorlage).
export const LEERE_UEBUNG = { name: "", saetze: "", wiederholungen: "", gewicht: "", pauseSekunden: "180" };

// Übungsliste (Name + Sätze/Wdh/Gewicht + Pause) — geteilt zwischen
// TrainingView.jsx (echtes Training loggen) und WochenplanEditor.jsx
// (Wochenplan-Vorlage), damit beide Stellen dieselbe Struktur nutzen: jede
// Übung hat ihre EIGENEN Sätze/Wiederholungen/Gewicht, statt nur eines
// einzigen Werts für die ganze Einheit (Nutzerinnen-Vorgabe, 13.08. — die
// alte Wochenplan-Maske hatte nur ein globales Sätze/Wdh-Paar für alle
// Übungen zusammen, das war nicht praxistauglich).
export default function UebungenEditor({ uebungen, optionen, gewichtPlatzhalter, onAendern, onEntfernen, onHinzufuegen, akzent = accentDark }) {
  return (
    <>
      <Label>Übungen</Label>
      {uebungen.map((u, i) => (
        <div key={i} style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <AutocompleteInput value={u.name} onChange={(v) => onAendern(i, "name", v)} options={optionen} placeholder="Übung" />
            </div>
            {uebungen.length > 1 && (
              <button
                onClick={() => onEntfernen(i)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <NumberWheelField value={u.saetze} onChange={(v) => onAendern(i, "saetze", v)} min={1} max={20} placeholder="Sätze" />
            </div>
            <div style={{ flex: 1 }}>
              <NumberWheelField value={u.wiederholungen} onChange={(v) => onAendern(i, "wiederholungen", v)} min={1} max={50} placeholder="Wdh." />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput value={u.gewicht} onChange={(v) => onAendern(i, "gewicht", v)} placeholder={gewichtPlatzhalter} />
            </div>
          </div>
          <Label>Pause zwischen Sätzen (Sek.)</Label>
          <NumberWheelField value={u.pauseSekunden} onChange={(v) => onAendern(i, "pauseSekunden", v)} min={0} max={600} step={15} placeholder="180" />
        </div>
      ))}
      <button
        onClick={onHinzufuegen}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 10,
          border: `1px dashed ${cardBorder}`,
          background: "transparent",
          color: akzent,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 6,
        }}
      >
        + weitere Übung
      </button>
    </>
  );
}
