import React from "react";
import { accentDark } from "./theme";

// Schwebender "+"-Button für "Neues Protokoll" — ersetzt den früheren FAB
// innerhalb der unteren Tab-Leiste (BottomNav, entfernt, da durch die
// Ordner-Kacheln auf der Startseite redundant geworden). Bleibt trotzdem
// von jedem Hauptbildschirm aus erreichbar.
export default function Fab({ onClick }) {
  return (
    <button
      className="mp-tap"
      onClick={onClick}
      aria-label="Neues Protokoll"
      style={{
        position: "fixed",
        bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        width: 56,
        height: 56,
        borderRadius: 28,
        border: "none",
        background: accentDark,
        color: "#fff",
        fontSize: 26,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(10, 95, 79, 0.35)",
        zIndex: 40,
      }}
    >
      +
    </button>
  );
}
