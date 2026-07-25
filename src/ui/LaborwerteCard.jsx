import React from "react";
import { Card } from "./primitives";
import { accentDark, accentSoft, danger, success, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import LaborwerteFelder from "./LaborwerteFelder";

// Vollständige "Laborwerte (optional)"-Karte inkl. Kamera-Erfassung (OCR),
// geteilt zwischen ProfilTab (laufende Pflege) und dem Laborwerte-Schritt im
// Onboarding (Ersteingabe) — LaborwerteFelder allein deckt nur die reine
// Werteingabe ab, ohne den Foto-/OCR-Teil.
export default function LaborwerteCard({ titel = "Laborwerte (optional)", inputId = "blutwerte-foto" }) {
  const { biomarker, setBiomarkerWert, handleBlutwertFoto, ocrLoading, ocrError, ocrSuccessCount } = useAppData();

  const handleBlutwertInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleBlutwertFoto(file);
    e.target.value = "";
  };

  return (
    <>
      {titel && <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{titel}</div>}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>
          Werte manuell eingeben oder per Kamera aus deinem Laborbericht erfassen — von Blutbild bis Hormone, alles was dein Arzt oder Labor
          dir mitgibt.
        </div>

        <input type="file" accept="image/*" capture="environment" id={inputId} style={{ display: "none" }} onChange={handleBlutwertInput} />
        <label
          htmlFor={inputId}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px",
            borderRadius: 10,
            border: `1.5px dashed #0FB8A3`,
            background: accentSoft,
            color: accentDark,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            marginTop: 6,
          }}
        >
          {ocrLoading ? "🔎 Werte werden erkannt..." : "📷 Laborbericht per Kamera erfassen"}
        </label>
        {ocrError && <div style={{ fontSize: 12, color: danger, marginBottom: 10 }}>{ocrError}</div>}
        {ocrSuccessCount !== null && !ocrError && (
          <div style={{ fontSize: 12, color: success, marginBottom: 10 }}>{ocrSuccessCount} Werte automatisch übernommen ✓</div>
        )}

        <LaborwerteFelder biomarker={biomarker} setBiomarkerWert={setBiomarkerWert} />
      </Card>
    </>
  );
}
