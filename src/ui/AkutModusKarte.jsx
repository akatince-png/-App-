import React, { useState } from "react";
import { Card, Pill, PrimaryButton, TextArea } from "./primitives";
import { accentDark, accentSoft, textMuted } from "./theme";
import { useAkutModus, AKUT_SYMPTOME } from "../data/useAkutModus";

// Akutmodus (16.08., Nutzerinnen-Vorgabe): ein Knopf für Momente akuter
// ADHS-Symptomatik ("innere Unruhe", "kirre werden") — Symptom auswählen
// oder frei beschreiben, sofort eine konkrete, kurze Lösung bekommen.
//
// Bewusst KEIN offener KI-Chat (siehe KiChat.jsx-Kommentar "der
// KI-Assistent ist für Coachees nicht mehr Teil der App") — stattdessen
// derselbe leichtgewichtige Einzelanfrage-Mechanismus wie das Lexikon
// (useLexikon.js), nur mit wärmerer, direktiver Antwort-Rolle ("Akutmodus"
// in der lexikon-Edge-Function) statt Glossar-Ton, und mit kuratiertem
// Kontext passend zum gewählten Symptom statt einer Themenkategorie.
//
// zeigeCoachOption steuert den zusätzlichen "An {coachName} schicken"-
// Knopf — nur sinnvoll für echte Coachees (nicht im Admin-/"Verwalten
// als"-Modus, siehe NachrichtAnCoachCard in HomeView.jsx, dieselbe Logik).
export default function AkutModusKarte({ onSendenAnCoach, coachName, zeigeCoachOption }) {
  const [offen, setOffen] = useState(false);
  const [freitext, setFreitext] = useState("");
  const [anCoachGesendet, setAnCoachGesendet] = useState(false);
  const { antwort, laden, fehler, hilfeAnfordern, zuruecksetzen } = useAkutModus();

  const schliessen = () => {
    setOffen(false);
    setFreitext("");
    setAnCoachGesendet(false);
    zuruecksetzen();
  };

  const symptomWaehlen = (symptom) => {
    setAnCoachGesendet(false);
    hilfeAnfordern(symptom.label.replace(/^\S+\s/, ""), symptom.pfade);
  };

  const freitextSenden = () => {
    if (!freitext.trim()) return;
    setAnCoachGesendet(false);
    hilfeAnfordern(freitext, null);
  };

  const anCoachSenden = async () => {
    if (!onSendenAnCoach) return;
    const nachricht = freitext.trim()
      ? `Akutmodus: ${freitext.trim()}`
      : `Akutmodus — hat sich gerade nicht gut gefühlt.${antwort ? ` (Vorschlag der App: ${antwort})` : ""}`;
    const result = await onSendenAnCoach(nachricht);
    if (result?.ok) setAnCoachGesendet(true);
  };

  if (!offen) {
    return (
      <div
        className="mp-tap"
        onClick={() => setOffen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          marginBottom: 18,
          borderRadius: 16,
          background: "#FFF7ED",
          border: "1px solid rgba(217, 119, 6, 0.25)",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 22 }}>💡</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>Geht's dir gerade nicht gut?</div>
          <div style={{ fontSize: 11.5, color: textMuted }}>Symptom antippen — sofort eine konkrete Idee bekommen</div>
        </div>
      </div>
    );
  }

  return (
    <Card style={{ marginBottom: 18, background: "#FFF7ED", border: "1px solid rgba(217, 119, 6, 0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>💡 Was hilft mir jetzt?</div>
        <button
          type="button"
          onClick={schliessen}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer" }}
        >
          ✕ Schließen
        </button>
      </div>

      {!antwort && !laden && (
        <>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
            Was passt gerade am besten — oder beschreib's mit eigenen Worten.
          </div>
          <div style={{ marginBottom: 12 }}>
            {AKUT_SYMPTOME.map((s) => (
              <Pill key={s.label} label={s.label} selected={false} onClick={() => symptomWaehlen(s)} />
            ))}
          </div>
          <TextArea value={freitext} onChange={setFreitext} placeholder="Oder hier frei beschreiben ..." />
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={freitextSenden} disabled={!freitext.trim()}>
              Idee holen
            </PrimaryButton>
          </div>
        </>
      )}

      {laden && <div style={{ fontSize: 13, color: textMuted, padding: "10px 0" }}>🔎 Denkt kurz nach ...</div>}

      {fehler && <div style={{ fontSize: 12.5, color: "#C24545", marginTop: 8 }}>{fehler}</div>}

      {antwort && (
        <div style={{ marginTop: 4 }}>
          <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 13.5, lineHeight: 1.6, color: accentDark }}>
            {antwort}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={zuruecksetzen}
              className="mp-tap"
              style={{
                border: "none",
                background: "transparent",
                color: "#B45309",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 4px",
              }}
            >
              🔁 Anderes Symptom
            </button>
            {zeigeCoachOption && onSendenAnCoach && !anCoachGesendet && (
              <button
                type="button"
                onClick={anCoachSenden}
                className="mp-tap"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#B45309",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "6px 4px",
                }}
              >
                ✉️ An {coachName} schicken
              </button>
            )}
            {anCoachGesendet && <div style={{ fontSize: 12, color: "#B45309", padding: "6px 4px" }}>Gesendet ✓</div>}
          </div>
        </div>
      )}
    </Card>
  );
}
