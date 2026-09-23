import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextArea, TextInput } from "../../ui/primitives";
import { danger, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { addDays, toLocalISODate } from "../../utils/dates";

// Paralleles Zusatzprotokoll anlegen (Nutzerinnen-Wunsch 23.09.): läuft NEBEN
// dem Hauptprotokoll, archiviert nichts — gedacht für Experimente ("4 Wochen
// Magnesium abends testen"), die nicht Teil des festen Protokolls werden
// sollen. Nach dem Anlegen wird das neue Protokoll zum "Eintrags-Ziel"
// (siehe CoreDataContext): alles, was danach in den Plänen neu angelegt wird,
// landet dort, bis im Banner oben "Fertig" getippt wird.
const NAMENS_VORSCHLAEGE = ["Experiment", "Schlaf-Experiment", "Supplement-Test", "Fastenwoche", "Neue Gewohnheit testen"];
const LAUFZEITEN = [
  { label: "2 Wochen", wochen: 2 },
  { label: "4 Wochen", wochen: 4 },
  { label: "8 Wochen", wochen: 8 },
  { label: "Offen", wochen: null },
];

export default function ZusatzprotokollErstellenView({ onErstellt, onAbbrechen }) {
  const { zusatzprotokollErstellen, aktivesHauptprotokoll } = useAppData();
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [startdatum, setStartdatum] = useState(toLocalISODate(new Date()));
  const [laufzeitWochen, setLaufzeitWochen] = useState(4);
  const [fehler, setFehler] = useState(null);
  const [speichert, setSpeichert] = useState(false);

  const speichern = async () => {
    setFehler(null);
    setSpeichert(true);
    const geplantesEnde = laufzeitWochen ? toLocalISODate(addDays(new Date(`${startdatum}T12:00:00`), laufzeitWochen * 7)) : null;
    const result = await zusatzprotokollErstellen({ name, beschreibung, startdatum, geplantesEnde });
    setSpeichert(false);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    onErstellt(result.zusatzprotokoll);
  };

  return (
    <Shell>
      <div style={{ paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>🧪</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Zusatzprotokoll parallel starten</div>
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
          Läuft neben {aktivesHauptprotokoll ? `„${aktivesHauptprotokoll.name}"` : "deinem Hauptprotokoll"} — dort ändert sich nichts. Ideal, um
          etwas auszuprobieren, ohne es gleich fest ins Hauptprotokoll aufzunehmen. Später kannst du es beenden oder ins Hauptprotokoll
          übernehmen.
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Label>Wie soll es heißen?</Label>
        <TextInput value={name} onChange={setName} placeholder="z. B. Magnesium abends testen" />
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
          {NAMENS_VORSCHLAEGE.map((v) => (
            <Pill key={v} label={v} selected={name === v} onClick={() => setName(v)} />
          ))}
        </div>

        <Label>Was möchtest du herausfinden? (optional)</Label>
        <TextArea value={beschreibung} onChange={setBeschreibung} placeholder="z. B. Schlafe ich mit Magnesium besser durch?" />

        <Label>Start</Label>
        <TextInput type="date" value={startdatum} onChange={(v) => setStartdatum(v || toLocalISODate(new Date()))} />

        <Label>Wie lange?</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {LAUFZEITEN.map((l) => (
            <Pill key={l.label} label={l.label} selected={laufzeitWochen === l.wochen} onClick={() => setLaufzeitWochen(l.wochen)} />
          ))}
        </div>
      </Card>

      {fehler && <div style={{ fontSize: 12.5, color: danger, marginBottom: 10 }}>{fehler}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={speichern} disabled={speichert || !name.trim()}>
          {speichert ? "Einen Moment…" : "Starten & Einträge hinzufügen"}
        </PrimaryButton>
        <PrimaryButton onClick={onAbbrechen} variant="ghost">
          Abbrechen
        </PrimaryButton>
      </div>
    </Shell>
  );
}
