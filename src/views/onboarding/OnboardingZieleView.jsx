import React from "react";
import { Shell, Card, CheckRow, PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import { ZIELE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { useT } from "../../i18n/translate";

// "Ziel & Grund" — war früher Schritt 1/5 innerhalb des separaten
// Peptid-Assistenten (ProtocolFormView). Die Frage "warum machst du das?"
// gilt aber für das gesamte Hauptprotokoll und nicht nur für Peptide,
// deshalb steht sie jetzt als eigener Schritt direkt nach der
// Hauptprotokoll-Erstellung und vor allen Kategorien.
export default function OnboardingZieleView({ onDone, onBack, onCancel }) {
  const { ziele, toggleZiel } = useAppData();
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 28 }}>🎯</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.ziele.titel")}</div>
      </div>

      <Card>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("onboarding.ziele.frage")}</div>
        {ZIELE.map((z) => (
          <CheckRow key={z} label={tLabel(z)} checked={ziele.includes(z)} onToggle={() => toggleZiel(z)} />
        ))}

        <div style={{ marginTop: 18 }}>
          <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
        </div>
      </Card>
    </Shell>
  );
}
