import React, { useState } from "react";
import { Card } from "./primitives";
import { abendDunkelErlaubt, accent, setzeAbendDunkelErlaubt, textMuted } from "./theme";

// Mehr → Aussehen (Design 2.0, 29.09.): Ab der Abendroutine wird die App
// dunkel – schont die Augen und passt zum Runterfahren. Wer das nicht mag,
// schaltet es hier ab (gilt für dieses Gerät).
export default function AussehenKarte() {
  const [an, setAn] = useState(abendDunkelErlaubt);
  const umschalten = () => {
    setzeAbendDunkelErlaubt(!an);
    setAn(!an);
  };
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>🌙 Aussehen</div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Abends dunkel</div>
            <div style={{ fontSize: 12.5, color: textMuted, marginTop: 2, lineHeight: 1.45 }}>Ab deiner Abendroutine wird die App dunkel. Gilt für dieses Gerät.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={an}
            aria-label="Abends dunkel"
            data-abend-dunkel
            onClick={umschalten}
            style={{ width: 52, height: 30, borderRadius: 99, border: "none", padding: 3, cursor: "pointer", background: an ? accent : "#C9CED9", flexShrink: 0, display: "flex", justifyContent: an ? "flex-end" : "flex-start", transition: "background 0.2s" }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
          </button>
        </div>
      </Card>
    </>
  );
}
