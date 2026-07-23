import React from "react";
import { Label, Pill, TextInput } from "./primitives";
import { textMuted } from "./theme";

// Wiederverwendbares Zieldauer-Feld für die Onboarding-Kategorie-Screens:
// "offen" (fortlaufend) vs. "wochen" (zeitlich begrenzt, mit Wochenzahl).
// value: { modus: "offen" | "wochen", wochen: string }
export default function ZieldauerField({ value, onChange }) {
  const modus = value?.modus || "offen";
  const wochen = value?.wochen || "";

  return (
    <div>
      <Label>Zieldauer</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Pill label="Offen / fortlaufend" selected={modus === "offen"} onClick={() => onChange({ modus: "offen", wochen: "" })} />
        <Pill label="Zeitlich begrenzt" selected={modus === "wochen"} onClick={() => onChange({ modus: "wochen", wochen })} />
      </div>
      {modus === "wochen" && (
        <div style={{ marginTop: 8, maxWidth: 140 }}>
          <TextInput type="number" value={wochen} onChange={(v) => onChange({ modus: "wochen", wochen: v })} placeholder="Wochen, z. B. 12" />
        </div>
      )}
      <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
        Offen ist völlig okay — du kannst das jederzeit später anpassen.
      </div>
    </div>
  );
}
