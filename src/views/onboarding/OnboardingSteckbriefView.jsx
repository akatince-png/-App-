import React from "react";
import { Shell, Card, Label, Pill, TextInput, TextArea, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useAppData } from "../../context/AppDataContext";

const SPORT_ERFAHRUNG_OPTIONEN = ["Kein Training", "Anfänger", "Fortgeschritten", "Erfahren"];

// Kurzer "Steckbrief" statt der vollen Kategorie-Einrichtung (13.08.,
// Coach-verwaltetes Modell): die Admin richtet Supplemente/Medikamente/
// Ernährung/Training & Co. stellvertretend ein, nachdem sie das mit der
// Person im Erstgespräch besprochen hat. Hier werden nur ein paar
// Hintergrundfragen erfasst, die die Admin dafür schon vorab kennen sollte
// — bewusst NICHT dieselbe Detailtiefe wie die eigentlichen Pläne.
export default function OnboardingSteckbriefView({ onDone, onBack, onCancel }) {
  const { steckbrief, setSteckbrief } = useAppData();

  const supplementeJa = steckbrief.supplementeJa ?? null;

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel="Zurück" onForward={onDone} forwardLabel="Überspringen" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>📝</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>Kurzer Steckbrief</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>
        Nur ein paar Hintergrundfragen für dein Erstgespräch — den Rest (Supplemente, Ernährung, Training, ...) richtet dein Coach danach gemeinsam mit dir ein.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Label>Nimmst du aktuell Supplemente?</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Pill label="Ja" selected={supplementeJa === true} onClick={() => setSteckbrief({ supplementeJa: true })} />
          <Pill label="Nein" selected={supplementeJa === false} onClick={() => setSteckbrief({ supplementeJa: false, supplementeWelche: "" })} />
        </div>
        {supplementeJa === true && (
          <>
            <Label>Welche?</Label>
            <TextArea
              value={steckbrief.supplementeWelche || ""}
              onChange={(v) => setSteckbrief({ supplementeWelche: v })}
              placeholder="z. B. Magnesium, Vitamin D, Omega-3 ..."
            />
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Label>Wie erfahren bist du mit Sport/Training?</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {SPORT_ERFAHRUNG_OPTIONEN.map((o) => (
            <Pill key={o} label={o} selected={steckbrief.sportErfahrung === o} onClick={() => setSteckbrief({ sportErfahrung: o })} />
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Label>Wie viel Sport machst du aktuell?</Label>
        <TextInput
          value={steckbrief.sportMenge || ""}
          onChange={(v) => setSteckbrief({ sportMenge: v })}
          placeholder="z. B. 2x pro Woche"
        />
        <Label>Kurze Beschreibung (optional)</Label>
        <TextArea
          value={steckbrief.sportBeschreibung || ""}
          onChange={(v) => setSteckbrief({ sportBeschreibung: v })}
          placeholder="z. B. Krafttraining im Studio, oder Laufen im Park ..."
        />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>Weiter</PrimaryButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: `1px solid ${cardBorder}`,
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease-out",
            }}
          >
            Abbrechen
          </button>
        )}
      </div>
    </Shell>
  );
}
