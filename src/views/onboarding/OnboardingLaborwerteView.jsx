import React from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import LaborwerteCard from "../../ui/LaborwerteCard";
import { useT } from "../../i18n/translate";

// "Laborwerte" — eigener Onboarding-Schritt direkt nach dem Profil und vor
// den Plänen: falls schon ein Laborbericht vorliegt, kann er hier gleich
// eingearbeitet werden (manuell oder per Kamera). Ersetzt den früheren
// "Biomarker-Plan"-Gate-Schritt ganz am Ende des Kategorien-Durchlaufs —
// Laborwerte sind Ausgangslage, kein Plan, den man "einrichtet".
export default function OnboardingLaborwerteView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        {onBack ? (
          <div className="mp-tap" onClick={onBack} style={{ fontSize: 12, fontWeight: 700, color: textMuted, cursor: "pointer" }}>
            {t("onboarding.zurueck")}
          </div>
        ) : (
          <div />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="mp-tap" onClick={onDone} style={{ fontSize: 12, fontWeight: 700, color: accentDark, cursor: "pointer" }}>
            {tLabel("Überspringen")}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 14, cursor: "pointer", flexShrink: 0 }}
              title={tLabel("Abbrechen")}
            >
              ⌂
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🩸</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.laborwerte.titel")}</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>{t("onboarding.biomarker.intro")}</div>

      <LaborwerteCard titel={null} inputId="onboarding-blutwerte-foto" />

      <div style={{ marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
      </div>
    </Shell>
  );
}
