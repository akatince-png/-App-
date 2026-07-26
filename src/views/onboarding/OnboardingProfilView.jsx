import React from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { accentDark, accentSoft, cardBorder, textMuted } from "../../ui/theme";
import PersoenlicheDatenCard from "../../ui/PersoenlicheDatenCard";
import WoechentlicheCheckinsCard from "../../ui/WoechentlicheCheckinsCard";
import { useT } from "../../i18n/translate";
import { useAppData } from "../../context/AppDataContext";
import { berechneGrundumsatz } from "../../utils/kalorien";

// "Profil & Ausgangslage" — eigener Onboarding-Schritt vor den eigentlichen
// Plänen: wer bin ich (Geschlecht, Geburtsdatum, Größe, Startgewicht) und
// welche Messwerte will ich überhaupt verfolgen (inkl. optionaler
// Erstmessung). Nutzt exakt dieselben Karten wie der ProfilTab unter
// "Mehr" — keine getrennte Logik, nur ein anderer Rahmen drumherum.
export default function OnboardingProfilView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();
  const { personalData, gewichtsEintraege } = useAppData();

  const aktuellesGewicht = gewichtsEintraege?.length ? gewichtsEintraege[gewichtsEintraege.length - 1].gewicht : personalData.gewichtStart;
  const grundumsatz = berechneGrundumsatz({
    geschlecht: personalData.geschlecht,
    geburtsdatum: personalData.geburtsdatum,
    groesse: personalData.groesse,
    gewicht: aktuellesGewicht,
  });

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
        <div style={{ fontSize: 28 }}>👤</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.profil.titel")}</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>{t("onboarding.profil.intro")}</div>

      <PersoenlicheDatenCard frisch />

      {grundumsatz && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: accentSoft,
            border: `1px solid ${cardBorder}`,
            fontSize: 12.5,
            color: textMuted,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 700, color: accentDark, marginBottom: 2 }}>
            {t("onboarding.profil.kalorien.ist", { kalorien: grundumsatz })}
          </div>
          <div>{t("onboarding.profil.kalorien.hinweis")}</div>
        </div>
      )}

      <WoechentlicheCheckinsCard />

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
