import React from "react";
import gehirn from "../assets/gehirn/tag.webp";
import { plastikFarbe } from "./plastik";

// Abschluss der Morgenroutine (06.10., Nutzerin: „als letztes Bild das
// Gehirn – okay, wir sind jetzt aufgeladen. Das ist dann die Bestätigung,
// dass man die Morgenroutine voll und gut durchgezogen hat.“). Entwurf D:
// das AKA-Gehirn in einer aufgehenden Sonne, die Strahlen drehen sich langsam.
export default function AufgeladenFenster({ gesamtZeit, feier = null, onWeiter }) {
  return (
    <div
      data-aufgeladen
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        marginBottom: 14,
        minHeight: 520,
        background: "linear-gradient(180deg, #14214A 0%, #3B3F86 38%, #E98A6B 72%, #FFD08A 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        boxShadow: "var(--mp-schatten)",
      }}
    >
      <style>{`
        @keyframes mp-strahlen-drehen { to { transform: rotate(360deg); } }
        @keyframes mp-sonne-auf { from { transform: translateY(60px) scale(.85); opacity: .3; } to { transform: none; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { [data-aufgeladen] * { animation: none !important; } }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: 175,
          width: 560,
          height: 560,
          margin: "-280px 0 0 -280px",
          borderRadius: "50%",
          background: "repeating-conic-gradient(rgba(255,230,160,.2) 0 6deg, transparent 6deg 18deg)",
          animation: "mp-strahlen-drehen 40s linear infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: 60,
          width: 230,
          height: 230,
          marginLeft: -115,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #FFF6C8, #FFC94D 45%, #FF9A2E 100%)",
          boxShadow: "0 0 80px 30px rgba(255,190,80,.55)",
          animation: "mp-sonne-auf 1.4s ease-out both",
        }}
      >
        <img src={gehirn} alt="" style={{ width: 170, position: "absolute", left: 30, top: 38, filter: "drop-shadow(0 6px 10px rgba(120,50,0,.35))" }} />
      </div>
      <div
        style={{
          position: "relative",
          margin: 14,
          padding: "20px 18px 16px",
          borderRadius: 24,
          background: "rgba(255,255,255,.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          textAlign: "center",
          color: "#1F2A44",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900 }}>Aufgeladen! ⚡</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#4A5570", margin: "6px 0 2px" }}>Morgenroutine geschafft – dein Kopf ist bereit für den Tag.</div>
        <div style={{ fontSize: 13, color: "#6B7590", marginBottom: feier?.hinweis ? 4 : 14 }}>
          {gesamtZeit ? `Gesamtzeit: ${gesamtZeit}` : ""}
          {feier?.punkte ? `${gesamtZeit ? " · " : ""}⚡ +${feier.punkte} Punkt${feier.punkte === 1 ? "" : "e"}` : ""}
        </div>
        {feier?.hinweis && <div style={{ fontSize: 12, color: "#6B7590", marginBottom: 14 }}>{feier.hinweis}</div>}
        <button
          type="button"
          className="mp-tap"
          onClick={onWeiter}
          style={{ width: "100%", minHeight: 54, border: "none", borderRadius: 20, fontSize: 18, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", ...plastikFarbe("#F07A1A") }}
        >
          Los in den Tag
        </button>
      </div>
    </div>
  );
}
