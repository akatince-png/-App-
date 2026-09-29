import React, { useEffect, useState } from "react";
import { cardBorder, fontHeading, textMain } from "./theme";

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
  // Design 2.0 (28.09.): runde Symbol-Knöpfe (Zurück/Start) und ein großer,
  // ruhiger Titel – das Logo sitzt nur noch auf der Startseite.
  const knopf = {
    height: 44,
    minWidth: 44,
    borderRadius: 999,
    border: `1px solid ${cardBorder}`,
    background: "var(--mp-karte)",
    boxShadow: "0 1px 2px rgba(20, 24, 40, 0.05)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: textMain,
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 2 }}>
      {hatVorherige && (
        <button type="button" onClick={() => zurueck(onHome)} className="mp-tap" title="Eine Seite zurück" aria-label="Eine Seite zurück" style={{ ...knopf, padding: "0 14px 0 10px", gap: 4, fontSize: 14, fontWeight: 700 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Zurück
        </button>
      )}
      <button onClick={onHome} className="mp-tap" title={homeTitle} aria-label={homeTitle} style={knopf}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
        </svg>
      </button>
      {title && <h1 style={{ fontFamily: fontHeading, fontSize: 20, fontWeight: 700, margin: "0 0 0 4px", lineHeight: 1.25, letterSpacing: -0.2, minWidth: 0 }}>{title}</h1>}
    </div>
  );
}
