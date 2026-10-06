import React from "react";
import PlastikSymbol from "./PlastikSymbol";
import { plastikFarbe } from "./plastik";
import { KATEGORIE_META } from "../utils/dayItems";
import { zeitText } from "../utils/naechsteSchritte";
import bildSupplemente from "../assets/fenster/supplemente.jpg";
import bildErnaehrung from "../assets/fenster/ernaehrung.jpg";
import bildSport from "../assets/fenster/sport.jpg";
import bildWasser from "../assets/fenster/wasser.jpg";

// „Als Nächstes“-Fenster (06.10., Nutzerin: „Wenn ‚Aufgeladen‘ steht, soll
// schon das nächste Actionfenster passieren … je nach Lebensbereich mit
// entsprechendem Bild und Fenster. Ist ein Workflow dran, öffnet sich die
// Workflow-Seite mit der anstehenden Aufgabe.“). Ganzer Bildschirm wie das
// Morgenfenster. Was sich mit einem Tipp abhaken lässt, wird hier abgehakt –
// danach kündigt das Fenster gleich den folgenden Punkt an.
// Bereiche ohne eigenes Bild zeigen ihr großes Plastik-Symbol auf Farbverlauf
// (Bilder für Workflow, Tageslicht, Schlaf, Atem … folgen, sobald Canva wieder geht).
const BILD = { supplement: bildSupplemente, hormon: bildSupplemente, mahlzeit: bildErnaehrung, training: bildSport, hydration: bildWasser };
const KNOPF = { workflow: "▶ Zum Workflow", training: "▶ Zum Training", zeitblock: "Im Tagesplan ansehen" };

export default function NaechsterSchrittFenster({ schritte = [], direkt, onErledigt, onOeffnen, onSpaeter }) {
  const [item, ...danach] = schritte;
  if (!item) {
    return (
      <Huelle farbe="#2FA36B">
        <div style={{ fontSize: 26, fontWeight: 900 }}>Alles erledigt ✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#4A5570", margin: "6px 0 16px" }}>Für heute steht nichts mehr im Plan.</div>
        <Knopf farbe="#2FA36B" onClick={onSpaeter}>Super</Knopf>
      </Huelle>
    );
  }
  const meta = KATEGORIE_META[item.kategorie] || KATEGORIE_META.gewohnheit;
  const farbe = item.farbe?.dot || meta.dot;
  const kannDirekt = direkt(item);
  return (
    <Huelle farbe={farbe} bild={BILD[item.kategorie]} item={item}>
      <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 0.6, color: farbe }}>ALS NÄCHSTES · {zeitText(item).toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 900, margin: "4px 0 2px", lineHeight: 1.15 }}>{item.name}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#4A5570", marginBottom: 14 }}>
        {[meta.label, item.detail].filter(Boolean).join(" · ")}
      </div>
      {kannDirekt ? (
        <Knopf farbe={farbe} onClick={() => onErledigt(item)} data="erledigt">✓ Erledigt</Knopf>
      ) : (
        <Knopf farbe={farbe} onClick={() => onOeffnen(item)} data="oeffnen">{KNOPF[item.kategorie] || "▶ Öffnen"}</Knopf>
      )}
      {danach.length > 0 && (
        <div data-naechster-danach style={{ marginTop: 12, textAlign: "left", fontSize: 13, color: "#4A5570" }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Danach:</div>
          {danach.map((d) => (
            <div key={d.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0" }}>
              <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              <span style={{ flexShrink: 0 }}>{d.uhrzeit ? d.uhrzeit.slice(0, 5) : "heute"}</span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={onSpaeter} style={{ marginTop: 8, border: "none", background: "transparent", color: "#6B7590", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 8, fontFamily: "inherit" }}>
        Später
      </button>
    </Huelle>
  );
}

function Huelle({ farbe, bild, item, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Als Nächstes"
      data-naechster-schritt
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: bild ? `center 25% / cover no-repeat url(${bild})` : `radial-gradient(circle at 50% 30%, ${farbe}55, transparent 60%), linear-gradient(180deg, ${farbe}33, #F5F1EC)`,
        backgroundColor: "#F5F1EC",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "max(48px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))",
        color: "#1F2A44",
      }}
    >
      {!bild && item && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "18%", display: "flex", justifyContent: "center" }}>
          <PlastikSymbol kategorie={item.kategorie} farbe={farbe} size={150} />
        </div>
      )}
      <div style={{ position: "relative", maxWidth: 460, width: "100%", margin: "0 auto", padding: "20px 20px 10px", borderRadius: 30, background: "rgba(255,255,255,.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 10px 30px rgba(0,0,0,.18)", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Knopf({ farbe, onClick, data, children }) {
  return (
    <button type="button" className="mp-tap" data-naechster-knopf={data} onClick={onClick} style={{ width: "100%", minHeight: 58, border: "none", borderRadius: 22, fontSize: 19, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", ...plastikFarbe(farbe) }}>
      {children}
    </button>
  );
}
