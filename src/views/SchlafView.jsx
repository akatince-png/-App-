import React, { useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextArea, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { SimpleLineChart } from "../ui/charts";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { SCHLAFQUALITAET_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";
import TimeWheelField from "../ui/TimeWheelField";
import ZeitErinnerungenCard from "../ui/ZeitErinnerungenCard";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import { KATEGORIE_META } from "../utils/dayItems";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe — Schlaf
// ist Indigo, passend zu den bunten Home-Mini-Widgets.
const { text: accentDark, dot: blue } = KATEGORIE_META.schlaf;

const LEERER_EINTRAG = {
  datum: new Date().toISOString().slice(0, 10),
  stunden: "",
  schlafqualitaet: "",
  einschlafzeit: "",
  durchgeschlafen: null,
  erholt: null,
  traeume: "",
  bemerkungen: "",
};

export default function SchlafView({ onHome, embedded = false }) {
  const { schlafEintraege, schlafHinzufuegen, schlafDurchschnitt7Tage } = useAppData();
  const [neuerSchlafEintrag, setNeuerSchlafEintrag] = useState(LEERER_EINTRAG);
  const [detailsOffen, setDetailsOffen] = useState(false);
  const [schlafError, setSchlafError] = useState(null);

  const submit = async () => {
    setSchlafError(null);
    const result = await schlafHinzufuegen(neuerSchlafEintrag);
    if (!result?.ok) {
      setSchlafError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeuerSchlafEintrag(LEERER_EINTRAG);
    setDetailsOffen(false);
  };

  // Übergabe an <KiChat onUebernehmen>: legt den im Gespräch besprochenen
  // Schlaf-Eintrag über denselben Weg an wie das manuelle Formular oben.
  const handleSchlafUebernehmen = async (verlauf) => {
    const s = await AIService.schlafAusChat({ verlauf, coachName: getCoachName() });
    const eintrag = {
      ...LEERER_EINTRAG,
      stunden: String(s.stunden),
      schlafqualitaet: s.schlafqualitaet || "",
      einschlafzeit: s.einschlafzeit || "",
      durchgeschlafen: s.durchgeschlafen ?? null,
      erholt: s.erholt ?? null,
      traeume: s.traeume || "",
      bemerkungen: s.bemerkungen || "",
    };
    const result = await schlafHinzufuegen(eintrag);
    if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    return eintrag;
  };

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="😴 Schlaf" onHome={onHome} />
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🌙 Und, wie hast du geschlafen?</div>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Trag's ein, bevor der Tag dich einholt — dauert 10 Sekunden.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Datum</Label>
            <TextInput type="date" value={neuerSchlafEintrag.datum} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, datum: v }))} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Stunden</Label>
            <TextInput type="number" value={neuerSchlafEintrag.stunden} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, stunden: v }))} placeholder="7,2" />
          </div>
        </div>

        {!detailsOffen ? (
          <button
            onClick={() => setDetailsOffen(true)}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px",
              borderRadius: 10,
              border: `1px dashed ${cardBorder}`,
              background: "transparent",
              color: textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Mehr Details (optional)
          </button>
        ) : (
          <>
            <Label>Schlafqualität</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {SCHLAFQUALITAET_OPTIONEN.map((q) => (
                <Pill
                  key={q}
                  label={q}
                  selected={neuerSchlafEintrag.schlafqualitaet === q}
                  onClick={() => setNeuerSchlafEintrag((p) => ({ ...p, schlafqualitaet: q }))}
                />
              ))}
            </div>
            <Label>Einschlafzeit</Label>
            <TimeWheelField
              value={neuerSchlafEintrag.einschlafzeit}
              onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, einschlafzeit: v }))}
            />
            <div style={{ marginTop: 10 }}>
              <CheckRow
                label="Durchgeschlafen"
                checked={!!neuerSchlafEintrag.durchgeschlafen}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, durchgeschlafen: !p.durchgeschlafen }))}
              />
              <CheckRow
                label="Erholt aufgewacht"
                checked={!!neuerSchlafEintrag.erholt}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, erholt: !p.erholt }))}
              />
            </div>
            <Label>Träume (optional)</Label>
            <TextArea value={neuerSchlafEintrag.traeume} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, traeume: v }))} placeholder="Woran erinnerst du dich?" />
            <Label>Bemerkungen (optional)</Label>
            <TextArea value={neuerSchlafEintrag.bemerkungen} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, bemerkungen: v }))} placeholder="Sonst noch was?" />
          </>
        )}

        {schlafError && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{schlafError}</div>}
        <div style={{ marginTop: 12 }}>
          <PrimaryButton onClick={submit}>Eintrag hinzufügen</PrimaryButton>
        </div>
      </Card>

      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Sag z. B. "ich hab 7 Stunden geschlafen, gut geschlafen, aber schlecht erholt aufgewacht" — der Assistent trägt den Eintrag für dich ein.
      </div>
      <KiChat
        bereich="schlaf"
        systemPrompt="Du hilfst dabei, einen Schlaf-Eintrag für die letzte Nacht zu erfassen. Frag nach Schlafdauer, Schlafqualität, ob durchgeschlafen und erholt aufgewacht wurde, bevor ihr fertig seid — Träume und Bemerkungen sind optional. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Wie hast du geschlafen?`}
        onUebernehmen={handleSchlafUebernehmen}
        uebernehmenLabel="Eintragen"
        renderErgebnis={(r) => (
          <div style={{ padding: 12, borderRadius: 12, background: "#EAF3F8", fontSize: 12.5, lineHeight: 1.6 }}>
            Schlaf-Eintrag mit {r.stunden} h gespeichert{r.schlafqualitaet ? ` (${r.schlafqualitaet})` : ""}.
          </div>
        )}
      />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerung</div>
      <Card style={{ marginBottom: 14 }}>
        <ZeitErinnerungenCard kategorie="schlaf" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="22:00" />
      </Card>

      {schlafEintraege.length > 0 && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{schlafDurchschnitt7Tage ?? "—"} h</div>
                <div style={{ fontSize: 11, color: textMuted }}>Ø letzte 7 Tage</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{schlafEintraege.length}</div>
                <div style={{ fontSize: 11, color: textMuted }}>Einträge gesamt</div>
              </div>
            </div>
            {schlafEintraege.length >= 2 && <SimpleLineChart data={schlafEintraege.slice(-14)} dataKey="stunden" stroke={blue} />}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Letzte Einträge</div>
          <Card style={{ marginBottom: 14 }}>
            {schlafEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}>
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <span style={{ fontWeight: 700 }}>{e.stunden} h</span>
                </div>
              ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell bereich="schlaf">{content}</Shell>;
}
