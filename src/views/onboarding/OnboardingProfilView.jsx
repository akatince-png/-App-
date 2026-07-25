import React from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import PersoenlicheDatenCard from "../../ui/PersoenlicheDatenCard";
import WoechentlicheCheckinsCard from "../../ui/WoechentlicheCheckinsCard";
import { useT } from "../../i18n/translate";

// "Profil & Ausgangslage" — eigener Onboarding-Schritt vor den eigentlichen
// Plänen: wer bin ich (Geschlecht, Geburtsdatum, Größe, Startgewicht) und
// welche Messwerte will ich überhaupt verfolgen (inkl. optionaler
// Erstmessung). Nutzt exakt dieselben Karten wie der ProfilTab unter
// "Mehr" — keine getrennte Logik, nur ein anderer Rahmen drumherum.
export default function OnboardingProfilView({ onDone, onBack, onCancel }) {
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
        <div style={{ fontSize: 28 }}>👤</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.profil.titel")}</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>{t("onboarding.profil.intro")}</div>

      <PersoenlicheDatenCard />
      <WoechentlicheCheckinsCard />

      <div style={{ marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
      </div>
    </Shell>
  );
}
