import React from "react";
import { Label, Pill } from "./primitives";
import { textMuted } from "./theme";
import { useT } from "../i18n/translate";

// Wiederverwendbares Ja/Nein-Feld für "Möchtest du hieran erinnert werden?" —
// identisch in jedem Onboarding-Kategorie-Screen (neben ZieldauerField) und
// im Erinnerungen-Abschnitt unter Mehr, damit dieselbe Frage überall gleich
// aussieht (analoges Muster zu ZieldauerField).
export default function ErinnerungField({ value, onChange }) {
  const { t } = useT();
  const aktiv = !!value;

  return (
    <div>
      <Label>{t("common.erinnerung.label")}</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Pill label={t("common.erinnerung.ja")} selected={aktiv} onClick={() => onChange(true)} />
        <Pill label={t("common.erinnerung.nein")} selected={!aktiv} onClick={() => onChange(false)} />
      </div>
      <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{t("common.erinnerung.hinweis")}</div>
    </div>
  );
}
