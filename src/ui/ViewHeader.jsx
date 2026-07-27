import React from "react";
import Logo from "./Logo";
import { cardBorder } from "./theme";

// Einheitliche Kopfzeile für alle Screens: Home-Button links neben dem Logo
// (statt wie früher rechts, klein, einzeln pro Screen dupliziert), Titel
// rechts daneben. Ersetzt ~19 einzeln kopierte Header-Blöcke.
export default function ViewHeader({ title, onHome, homeTitle = "Zum Dashboard" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, marginTop: 6 }}>
      <button
        onClick={onHome}
        className="mp-tap"
        title={homeTitle}
        aria-label={homeTitle}
        style={{
          width: 52,
          height: 52,
          borderRadius: 15,
          border: `1px solid ${cardBorder}`,
          background: "#fff",
          fontSize: 25,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ⌂
      </button>
      <Logo size={30} />
      {title && <div style={{ fontSize: 15, fontWeight: 800, marginLeft: 2 }}>{title}</div>}
    </div>
  );
}
