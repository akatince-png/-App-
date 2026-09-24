import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton, TextInput } from "../../ui/primitives";
import { cardBorder, textMain, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useT } from "../../i18n/translate";
import { MAX_BEREICHE, START_BEREICHE, vorschlaegeAusZielen } from "./startBereiche";

// Kürzeres Onboarding (24.09., Nutzerinnen-Freigabe der Vorschau): statt
// alle Bereiche nacheinander mit je einer "Jetzt oder später?"-Seite
// abzufragen, wählt man hier 1–3 Bereiche zum Start. Nur diese werden
// danach eingerichtet (mit denselben Formularen wie bisher); alle anderen
// bleiben über "Weitere Pläne" auf der Startseite jederzeit erreichbar.
export default function OnboardingBereicheView({ ziele, onDone, onBack, onCancel, zeigeProtokollName = true }) {
  const { tLabel } = useT();
  const [vorschlaege] = useState(() => vorschlaegeAusZielen(ziele));
  const [gewaehlt, setGewaehlt] = useState(vorschlaege);
  const [protokollName, setProtokollName] = useState("Mein Start");
  const [nameOffen, setNameOffen] = useState(false);
  const [laedt, setLaedt] = useState(false);

  const umschalten = (key) =>
    setGewaehlt((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= MAX_BEREICHE ? prev : [...prev, key]));

  const weiter = async () => {
    setLaedt(true);
    try {
      // Reihenfolge wie in der Liste (Routinen zuerst), nicht Antipp-Reihenfolge.
      await onDone(
        START_BEREICHE.map((b) => b.key).filter((k) => gewaehlt.includes(k)),
        protokollName.trim() || "Mein Start"
      );
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={tLabel("Zurück")} />
      <div style={{ fontSize: 21, fontWeight: 900, marginTop: 6 }}>Womit willst du starten?</div>
      <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.5, margin: "6px 0 14px" }}>
        Wähle bis zu {MAX_BEREICHE}. Den Rest kannst du jederzeit später dazunehmen.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {START_BEREICHE.map((b) => {
          const an = gewaehlt.includes(b.key);
          const voll = !an && gewaehlt.length >= MAX_BEREICHE;
          return (
            <button
              key={b.key}
              type="button"
              className="mp-tap"
              aria-pressed={an}
              onClick={() => umschalten(b.key)}
              disabled={voll}
              style={{
                position: "relative",
                textAlign: "left",
                borderRadius: 18,
                padding: "12px 12px",
                minHeight: 84,
                border: `2px solid ${b.meta.dot}`,
                background: an ? b.meta.dot : b.meta.bg,
                color: an ? "#fff" : b.meta.text,
                opacity: voll ? 0.45 : 1,
                cursor: voll ? "default" : "pointer",
                fontFamily: "inherit",
                boxShadow: an ? "0 6px 14px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {an && (
                <span style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 99, background: "#fff", color: b.meta.dot, fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>
              )}
              <div style={{ fontSize: 20 }}>{b.icon}</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 4 }}>{b.label}</div>
              <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 1 }}>{vorschlaege.includes(b.key) ? "Vorschlag für dich" : b.text}</div>
            </button>
          );
        })}
      </div>

      {zeigeProtokollName && (
        <Card style={{ marginBottom: 14, background: "#F5F6FA", border: "none" }}>
          {!nameOffen ? (
            <div style={{ fontSize: 13, color: textMain, lineHeight: 1.5 }}>
              📋 Dein Protokoll heißt <b>„{protokollName.trim() || "Mein Start"}“</b> und beginnt <b>heute</b>.{" "}
              <button
                type="button"
                onClick={() => setNameOffen(true)}
                style={{ border: "none", background: "transparent", textDecoration: "underline", color: textMain, cursor: "pointer", padding: 0, fontSize: 13, fontFamily: "inherit" }}
              >
                Namen ändern
              </button>
            </div>
          ) : (
            <>
              <Label>Name deines Protokolls</Label>
              <TextInput value={protokollName} onChange={setProtokollName} placeholder="z. B. Mein Start" />
            </>
          )}
        </Card>
      )}

      <PrimaryButton onClick={weiter} disabled={laedt}>
        {laedt ? "Einen Moment…" : gewaehlt.length === 0 ? "Ohne Bereich weiter" : gewaehlt.length === 1 ? "1 Bereich einrichten" : `${gewaehlt.length} Bereiche einrichten`}
      </PrimaryButton>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{ width: "100%", marginTop: 10, padding: "12px 20px", borderRadius: 12, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          {tLabel("Abbrechen")}
        </button>
      )}
    </Shell>
  );
}
