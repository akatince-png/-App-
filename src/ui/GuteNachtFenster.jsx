import React from "react";
import gehirn from "../assets/gehirn/abend.webp";
import { plastikFarbe } from "./plastik";
import { nachtVerlaufFest } from "./theme";

// Abschluss der Abendroutine (06.10., Nutzerin: „im Nachtbereich wäre die
// Abendroutine dann zu Ende – die Sterne wie auf dem Homebildschirm finde ich
// sehr schön“). Gegenstück zu AufgeladenFenster: Nachthimmel mit funkelnden
// Sternen und Mond, das AKA-Gehirn im Abendlicht.
const STERNE = [
  [8, 6, 2, 0], [22, 12, 1.5, 0.8], [38, 5, 2, 1.6], [55, 10, 1.5, 0.4], [70, 4, 2.5, 1.2], [84, 13, 1.5, 2],
  [93, 30, 2, 0.6], [5, 38, 1.5, 1.4], [90, 52, 1.5, 2.2], [12, 55, 2, 0.2], [48, 3, 1.5, 2.6], [76, 22, 1.5, 1.8],
  [30, 30, 1.5, 1], [64, 36, 2, 2.4], [18, 24, 1.5, 0.5],
];

export default function GuteNachtFenster({ gesamtZeit, feier = null, onWeiter }) {
  return (
    <div
      data-gute-nacht
      style={{ position: "relative", overflow: "hidden", borderRadius: 28, marginBottom: 14, minHeight: 520, background: nachtVerlaufFest, display: "flex", flexDirection: "column", justifyContent: "flex-end", boxShadow: "0 14px 30px rgba(16, 19, 43, 0.35)" }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {STERNE.map(([x, y, r, verz], i) => (
          <span key={i} className="mp-stern" style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, borderRadius: 99, background: "#fff", animationDelay: `${verz}s`, boxShadow: "0 0 6px rgba(255,255,255,.9)" }} />
        ))}
        <span style={{ position: "absolute", right: 26, top: 26, fontSize: 40, filter: "drop-shadow(0 0 14px rgba(255,236,170,0.85))" }}>🌙</span>
        <div style={{ position: "absolute", left: "50%", top: 70, width: 220, height: 220, marginLeft: -110, borderRadius: "50%", background: "radial-gradient(circle, rgba(140,120,255,.35) 0%, rgba(140,120,255,0) 70%)" }}>
          {/* Schwarzer Bildhintergrund wird durchsichtig (wie in GehirnKarte):
              je heller ein Bildpunkt leuchtet, desto deckender bleibt er. */}
          <svg viewBox="0 0 720 572" style={{ width: 180, position: "absolute", left: 20, top: 40, overflow: "visible", filter: "drop-shadow(0 0 18px rgba(170,150,255,.55))" }}>
            <defs>
              <filter id="gute-nacht-leuchten" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.4 1.4 1.4 0 -0.12" />
              </filter>
            </defs>
            <image href={gehirn} x="0" y="0" width="720" height="572" filter="url(#gute-nacht-leuchten)" />
          </svg>
        </div>
      </div>
      <div style={{ position: "relative", margin: 14, padding: "20px 18px 16px", borderRadius: 24, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 28, fontWeight: 900 }}>Gute Nacht 🌙</div>
        <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.9, margin: "6px 0 2px" }}>Abendroutine geschafft – dein Morgen ist vorbereitet.</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: feier?.hinweis ? 4 : 14 }}>
          {gesamtZeit ? `Gesamtzeit: ${gesamtZeit}` : ""}
          {feier?.punkte ? `${gesamtZeit ? " · " : ""}⚡ +${feier.punkte} Punkt${feier.punkte === 1 ? "" : "e"}` : ""}
        </div>
        {feier?.hinweis && <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 14 }}>{feier.hinweis}</div>}
        <button type="button" className="mp-tap" onClick={onWeiter} style={{ width: "100%", minHeight: 54, border: "none", borderRadius: 20, fontSize: 18, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", ...plastikFarbe("#6C5BD4") }}>
          Schlaf gut
        </button>
      </div>
    </div>
  );
}
