import React from "react";
import { Card } from "./primitives";
import { textMuted } from "./theme";
import { hexZuRgba } from "./theme";
import { weltPflanzen } from "../utils/welt";

// "Deine Welt" (Spiel-Ausbau 23.09., Entwurf aus dem UX-Review): jeder
// Bereich, in dem schon etwas erledigt wurde, ist eine Pflanze, die mit den
// erledigten Tagen wächst (Logik: utils/welt.js). Bewusst ohne Verlust-
// mechanik — eine Pflanze ohne aktuelle Serie schläft nur (💤) und behält
// ihre Größe, damit ein verpasster Tag nicht bestraft wird (ADHS).
const GRUEN = "#2F8F5B";

export default function WeltKarte({ kategorien, onOpenErfolge }) {
  const pflanzen = weltPflanzen(kategorien);
  const wachsend = pflanzen.filter((p) => !p.wartet).length;

  return (
    <Card style={{ marginBottom: 20, padding: 16, background: "linear-gradient(180deg, #F2FAF4, #FFFFFF)" }}>
      <button
        type="button"
        onClick={onOpenErfolge}
        className="mp-tap"
        style={{ all: "unset", display: "block", width: "100%", cursor: "pointer" }}
        aria-label="Deine Welt — zu den Erfolgen"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>🌍 Deine Welt</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: GRUEN }}>
            {pflanzen.length === 0 ? "wartet auf den ersten Haken" : `${wachsend} von ${pflanzen.length} wachsen gerade`}
          </div>
        </div>

        {pflanzen.length === 0 ? (
          <div style={{ fontSize: 12.5, color: textMuted }}>🌰 Hake heute etwas ab — dann keimt hier deine erste Pflanze.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
            {pflanzen.map((p) => {
              const farbe = p.grad?.[0] || GRUEN;
              return (
                <div
                  key={p.key}
                  title={`${p.label}: ${p.stufe.name}, ${p.punkte} Tage${p.stufe.naechste ? ` · noch ${p.stufe.nochTage} bis ${p.stufe.naechste.name}` : ""}`}
                  style={{
                    flex: "0 0 auto",
                    width: 74,
                    padding: "8px 4px",
                    borderRadius: 14,
                    background: p.wartet ? "#F3F4F6" : hexZuRgba(farbe, 0.14),
                    textAlign: "center",
                    position: "relative",
                    opacity: p.wartet ? 0.75 : 1,
                  }}
                >
                  {p.wartet && <span style={{ position: "absolute", top: 3, right: 6, fontSize: 11 }}>💤</span>}
                  <div style={{ fontSize: 16 + p.stufe.index * 3, lineHeight: "36px", height: 36 }}>{p.stufe.symbol}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>{p.streak > 0 ? `🔥 ${p.streak}` : `${p.punkte} Tage`}</div>
                </div>
              );
            })}
          </div>
        )}
        {pflanzen.length > 0 && (
          <div style={{ fontSize: 11, color: textMuted, marginTop: 8 }}>Jeder erledigte Tag lässt eine Pflanze wachsen. Pause? Sie schläft nur — nichts geht verloren.</div>
        )}
      </button>
    </Card>
  );
}
