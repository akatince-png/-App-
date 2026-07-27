import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import ProgressRing from "../ui/ProgressRing";
import GrundEingabe from "../ui/GrundEingabe";
import ErinnerungField from "../ui/ErinnerungField";
import NumberWheelField from "../ui/NumberWheelField";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";

const SCHNELLAUSWAHL = [
  { label: "Kurzer Spaziergang", minuten: 15 },
  { label: "Pause draußen", minuten: 30 },
  { label: "Längerer Aufenthalt", minuten: 60 },
  { label: "Halber Tag draußen", minuten: 180 },
];

function motivationsText(heuteMinuten, zielMinuten) {
  if (zielMinuten === 0) return "Trag dein Tagesziel ein, um loszulegen.";
  if (heuteMinuten === 0) return "Heute noch kein Tageslicht erfasst.";
  if (heuteMinuten >= zielMinuten) return "Tagesziel erreicht. Stark! 🎉";
  const rest = zielMinuten - heuteMinuten;
  if (heuteMinuten / zielMinuten >= 0.66) return `Fast geschafft, noch ${rest} Min.`;
  return `Noch ${rest} Min. bis zum Ziel.`;
}

// Neuer Lebensbereich neben Hydration: wie viel Zeit am Tag im Freien/
// Tageslicht verbracht wird — bewusst mit demselben Aufbau wie
// HydrationView (Ring, Schnellauswahl, Korrektur, Tagesziel), aber ohne
// die dortigen zusätzlichen Check-in-Felder (Elektrolyte/Durstgefühl), die
// hier keine Entsprechung haben. Erinnerung läuft über das generische
// Ja/Nein-Feld (ErinnerungField) wie bei den meisten anderen Kategorien,
// statt über eine eigene Uhrzeiten-Liste wie bei Hydration.
export default function TageslichtView({ onHome, embedded = false }) {
  const {
    tageslichtEintraege,
    tageslichtHeuteMinuten,
    tageslichtZielMinuten,
    tageslichtHinzufuegen,
    tageslichtZielSetzen,
    aenderungVermerken,
    erinnerungen,
    setErinnerung,
  } = useAppData();
  const [zielEntwurf, setZielEntwurf] = useState(String(tageslichtZielMinuten));
  const [korrekturEntwurf, setKorrekturEntwurf] = useState("");
  const [zielGrund, setZielGrund] = useState("");
  const [fehler, setFehler] = useState(null);

  const schnellHinzufuegen = async (minuten) => {
    setFehler(null);
    const result = await tageslichtHinzufuegen(minuten);
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  const zielSpeichern = async () => {
    setFehler(null);
    if (Number(zielEntwurf) !== tageslichtZielMinuten) {
      aenderungVermerken({
        kategorie: "tageslicht",
        itemName: "Tageslichtziel",
        aktion: "geändert",
        detail: `Ziel: ${tageslichtZielMinuten} Min. → ${zielEntwurf} Min.`,
        grund: zielGrund,
      });
    }
    const result = await tageslichtZielSetzen(zielEntwurf);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setZielGrund("");
  };

  // Übergabe an <KiChat onUebernehmen>: setzt das im Gespräch besprochene
  // neue Tagesziel über denselben Weg wie das manuelle Formular unten.
  const handleTageslichtUebernehmen = async (verlauf) => {
    const { zielMinuten } = await AIService.tageslichtAusChat({ verlauf, coachName: getCoachName() });
    const result = await tageslichtZielSetzen(zielMinuten);
    if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    return { zielMinuten };
  };

  const korrekturSetzen = async () => {
    if (korrekturEntwurf === "") return;
    setFehler(null);
    const result = await tageslichtHinzufuegen(Number(korrekturEntwurf) - tageslichtHeuteMinuten);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setKorrekturEntwurf("");
  };

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="☀️ Tageslicht" onHome={onHome} />
      )}

      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ProgressRing done={tageslichtHeuteMinuten} total={tageslichtZielMinuten} size={92} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accentDark }}>
          {tageslichtHeuteMinuten} <span style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>/ {tageslichtZielMinuten} Min.</span>
        </div>
        <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>{motivationsText(tageslichtHeuteMinuten, tageslichtZielMinuten)}</div>
      </Card>

      {fehler && <div style={{ fontSize: 12.5, color: danger, marginBottom: 14, textAlign: "center" }}>{fehler}</div>}

      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Erzähl, wie viel Zeit du aktuell draußen verbringst und was realistisch wäre — der Coach schlägt ein Tagesziel vor.
      </div>
      <KiChat
        systemPrompt="Du hilfst dabei, ein tägliches Tageslicht-/Freiluft-Ziel (in Minuten) für eine bestehende App einzurichten. Frag nach, wie viel Zeit die Person aktuell draußen verbringt (z. B. Bürojob vs. viel unterwegs) und was realistisch machbar wäre, bevor ihr fertig seid. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Wie viel Zeit verbringst du aktuell so am Tag draußen im Tageslicht?`}
        onUebernehmen={handleTageslichtUebernehmen}
        uebernehmenLabel="Ziel übernehmen"
        renderErgebnis={(r) => (
          <div style={{ padding: 12, borderRadius: 12, background: "#FDF3E3", fontSize: 12.5, lineHeight: 1.6 }}>
            Tagesziel auf {r.zielMinuten} Minuten gesetzt.
          </div>
        )}
      />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Schnell hinzufügen</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCHNELLAUSWAHL.map((opt) => (
            <button
              key={opt.label}
              className="mp-btn"
              onClick={() => schnellHinzufuegen(opt.minuten)}
              style={{
                minHeight: 64,
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
                background: "#FAFBFA",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: textMain }}>+{opt.minuten} Min.</span>
              <span style={{ fontSize: 11.5, color: textMuted }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verschätzt?</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Trag die tatsächliche Gesamtzeit für heute ein, um einen falschen Tipp zu korrigieren.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <NumberWheelField value={korrekturEntwurf} onChange={setKorrekturEntwurf} min={0} max={720} step={5} placeholder={`z. B. ${tageslichtHeuteMinuten}`} />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={korrekturSetzen}>
              Setzen
            </PrimaryButton>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Tagesziel</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Ziel in Minuten</Label>
            <NumberWheelField value={zielEntwurf} onChange={setZielEntwurf} min={0} max={720} step={5} placeholder="30" />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={zielSpeichern}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
        <GrundEingabe grund={zielGrund} onChange={setZielGrund} />
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerung</div>
      <Card style={{ marginBottom: 14 }}>
        <ErinnerungField value={erinnerungen.tageslicht} onChange={(v) => setErinnerung("tageslicht", v)} />
      </Card>

      {tageslichtEintraege.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
          <Card>
            {tageslichtEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.datum}
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}
                >
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <span style={{ fontWeight: 700 }}>{e.minuten} Min.</span>
                </div>
              ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
