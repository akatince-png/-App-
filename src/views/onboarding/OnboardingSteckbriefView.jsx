import React from "react";
import { Shell, Card, Label, Pill, TextInput, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useAppData } from "../../context/AppDataContext";
import { SPORT_ARTEN, SPORT_MENGE, SUPPLEMENTE, alsText, umschalten } from "../../utils/steckbrief";

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
        Nur antippen, was passt – ein paar Hintergrundfragen für dein Erstgespräch. Den Rest (Supplemente, Ernährung, Training, ...) richtet dein Coach danach gemeinsam mit dir ein.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Label>Nimmst du aktuell Supplemente?</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Pill label="Ja" selected={supplementeJa === true} onClick={() => setSteckbrief({ supplementeJa: true })} />
          <Pill label="Nein" selected={supplementeJa === false} onClick={() => setSteckbrief({ supplementeJa: false, supplementeListe: [], supplementeAnderes: "", supplementeWelche: "" })} />
        </div>
        {supplementeJa === true && (
          <>
            <Label>Welche? Einfach antippen</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }} data-steckbrief-supplemente>
              {SUPPLEMENTE.map((n) => (
                <Pill
                  key={n}
                  label={n}
                  selected={(steckbrief.supplementeListe || []).includes(n)}
                  onClick={() => {
                    const liste = umschalten(steckbrief.supplementeListe, n);
                    setSteckbrief({ supplementeListe: liste, supplementeWelche: alsText(liste, steckbrief.supplementeAnderes) });
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 6 }}>
              <TextInput
                value={steckbrief.supplementeAnderes || ""}
                onChange={(v) => setSteckbrief({ supplementeAnderes: v, supplementeWelche: alsText(steckbrief.supplementeListe, v) })}
                placeholder="Etwas anderes? (optional)"
              />
            </div>
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
        <Label>Wie oft bewegst du dich aktuell?</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {SPORT_MENGE.map((o) => (
            <Pill key={o} label={o} selected={steckbrief.sportMenge === o} onClick={() => setSteckbrief({ sportMenge: o })} />
          ))}
        </div>
        <Label>Was machst du gern? Antippen, gern mehrere</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {SPORT_ARTEN.map((o) => (
            <Pill
              key={o}
              label={o}
              selected={(steckbrief.sportArten || []).includes(o)}
              onClick={() => {
                const liste = umschalten(steckbrief.sportArten, o);
                setSteckbrief({ sportArten: liste, sportBeschreibung: alsText(liste, steckbrief.sportAnderes) });
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 6 }}>
          <TextInput
            value={steckbrief.sportAnderes || ""}
            onChange={(v) => setSteckbrief({ sportAnderes: v, sportBeschreibung: alsText(steckbrief.sportArten, v) })}
            placeholder="Etwas anderes? (optional)"
          />
        </div>
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
