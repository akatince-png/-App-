import React from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";

// Gate-Screen für "Neues Protokoll" bei bestehendem Konto (Nutzerinnen-
// Vorgabe, 15.09.): "wenn ich ein neues Protokoll aufnehme, möchte ich
// direkt in den Protokollbereich reingehen, weil ich doch schon als Person
// angemeldet bin" — dein Name und deine Profildaten (Geschlecht/
// Geburtsdatum/Größe/Gewicht) sind schon bekannt und werden beim
// "+"-Button NICHT mehr automatisch nochmal komplett neu abgefragt (das
// bisherige Verhalten: derselbe volle Fragebogen wie beim allerersten
// Onboarding, inkl. erneuter Namenseingabe).
//
// Bewusst NICHT für "Ziel & Grund" zuständig (Nachtrag, 15.09.,
// Nutzerinnen-Vorgabe): das bleibt ein Pflicht-Schritt auch bei "Neues
// Protokoll" (jedes Protokoll bekommt sein eigenes Ziel, oder ausdrücklich
// keins — "Alltagsprotokoll" ohne konkretes Ziel ist eine gültige Wahl,
// leer lassen reicht) und wird deshalb in OnboardingFlow.jsx VOR diesem
// Screen gezeigt, nicht hier mit abgefragt. Anders als die Profildaten
// (Person, ändert sich selten, sinnvoll vorausgefüllt) ist ein Ziel
// protokollspezifisch und startet deshalb pro Protokoll leer.
//
// Dieser Screen fragt nur noch: "Nein" (Standardfall, Haupt-Button)
// springt sofort zum nächsten inhaltlichen Schritt (Laborwerte/
// Steckbrief) weiter, "Ja" führt noch kurz durch Profil — vorausgefüllt
// mit den bestehenden gespeicherten Werten (dieselbe Datenquelle wie der
// ProfilTab unter "Mehr"), nichts geht dabei verloren.
export default function OnboardingWerteAktualisierenView({ onJa, onNein, onBack, onCancel }) {
  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel="Zurück" />
      <div style={{ marginBottom: 28, paddingTop: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Fast geschafft 🎉</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: textMuted, lineHeight: 1.5 }}>
          Dein Name und deine Profildaten sind schon gespeichert — die musst du nicht nochmal eingeben.
        </div>
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, marginBottom: 18 }}>
          <CoachOrb zustand="ruhe" size={64} />
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
            Möchtest du deine Profildaten (Geschlecht, Geburtsdatum, Größe, Gewicht) aktualisieren? Sonst geht's direkt weiter zu den Protokoll-Inhalten.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <PrimaryButton onClick={onNein}>Nein, weiter geht's</PrimaryButton>
          <button
            type="button"
            onClick={onJa}
            style={{
              padding: "13px 16px",
              borderRadius: 12,
              border: `1px solid ${cardBorder}`,
              background: "#fff",
              color: textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ja, kurz aktualisieren
          </button>
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
              }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </Card>
    </Shell>
  );
}
