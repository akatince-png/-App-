import React, { useState } from "react";
import { Label, Pill, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { accentDark, cardBorder, danger, success, textMuted } from "./theme";

// Beispiel-Schritte je Routine (14.08., Nutzerin-Vorgabe: "ein paar
// Beispiele, damit jemand, der nicht so einfallsreich ist, darauf kommt,
// was gemeint ist") — bewusst als direkt antippbare Vorschläge statt nur
// Text, damit kein zusätzlicher Denkschritt "was könnte ich eintragen"
// nötig ist (Friction Reduction). Ein Tap trägt den Schritt sofort mit
// Standarddauer ein; wer's anders will, tippt weiter unten manuell.
const BEISPIELE = {
  morgen: [
    ["Wasser trinken", 2],
    ["Tageslicht/ans Fenster", 5],
    ["Medikament nehmen", 2],
    ["Zähne putzen", 3],
    ["Duschen", 10],
    ["Anziehen", 5],
    ["Frühstück", 10],
    ["5 Min. Bewegung/Dehnen", 5],
  ],
  abend: [
    ["Licht dimmen", 2],
    ["Handy weglegen", 2],
    ["Bett vorbereiten", 5],
    ["Zähne putzen", 3],
    ["Progressive Muskelentspannung", 10],
    ["Atemübung", 5],
    ["Lesen", 15],
    ["Brain Dump: To-do für morgen aufschreiben", 5],
    ["Duschen", 10],
  ],
};

// Konfiguration der Morgen-/Abendroutine-Schritte (Phase 1, 13.08.) — frei
// benennbare Schritte mit geplanter Dauer, nicht an bestehende Kategorien
// gebunden (z. B. "Duschen", "Kosmetik" sind kein eigener Tracker in der
// App, aber ein Schritt in der Routine). Reihenfolge per Pfeil-Tasten statt
// Drag&Drop, reicht für die üblichen wenigen Schritte einer Routine.
export default function RoutineSchritteEditor({ schritte, onHinzufuegen, onEntfernen, onVerschieben, routine }) {
  const [name, setName] = useState("");
  const [dauerMin, setDauerMin] = useState("10");
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);

  // onHinzufuegen kam bisher ohne Rückmeldung aus — schlug das Speichern
  // fehl (z. B. fehlende Tabelle/RLS-Policy), passierte einfach gar nichts
  // sichtbares (Nutzerinnen-Vorgabe 16.08.: "es lässt sich ja gar nicht
  // bestätigen"). Jetzt wird sowohl der Fehler als auch der Erfolg sichtbar
  // gemeldet, statt Fehler nur in der Browser-Konsole verschwinden zu
  // lassen — siehe useRoutinen.js. Der neue Schritt erscheint zwar auch
  // sofort oben in der Liste, aber eine ausdrückliche Bestätigung nimmt
  // die Unsicherheit "hat der Tap überhaupt was gemacht?".
  const antippen = async (schrittName, schrittDauer) => {
    setFehler(null);
    setErfolg(null);
    const result = await onHinzufuegen(schrittName, schrittDauer);
    if (result && result.ok === false) {
      setFehler(result.error || "Speichern fehlgeschlagen.");
      return;
    }
    setErfolg(`„${schrittName}" hinzugefügt.`);
    setTimeout(() => setErfolg(null), 2500);
  };

  const hinzufuegen = async () => {
    if (!name.trim()) return;
    setFehler(null);
    setErfolg(null);
    const result = await onHinzufuegen(name, dauerMin);
    if (result && result.ok === false) {
      setFehler(result.error || "Speichern fehlgeschlagen.");
      return;
    }
    setErfolg(`„${name}" hinzugefügt.`);
    setTimeout(() => setErfolg(null), 2500);
    setName("");
    setDauerMin("10");
  };

  const sortiert = [...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const vorhandeneNamen = new Set(sortiert.map((s) => s.name.toLowerCase()));
  const beispiele = (BEISPIELE[routine] || []).filter(([bname]) => !vorhandeneNamen.has(bname.toLowerCase()));

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

      {beispiele.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>Ideen zum Antippen:</div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {beispiele.map(([bname, bdauer]) => (
              <Pill key={bname} label={bname} onClick={() => antippen(bname, bdauer)} />
            ))}
          </div>
        </div>
      )}

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
          style={{ minHeight: 46, padding: "0 16px", borderRadius: 12, border: "none", background: accentDark, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + Hinzufügen
        </button>
      </div>
      {fehler && <div style={{ fontSize: 11.5, color: danger, marginTop: 6 }}>{fehler}</div>}
      {erfolg && <div style={{ fontSize: 11.5, color: success, marginTop: 6, fontWeight: 700 }}>✓ {erfolg}</div>}
    </div>
  );
}
