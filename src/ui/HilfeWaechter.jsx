import React, { useEffect, useRef, useState } from "react";
import { HILFE_TEXT, brauchtHilfeHinweis } from "../utils/hilfeHinweis";

// Liest alle Freitext-Eingaben der Coachee-Ansicht mit (Chat mit dem Coach,
// Tagebuch, Aka, „Moment festhalten“ …). Nur bei eindeutigen Aussagen zu
// Suizidgedanken erscheint ruhig ein Hinweis mit Hilfsnummern. Es wird
// nichts gespeichert oder gesendet. Siehe utils/hilfeHinweis.js.
export default function HilfeWaechter() {
  const [offen, setOffen] = useState(false);
  const gezeigtRef = useRef(false);

  useEffect(() => {
    let timer;
    const pruefen = (e) => {
      const el = e.target;
      if (!el || !("value" in el) || !(el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && (el.type === "text" || el.type === "search")))) return;
      clearTimeout(timer);
      const wert = el.value;
      timer = setTimeout(() => {
        if (!gezeigtRef.current && brauchtHilfeHinweis(wert)) {
          gezeigtRef.current = true;
          setOffen(true);
        }
      }, 600);
    };
    document.addEventListener("input", pruefen, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("input", pruefen, true);
    };
  }, []);

  if (!offen) return null;
  return (
    <div role="dialog" aria-label={HILFE_TEXT.titel} data-hilfe-hinweis style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 3000, display: "flex", justifyContent: "center", padding: "0 12px calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ width: "100%", maxWidth: 460, background: "var(--mp-karte)", borderRadius: 20, padding: "16px 16px 14px", boxShadow: "0 -6px 30px rgba(20,23,26,.2)", border: "1px solid color-mix(in srgb, #EAEAE5 var(--mp-flaeche), var(--mp-rand-dunkel))" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "color-mix(in srgb, #15181A var(--mp-schrift), var(--mp-schrift-hell))" }}>{HILFE_TEXT.titel}</div>
        <div style={{ fontSize: 13.5, color: "color-mix(in srgb, #3D4248 var(--mp-schrift), var(--mp-schrift-hell))", lineHeight: 1.5, marginTop: 6 }}>{HILFE_TEXT.text}</div>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          {HILFE_TEXT.nummern.map(([name, nr]) => (
            <a key={nr} href={`tel:${nr.replace(/\s/g, "")}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, #F3F4F8 var(--mp-flaeche), var(--mp-karte))", color: "color-mix(in srgb, #1B2350 var(--mp-schrift), var(--mp-schrift-hell))", textDecoration: "none", fontSize: 14, fontWeight: 800 }}>
              <span style={{ fontWeight: 700 }}>{name}</span>
              <span>{nr}</span>
            </a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "color-mix(in srgb, #6B7178 var(--mp-schrift), var(--mp-schrift-hell))", lineHeight: 1.45, marginTop: 8 }}>{HILFE_TEXT.zusatz}</div>
        <button type="button" onClick={() => setOffen(false)} style={{ marginTop: 10, width: "100%", border: "none", background: "#1B2350", color: "#fff", borderRadius: 12, padding: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          Schließen
        </button>
      </div>
    </div>
  );
}
