import React from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import LaborwerteCard from "../../ui/LaborwerteCard";
import KiChat from "../../ui/KiChat";
import { AIService } from "../../services/aiService";
import { getCoachName } from "../../utils/coachStorage";
import { useAppData } from "../../context/AppDataContext";
import { useT } from "../../i18n/translate";

// "Laborwerte" — eigener Onboarding-Schritt direkt nach dem Profil und vor
// den Plänen: falls schon ein Laborbericht vorliegt, kann er hier gleich
// eingearbeitet werden (manuell, per Kamera, oder per Coach-Chat). Ersetzt
// den früheren "Biomarker-Plan"-Gate-Schritt ganz am Ende des
// Kategorien-Durchlaufs — Laborwerte sind Ausgangslage, kein Plan, den man
// "einrichtet".
export default function OnboardingLaborwerteView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();
  const { setBiomarkerWert } = useAppData();

  // Übergabe an <KiChat onUebernehmen>: trägt die im Gespräch genannten
  // Laborwerte über dieselbe Funktion ein wie die manuelle Eingabe/OCR
  // oben (LaborwerteCard → LaborwerteFelder → setBiomarkerWert).
  const handleLaborwerteUebernehmen = async (verlauf) => {
    const { werte } = await AIService.laborwerteAusChat({ verlauf, coachName: getCoachName() });
    Object.entries(werte).forEach(([name, wert]) => setBiomarkerWert(name, wert));
    return werte;
  };

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={t("onboarding.zurueck")} onForward={onDone} forwardLabel={tLabel("Überspringen")} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🩸</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.laborwerte.titel")}</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>{t("onboarding.biomarker.intro")}</div>

      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Sag {getCoachName()} einfach deine Werte, z. B. "Vitamin D war 32, Testosteron 450 ng/dl" — er trägt sie für dich ein.
      </div>
      <KiChat
        systemPrompt="Du hilfst dabei, Laborwerte aus einem Befund oder aus dem Gedächtnis zu erfassen. Frag nach, welche Werte die Person mitteilen möchte, und lass sie frei nennen, was sie hat — auch mehrere auf einmal. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Welche Laborwerte möchtest du eintragen?`}
        onUebernehmen={handleLaborwerteUebernehmen}
        uebernehmenLabel="Werte eintragen"
        renderErgebnis={(werte) => (
          <div style={{ padding: 12, borderRadius: 12, background: "#EAF3F8", fontSize: 12.5, lineHeight: 1.6 }}>
            {Object.keys(werte).length} Wert{Object.keys(werte).length === 1 ? "" : "e"} eingetragen.
          </div>
        )}
      />

      <LaborwerteCard titel={null} inputId="onboarding-blutwerte-foto" frisch />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
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
            {tLabel("Abbrechen")}
          </button>
        )}
      </div>
    </Shell>
  );
}
