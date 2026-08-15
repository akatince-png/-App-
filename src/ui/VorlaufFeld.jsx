import React from "react";
import { Label, Pill } from "./primitives";
import { textMuted } from "./theme";

const OPTIONEN_BASIS = [
  { minuten: 0, label: "Aus" },
  { minuten: 5, label: "5 Min." },
  { minuten: 10, label: "10 Min." },
  { minuten: 15, label: "15 Min." },
  { minuten: 30, label: "30 Min." },
  { minuten: 60, label: "1 Std." },
  { minuten: 120, label: "2 Std." },
];
const OPTIONEN_MIT_TAGEN = [...OPTIONEN_BASIS, { minuten: 1440, label: "1 Tag" }, { minuten: 2880, label: "2 Tage" }];

// Zusätzlicher Vorab-Hinweis ("Gleich dran"), wählbar pro Kategorie, statt
// serverseitig fest auf 15 Minuten codiert (send-due-reminders/index.ts) —
// Nutzerinnen-Vorgabe (15.08.): "vor einem Training, vor einem Vorhaben...
// muss ich einstellen können, dass ich so und so viele Minuten vor dem
// Start schon daran erinnert werde". "Tage vorher" (mitTagen) gibt's nur
// bei Kategorien mit echtem Wochenplan (Training/Ernährung) — bei täglich
// wiederkehrenden Kategorien (Gewohnheiten, Dosierung, Hydration/
// Tageslicht/Schlaf-Zeitenliste) wäre "1 Tag vorher" gleichbedeutend mit
// "jeden Tag zur selben Zeit", also ohne echten Vorlauf-Effekt.
export default function VorlaufFeld({ value, onChange, mitTagen = false }) {
  const optionen = mitTagen ? OPTIONEN_MIT_TAGEN : OPTIONEN_BASIS;
  const aktuellerWert = typeof value === "number" ? value : 15;

  return (
    <div style={{ marginTop: 8 }}>
      <Label>Vorab-Hinweis („Gleich dran")</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {optionen.map((o) => (
          <Pill key={o.minuten} label={o.label} selected={aktuellerWert === o.minuten} onClick={() => onChange(o.minuten)} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
        Zusätzlich zur Erinnerung selbst kommt so früh genug vorher schon ein kurzer Hinweis.
      </div>
    </div>
  );
}
