import React from "react";
import { textMuted } from "./theme";
import { useBereichColor } from "./BereichColorContext";

// Einheitliche Vor-/Zurück-Navigation für den GESAMTEN Onboarding-Bereich
// (Nutzerinnen-Vorgabe: beim Durchgucken/Bearbeiten der Onboarding-Seiten
// nicht mehr ganz raus müssen, sondern Seite für Seite vor und zurück
// blättern können — auch auf Screens, die bisher gar keine Zurück-Option
// hatten, z. B. WelcomeView/Hauptprotokoll/Intro). `onBack`/`onForward`
// weglassen (undefined), wenn es auf diesem Screen keine sinnvolle
// Richtung gibt (z. B. Intro-Screen mit einer echten 3-Wege-Auswahl statt
// eines einzelnen "weiter") — dann bleibt die jeweilige Seite leer statt
// einen funktionslosen Pfeil zu zeigen.
export default function OnboardingNavArrows({ onBack, backLabel = "Zurück", onForward, forwardLabel = "Weiter", forwardDisabled }) {
  const { accent } = useBereichColor();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 4, paddingBottom: 4 }}>
      {onBack ? (
        <button
          type="button"
          className="mp-tap"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            background: "transparent",
            color: textMuted,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            padding: "8px 10px 8px 4px",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> {backLabel}
        </button>
      ) : (
        <div />
      )}
      {onForward ? (
        <button
          type="button"
          className="mp-tap"
          onClick={onForward}
          disabled={forwardDisabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            background: "transparent",
            color: forwardDisabled ? textMuted : accent,
            opacity: forwardDisabled ? 0.5 : 1,
            fontSize: 14,
            fontWeight: 700,
            cursor: forwardDisabled ? "not-allowed" : "pointer",
            padding: "8px 4px 8px 10px",
          }}
        >
          {forwardLabel} <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
