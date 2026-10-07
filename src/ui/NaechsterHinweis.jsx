import React, { useEffect, useRef } from "react";
import { zeitText } from "../utils/naechsteSchritte";

// Kleiner Hinweis nach dem Abhaken (07.10., Nutzerin: „wenn das erledigt ist,
// möchte ich so ein ‚hey, vergiss nicht, als Nächstes steht das an um die und
// die Uhrzeit‘“). Erscheint über der unteren Leiste und verschwindet nach
// ein paar Sekunden von selbst; Antippen öffnet das große „Als Nächstes“-Fenster.
export default function NaechsterHinweis({ item, onOeffnen, onWeg }) {
  const wegRef = useRef(onWeg);
  wegRef.current = onWeg;
  useEffect(() => {
    if (!item) return undefined;
    const id = setTimeout(() => wegRef.current?.(), 8000);
    return () => clearTimeout(id);
  }, [item]);
  if (!item) return null;
  return (
    <button
      type="button"
      data-naechster-hinweis
      onClick={onOeffnen}
      className="mp-tap"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        zIndex: 900,
        maxWidth: 460,
        margin: "0 auto",
        border: "none",
        borderRadius: 18,
        padding: "12px 14px",
        textAlign: "left",
        background: "#1F2A44",
        color: "#fff",
        boxShadow: "0 10px 24px rgba(16,24,40,.3)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, opacity: 0.75 }}>VERGISS NICHT – ALS NÄCHSTES · {zeitText(item).toUpperCase()}</span>
      <span style={{ display: "block", fontSize: 15, fontWeight: 800, marginTop: 2 }}>{item.name} ›</span>
    </button>
  );
}
