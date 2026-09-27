import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import { cardBorder } from "./theme";

// Einheitliche Kopfzeile für alle Screens: Home-Button links neben dem Logo
// (statt wie früher rechts, klein, einzeln pro Screen dupliziert), Titel
// rechts daneben. Ersetzt ~19 einzeln kopierte Header-Blöcke.
// "‹ Zurück" (27.09., Nutzerinnen-Wunsch: "nur eine Seite zurück, nicht
// immer erst zur Startseite"): geht in der App-Historie eine Seite zurück;
// gibt es keine vorige App-Seite, wie ⌂ zur Startseite.
function zurueck(onHome) {
  if ((window.history.state?.tiefe || 0) > 0) window.history.back();
  else onHome?.();
}

export default function ViewHeader({ title, onHome, homeTitle = "Zur Startseite" }) {
  // Erst nach dem Eintragen der neuen Seite in die Historie nachsehen
  // (AuthenticatedApp trägt sie in einem Effekt ein, der nach diesem läuft).
  const [hatVorherige, setHatVorherige] = useState(false);
  useEffect(() => {
    const pruefen = () => setHatVorherige((window.history.state?.tiefe || 0) > 1);
    const t = setTimeout(pruefen, 0);
    window.addEventListener("popstate", pruefen);
    return () => {
      clearTimeout(t);
      window.removeEventListener("popstate", pruefen);
    };
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 6 }}>
      {hatVorherige && (
        <button
          type="button"
          onClick={() => zurueck(onHome)}
          className="mp-tap"
          title="Eine Seite zurück"
          aria-label="Eine Seite zurück"
          style={{
            height: 52,
            padding: "0 14px 0 10px",
            borderRadius: 15,
            border: `1px solid ${cardBorder}`,
            background: "#fff",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>‹</span> Zurück
        </button>
      )}
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
      <Logo size={38} />
      {title && <div style={{ fontSize: 16, fontWeight: 800, marginLeft: 2 }}>{title}</div>}
    </div>
  );
}
