import React, { useEffect, useRef, useState } from "react";
import { Label, Pill, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { accentDark, danger, success, textMuted } from "./theme";

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

// Kategorien, aus denen sich fertige Einträge als Schritt übernehmen lassen
// (12.09., Nutzerinnen-Vorgabe: "ich möchte nicht alles von Hand
// reinschreiben müssen ... ich möchte auf Ernährung klicken und den Snack
// einbauen, auf Training klicken und Seilspringen einbauen"). Bewusst als
// Reiter über bereits vorhandene Daten statt eines neuen, separaten
// Bereichs — ein Tap fügt den Namen direkt als Schritt hinzu, genau wie bei
// den Beispielen oben (derselbe antippen()-Pfad, keine eigene Logik nötig).
const KATEGORIE_TABS = [
  { id: "training", label: "Training" },
  { id: "ernaehrung", label: "Ernährung" },
  { id: "supplemente", label: "Supplemente" },
  { id: "medikamente", label: "Medikamente" },
  { id: "gewohnheiten", label: "Gewohnheiten" },
  { id: "hydration", label: "Wasser" },
];

// Vorgeschlagene Dauer je Kategorie — die Trainings-/Gewohnheiten-/etc.-
// Einträge selbst tragen keine für einen Routine-Schritt sinnvolle Dauer,
// deshalb hier ein pragmatischer Standardwert je Kategorie (wie bei den
// Beispielen oben frei änderbar über die Schritt-Liste, sobald übernommen).
function kategorieItems(tab, { mahlzeiten, supplemente, hormone, trainingWochenplan, gewohnheiten }) {
  if (tab === "training") {
    return trainingWochenplan.map((w) => [`${w.wochentag} · ${w.name || (w.arten?.length ? w.arten.join(" + ") : "Training")}`, 15]);
  }
  if (tab === "ernaehrung") return mahlzeiten.map((m) => [m.name, 10]);
  if (tab === "supplemente") return supplemente.map((s) => [s.name, 2]);
  if (tab === "medikamente") return hormone.map((name) => [name, 2]);
  if (tab === "gewohnheiten") return gewohnheiten.map((g) => [g.name, 5]);
  if (tab === "hydration") return [["Wasser trinken", 2]];
  return [];
}

// Konfiguration der Morgen-/Abendroutine-Schritte (Phase 1, 13.08.) — frei
// benennbare Schritte mit geplanter Dauer, nicht an bestehende Kategorien
// gebunden (z. B. "Duschen", "Kosmetik" sind kein eigener Tracker in der
// App, aber ein Schritt in der Routine). Reihenfolge per Pfeil-Tasten statt
// Drag&Drop, reicht für die üblichen wenigen Schritte einer Routine.
export default function RoutineSchritteEditor({
  schritte,
  onHinzufuegen,
  routine,
  mahlzeiten = [],
  supplemente = [],
  hormone = [],
  trainingWochenplan = [],
  gewohnheiten = [],
}) {
  const [name, setName] = useState("");
  const [dauerMin, setDauerMin] = useState("10");
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);
  const [aktiverTab, setAktiverTab] = useState(null);
  // Bug-Fix (13.09.): siehe QuickTaskList.jsx für denselben Bug — ein
  // zweiter, schnell hintereinander hinzugefügter Schritt konnte durch den
  // ungeräumten Timer des ersten Aufrufs seine eigene Erfolgsmeldung
  // vorzeitig verlieren.
  const erfolgTimeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(erfolgTimeoutRef.current), []);

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
    clearTimeout(erfolgTimeoutRef.current);
    erfolgTimeoutRef.current = setTimeout(() => setErfolg(null), 2500);
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
    clearTimeout(erfolgTimeoutRef.current);
    erfolgTimeoutRef.current = setTimeout(() => setErfolg(null), 2500);
    setName("");
    setDauerMin("10");
  };

  const sortiert = [...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const vorhandeneNamen = new Set(sortiert.map((s) => s.name.toLowerCase()));
  const beispiele = (BEISPIELE[routine] || []).filter(([bname]) => !vorhandeneNamen.has(bname.toLowerCase()));

  return (
    <div style={{ marginTop: 10 }}>
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

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>Aus anderen Bereichen übernehmen:</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {KATEGORIE_TABS.map((tab) => (
            <Pill key={tab.id} label={tab.label} selected={aktiverTab === tab.id} onClick={() => setAktiverTab((prev) => (prev === tab.id ? null : tab.id))} />
          ))}
        </div>
        {aktiverTab && (
          <div style={{ marginTop: 4 }}>
            {(() => {
              const alleItems = kategorieItems(aktiverTab, { mahlzeiten, supplemente, hormone, trainingWochenplan, gewohnheiten });
              const items = alleItems.filter(([iname]) => !vorhandeneNamen.has(iname.toLowerCase()));
              if (alleItems.length === 0) {
                return <div style={{ fontSize: 11.5, color: textMuted, fontStyle: "italic" }}>Dort ist noch nichts eingerichtet.</div>;
              }
              if (items.length === 0) {
                return <div style={{ fontSize: 11.5, color: textMuted, fontStyle: "italic" }}>Schon alles aus diesem Bereich übernommen.</div>;
              }
              return (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {items.map(([iname, idauer]) => (
                    <Pill key={iname} label={iname} onClick={() => antippen(iname, idauer)} />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Label>Neuer Schritt</Label>
          <TextInput value={name} onChange={setName} placeholder="z. B. Duschen" />
        </div>
        <div style={{ width: 80 }}>
          <Label>Min.</Label>
          <NumberWheelField value={dauerMin} onChange={setDauerMin} min={1} max={60} step={1} />
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
