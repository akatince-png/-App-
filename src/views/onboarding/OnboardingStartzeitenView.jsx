import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton } from "../../ui/primitives";
import { cardBorder, danger, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import TimeWheelField from "../../ui/TimeWheelField";
import { useAppData } from "../../context/AppDataContext";

// Startzeiten statt Routinen-Baukasten (27.09., Nutzerinnen-Vorgabe nach
// ihrem eigenen Onboarding-Durchlauf): Im Onboarding wird nur festgelegt,
// WANN Abend- und Morgenroutine beginnen – immer Abend zuerst ("Ein guter
// Morgen beginnt am Abend davor"). Welche Schritte dazugehören, bringt das
// Programm Woche für Woche; in der Einstellungsphase wird erst beobachtet
// und getrackt, dann gemeinsam festgelegt. Die volle Routinen-Seite bleibt
// jederzeit erreichbar (Pläne → Abend/Morgen).
const ABEND_STANDARD = "21:30";
const MORGEN_STANDARD = "06:30";
const plusStunde = (t) => {
  const [h, m] = String(t || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export default function OnboardingStartzeitenView({ onDone, onBack, onCancel }) {
  const { routineEinstellungen, routineEinstellungenStandard, routineZeitrahmenSetzen } = useAppData();
  const vorhanden = routineEinstellungenStandard || routineEinstellungen || {};
  const [abend, setAbend] = useState(() => String(vorhanden.abend?.startZeit || ABEND_STANDARD).slice(0, 5));
  const [morgen, setMorgen] = useState(() => String(vorhanden.morgen?.startZeit || MORGEN_STANDARD).slice(0, 5));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const weiter = async () => {
    setFehler(null);
    setLaeuft(true);
    for (const [routine, start, alt] of [
      ["abend", abend, vorhanden.abend],
      ["morgen", morgen, vorhanden.morgen],
    ]) {
      if (!start) continue;
      const r = await routineZeitrahmenSetzen?.(routine, start, alt?.endZeit || plusStunde(start));
      if (r && r.ok === false) {
        setLaeuft(false);
        return setFehler(r.error || "Speichern fehlgeschlagen.");
      }
    }
    setLaeuft(false);
    onDone?.();
  };

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel="Zurück" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingTop: 8 }}>
        <div style={{ fontSize: 28 }}>🌙</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Wann startest du?</div>
      </div>
      <div style={{ fontSize: 13.5, color: textMuted, marginBottom: 18, lineHeight: 1.55 }}>
        Ein guter Morgen beginnt am Abend davor. Leg nur fest, wann deine Routinen beginnen. Was dazugehört, bauen wir in den ersten Wochen Schritt für Schritt auf: erst beobachten, dann festlegen.
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Label>🌙 Abendroutine beginnt um</Label>
        <TimeWheelField value={abend} onChange={setAbend} />
        <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>Etwa 1 bis 1,5 Stunden bevor du ins Bett willst.</div>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <Label>🌅 Morgenroutine beginnt um</Label>
        <TimeWheelField value={morgen} onChange={setMorgen} />
        <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>Am besten deine feste Aufstehzeit, jeden Tag gleich.</div>
      </Card>

      {fehler && <div style={{ color: danger, fontSize: 13, marginBottom: 10 }}>{fehler}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={weiter} disabled={laeuft}>
          {laeuft ? "Speichere …" : "Weiter"}
        </PrimaryButton>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 12, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Abbrechen
          </button>
        )}
      </div>
    </Shell>
  );
}
