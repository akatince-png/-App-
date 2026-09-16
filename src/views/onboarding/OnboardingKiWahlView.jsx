import React from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { getCoachName, saveKiAktiv } from "../../utils/coachStorage";

// Gate-Screen für "Neues Protokoll" bei bestehendem Konto (Nutzerinnen-
// Vorgabe, 16.09.): "ob ich es alleine oder mit der KI machen möchte, das
// mit der KI vielleicht viel früher von der Reihenfolge sinnvoller" — bisher
// wurde diese Frage bei "Neues Protokoll" (istDirekterNeuStart in
// OnboardingFlow.jsx) gar nicht gestellt, weil die Phasen "quickwin"/"intro"
// (wo diese Frage beim allerersten Onboarding steckt, siehe
// OnboardingIntroView.jsx) dort komplett übersprungen werden — dadurch
// poppte Aka trotzdem auf jeder folgenden Seite auf (Laborwerte,
// Kategorien-Schritte), obwohl nie gefragt wurde, ob das überhaupt gewünscht
// ist. Bewusst gleich nach dem Protokollnamen (früh in der Reihenfolge, wie
// gewünscht), vor "Ziel & Grund".
//
// Die Wahl wird über `saveKiAktiv()` (Mehr → "Assistent aktiv/ausgeschaltet",
// coachStorage.js) gespeichert — derselbe globale Schalter, den KiChat.jsx
// überall sonst prüft. "Allein" schaltet den Assistenten für die gesamte
// App aus (nicht nur für dieses Protokoll) — wie der Schalter unter "Mehr"
// das schon immer tut; wer ihn später wieder braucht, findet ihn dort
// unverändert wieder.
export default function OnboardingKiWahlView({ onDone, onBack, onCancel }) {
  const coachName = getCoachName();

  const waehlen = (mitKi) => {
    saveKiAktiv(mitKi);
    onDone();
  };

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel="Zurück" />
      <div style={{ marginBottom: 28, paddingTop: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Wie soll's laufen? 🚀</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: textMuted, lineHeight: 1.5 }}>
          Bevor's losgeht: Soll {coachName} dich durchs Einrichten begleiten, oder machst du das lieber ganz alleine?
        </div>
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, marginBottom: 18 }}>
          <CoachOrb zustand="ruhe" size={64} />
          <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.5 }}>
            Mit {coachName}: er poppt bei den einzelnen Schritten antippbar auf und hilft beim Ausfüllen. Alleine: {coachName} bleibt
            komplett aus, du füllst alles selbst über die Formulare aus — kannst du jederzeit unter Mehr wieder ändern.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <PrimaryButton onClick={() => waehlen(true)}>Mit {coachName}</PrimaryButton>
          <button
            type="button"
            onClick={() => waehlen(false)}
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
            Alleine, ohne {coachName}
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
