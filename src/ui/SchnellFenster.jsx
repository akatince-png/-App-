import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import SchnellIcon from "./SchnellIcon";

// Eigenes Fenster für Training/Workflow/Spielen (25.10., Nutzerin: „nicht
// mehr im Homebildschirm mitten im Bild öffnen, sondern in einem separaten
// Fenster, wo nichts anderes drumherum ist“). Die Startseite dahinter steht
// still; „‹ Zurück“ schließt das Fenster. Gestaltung wie die Symbole der
// Home-Bildschirm-Abkürzungen (public/icons/kurz-*.png): flacher Verlauf,
// weißes Linien-Symbol, Name darunter.
const FENSTER = {
  training: { titel: "Training", frage: "Worauf hast du Lust?", icon: "training", hell: "#FF8A73", farbe: "#D13A26" },
  workflow: { titel: "Workflow", frage: "Woran möchtest du arbeiten?", icon: "workflow", hell: "#F07BC0", farbe: "#A12A74" },
  spielen: { titel: "Spielen", frage: "Kurz das Gehirn wecken?", icon: "spielen", hell: "#9D8BFF", farbe: "#5B47E0" },
};

const verlauf = (hell, farbe) => `linear-gradient(135deg, ${hell}, ${farbe})`;

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
      <div style={{ flexShrink: 0, padding: "max(12px, env(safe-area-inset-top)) 16px 0" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <button type="button" onClick={onZu} aria-label="Zurück zur Startseite" style={{ width: 42, height: 42, flexShrink: 0, border: "none", borderRadius: 99, background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)", color: "var(--mp-text)", fontSize: 24, lineHeight: 1, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", paddingBottom: 3 }}>
            ‹
          </button>
          <span aria-hidden="true" style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 14, background: verlauf(f.hell, f.farbe), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 18px -8px ${f.farbe}` }}>
            <SchnellIcon name={f.icon} size={26} strich={2.2} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 24, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1 }}>{f.titel}</span>
            <span style={{ display: "block", fontSize: 13.5, color: "var(--mp-text-muted)", marginTop: 2 }}>{f.frage}</span>
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "20px 16px max(28px, env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// App-Kacheln nebeneinander (25.10., Nutzerin: „einer links, einer in der
// Mitte, einer rechts – kleine App-Kacheln statt Balken“). Immer im
// Dreier-Raster, damit alle Kacheln gleich groß sind; zwei stehen mittig.
export function AppKacheln({ kacheln, gewaehlt, label }) {
  return (
    <div role="group" aria-label={label} data-app-kacheln style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 14 }}>
      {kacheln.map((k) => {
        const an = gewaehlt === k.id;
        const aus = gewaehlt != null && !an;
        return (
          <button
            key={k.id}
            type="button"
            className="mp-tap"
            aria-pressed={gewaehlt === undefined ? undefined : an}
            aria-label={k.label}
            data-kachel={k.id}
            onClick={k.onClick}
            style={{ flex: "0 0 calc((100% - 28px) / 3)", maxWidth: 150, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", color: "var(--mp-text)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: aus ? 0.55 : 1, transition: "opacity .15s" }}
          >
            <span aria-hidden="true" style={{ width: "100%", aspectRatio: "1", borderRadius: "24%", background: verlauf(k.hell, k.farbe), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: an ? `0 0 0 3px var(--mp-canvas), 0 0 0 6px ${k.farbe}, 0 14px 24px -12px ${k.farbe}` : `0 14px 24px -12px ${k.farbe}`, transform: an ? "scale(1.04)" : "none", transition: "transform .15s, box-shadow .15s" }}>
              <SchnellIcon name={k.icon} size={44} strich={2} />
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2, textAlign: "center" }}>{k.titel}</span>
          </button>
        );
      })}
    </div>
  );
}
