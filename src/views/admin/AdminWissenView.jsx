import React, { useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Label, Pill } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { accentDark, danger, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";

// Dieselben bereich-Werte wie BEREICH_OPTIONEN in AdminDashboardView.jsx
// (AdminNotizPanel) — müssen exakt mit den KiChat-`bereich`-Props
// übereinstimmen, sonst greift der Filter in KiChat.jsx nie.
const BEREICH_OPTIONEN = [
  { value: "", label: "Allgemein" },
  { value: "training", label: "Training" },
  { value: "ernaehrung", label: "Ernährung" },
  { value: "hydration", label: "Hydration" },
  { value: "tageslicht", label: "Tageslicht" },
  { value: "schlaf", label: "Schlaf" },
  { value: "supplemente", label: "Supplemente" },
  { value: "medikamente", label: "Medikamente" },
  { value: "gewohnheiten", label: "Gewohnheiten" },
];

// Wissens-Basis-Verwaltung (13.08., "Aka lernt mit") — Gegenstück zu den
// statischen .md-Dateien unter src/wissen/: hier trägt die Admin jederzeit
// direkt aus der App neues Wissen ein (kurze Notizen vom Handy genauso wie
// große eingefügte Recherche-Zusammenfassungen), ohne dass ein Deploy
// nötig ist. Fließt über KiChat.jsx in JEDEN Gesprächskontext ein.
export default function AdminWissenView({ onHome }) {
  const { coachWissen, coachWissenHinzufuegen, coachWissenEntfernen } = useAppData();
  const [bereich, setBereich] = useState("");
  const [titel, setTitel] = useState("");
  const [text, setText] = useState("");
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const speichern = async () => {
    setFehler(null);
    setSpeichernLaeuft(true);
    const result = await coachWissenHinzufuegen({ bereich, titel, text });
    setSpeichernLaeuft(false);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    setTitel("");
    setText("");
  };

  const bereichLabel = (value) => BEREICH_OPTIONEN.find((b) => b.value === (value || ""))?.label || value;

  return (
    <Shell>
      <ViewHeader title="📚 Wissens-Basis" onHome={onHome} />

      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.6 }}>
        Alles, was du hier einträgst, kennt Aka ab sofort in jedem Gespräch — egal ob eine kurze Notiz oder eine
        größere Zusammenfassung, die du z. B. aus einer Recherche hier einfügst. "Allgemein" gilt überall,
        ein gewählter Bereich nur dort.
      </div>

      <Card style={{ marginBottom: 18 }}>
        <Label>Bereich</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {BEREICH_OPTIONEN.map((b) => (
            <Pill key={b.value} label={b.label} selected={bereich === b.value} onClick={() => setBereich(b.value)} />
          ))}
        </div>

        <Label>Titel</Label>
        <TextInput value={titel} onChange={setTitel} placeholder="z. B. Sonnenlicht am Morgen bei ADHS" />

        <Label>Text</Label>
        <TextArea value={text} onChange={setText} placeholder="Kurze Notiz oder größerer Text zum Einfügen ..." />

        {fehler && <div style={{ fontSize: 12.5, color: danger, marginTop: 8 }}>{fehler}</div>}
        <div style={{ marginTop: 12 }}>
          <PrimaryButton onClick={speichern} disabled={speichernLaeuft || !titel.trim() || !text.trim()}>
            {speichernLaeuft ? "Speichert…" : "Zur Wissens-Basis hinzufügen"}
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Bisherige Einträge</div>
      {coachWissen.length === 0 && (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch keine Einträge.</div>
        </Card>
      )}
      {coachWissen.map((w) => (
        <Card key={w.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: accentDark, fontWeight: 700, marginBottom: 3 }}>{bereichLabel(w.bereich)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{w.titel}</div>
              <div style={{ fontSize: 12.5, color: textMuted, whiteSpace: "pre-wrap" }}>{w.text}</div>
            </div>
            <button
              onClick={() => coachWissenEntfernen(w.id)}
              className="mp-tap"
              style={{ flexShrink: 0, border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer" }}
              title="Eintrag löschen"
            >
              ×
            </button>
          </div>
        </Card>
      ))}
    </Shell>
  );
}
