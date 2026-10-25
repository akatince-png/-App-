import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import SchnellIcon from "./SchnellIcon";

// Eigenes Fenster für Training/Workflow/Spielen (25.10., Nutzerin: „nicht
// mehr im Homebildschirm mitten im Bild öffnen, sondern in einem separaten
// Fenster, wo nichts anderes drumherum ist“). Die Startseite dahinter steht
// still; „‹ Zurück“ schließt das Fenster.
const FENSTER = {
  training: { titel: "Training", icon: "training", hell: "#FF8A73", farbe: "#D13A26" },
  workflow: { titel: "Workflow", icon: "workflow", hell: "#F07BC0", farbe: "#A12A74" },
  spielen: { titel: "Spielen", icon: "spielen", hell: "#9D8BFF", farbe: "#5B47E0" },
};

export default function SchnellFenster({ art, onZu, children }) {
  const f = FENSTER[art];
  useEffect(() => {
    const html = document.documentElement;
    const vorher = { body: document.body.style.overflow, html: html.style.overscrollBehavior };
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    const taste = (e) => e.key === "Escape" && onZu();
    window.addEventListener("keydown", taste);
    return () => {
      document.body.style.overflow = vorher.body;
      html.style.overscrollBehavior = vorher.html;
      window.removeEventListener("keydown", taste);
    };
  }, [onZu]);
  if (!f) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={f.titel} data-schnell-fenster={art} style={{ position: "fixed", inset: 0, zIndex: 900, background: "var(--mp-canvas)", color: "var(--mp-text)", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <div style={{ flexShrink: 0, padding: "max(14px, env(safe-area-inset-top)) 16px 18px", background: `radial-gradient(circle at 20% 0%, rgba(255,255,255,.35), rgba(255,255,255,0) 55%), linear-gradient(155deg, ${f.hell}, ${f.farbe} 85%)`, color: "#fff", borderRadius: "0 0 26px 26px", boxShadow: `0 12px 24px -12px ${f.farbe}aa` }}>
        <button type="button" onClick={onZu} aria-label="Zurück zur Startseite" style={{ border: "none", background: "rgba(255,255,255,.22)", color: "#fff", borderRadius: 99, padding: "7px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          ‹ Zurück
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.22)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <SchnellIcon name={f.icon} size={30} strich={2.1} />
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.4 }}>{f.titel}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "16px 16px max(24px, env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// App-Kacheln nebeneinander (25.10., Nutzerin: „einer links, einer in der
// Mitte, einer rechts – kleine App-Kacheln statt Balken“).
export function AppKacheln({ kacheln, gewaehlt, label }) {
  return (
    <div role="group" aria-label={label} data-app-kacheln style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, kacheln.length)}, 1fr)`, gap: 10, marginBottom: 10 }}>
      {kacheln.map((k) => {
        const an = gewaehlt === k.id;
        return (
          <button
            key={k.id}
            type="button"
            className="mp-tap"
            aria-pressed={gewaehlt === undefined ? undefined : an}
            aria-label={k.label}
            data-kachel={k.id}
            onClick={k.onClick}
            style={{ border: "none", borderRadius: 22, padding: "14px 6px 12px", minHeight: 108, background: `radial-gradient(circle at 28% 20%, rgba(255,255,255,.45), rgba(255,255,255,0) 50%), linear-gradient(155deg, ${k.hell}, ${k.farbe} 80%)`, color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 12px 22px -8px ${k.farbe}99, inset 0 2px 1px rgba(255,255,255,.45), inset 0 -6px 12px rgba(0,0,0,.14)`, outline: an ? "3px solid var(--mp-text)" : "none", outlineOffset: 2, transform: an ? "translateY(-2px)" : "none", fontFamily: "inherit" }}
          >
            <span aria-hidden="true" style={{ fontSize: 30, lineHeight: 1, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))" }}>{k.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.15, textAlign: "center" }}>{k.titel}</span>
          </button>
        );
      })}
    </div>
  );
}
