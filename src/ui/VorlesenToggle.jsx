import React from "react";
import { accentDark, accentSoft, cardBorder, textMuted } from "./theme";
import { sprachausgabeVerfuegbar, sprachausgabeStoppen } from "../utils/speech";
import { saveVorlesenAktiv } from "../utils/coachStorage";

// Kleiner Umschalter für "Antworten vorlesen" — an mehreren Stellen genutzt
// (KiChat, Onboarding-Begleitung), damit die Person das automatische
// Vorlesen jederzeit selbst an-/ausschalten kann, statt es nur global über
// den Standardwert zu bestimmen (Leitprinzip: manuell UND per KI nutzbar).
export default function VorlesenToggle({ aktiv, onChange }) {
  if (!sprachausgabeVerfuegbar()) return null;
  const umschalten = () => {
    const next = !aktiv;
    saveVorlesenAktiv(next);
    if (!next) sprachausgabeStoppen();
    onChange(next);
  };
  return (
    <button
      type="button"
      onClick={umschalten}
      title={aktiv ? "Antworten vorlesen: an" : "Antworten vorlesen: aus"}
      style={{
        border: `1px solid ${aktiv ? accentDark : cardBorder}`,
        background: aktiv ? accentSoft : "#fff",
        color: aktiv ? accentDark : textMuted,
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {aktiv ? "🔊" : "🔈"}
    </button>
  );
}
