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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, paddingTop: 8, paddingBottom: 8 }}>
        {onBack ? (
          <div className="mp-tap" onClick={onBack} style={{ fontSize: 15, fontWeight: 700, color: textMuted, cursor: "pointer", padding: "8px 12px" }}>
            {t("onboarding.zurueck")}
          </div>
        ) : (
          <div />
        )}
        <div>
          <div className="mp-tap" onClick={onDone} style={{ fontSize: 15, fontWeight: 700, color: accentDark, cursor: "pointer", padding: "8px 12px" }}>
            {tLabel("Überspringen")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🩸</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.laborwerte.titel")}</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>{t("onboarding.biomarker.intro")}</div>

      <LaborwerteCard titel={null} inputId="onboarding-blutwerte-foto" />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease-out",
            }}
          >
            {tLabel("Abbrechen")}
          </button>
        )}
      </div>
    </Shell>
  );
}
