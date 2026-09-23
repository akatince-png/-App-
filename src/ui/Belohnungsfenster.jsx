import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { accentDark, shadow, success } from "./theme";
import { aufBelohnungHoeren } from "../utils/belohnungBus";
import { KATEGORIE_META } from "../utils/dayItems";

// Visuelles Feedback für jede rechtzeitig erledigte Tagesaufgabe (Nutzerin-
// Vorgabe, 12.09.: "möchte ich zum Beispiel sehen, wie viele Punkte ich
// gesammelt habe ... Ich brauch ein Feedback von der App"). Einmalig hier
// gemountet (AuthenticatedApp.jsx), hört auf den globalen belohnungBus statt
// selbst an jeder Erledigen-Stelle eingebaut zu werden — die auslösenden
// Stellen (Daten-Hooks, RoutineAblauf, TrainingView) rufen nur
// feuereBelohnung(...) auf, ohne von dieser Komponente zu wissen.
//
// Bewusst kein Rückgriff auf das bestehende Errungenschaften-Punktesystem
// (useErrungenschaften) hier — das rechnet Punkte/Streaks aus ALLEN bereits
// geladenen Kategorie-Daten neu (siehe utils/errungenschaften.js) und an
// jede einzelne Erledigen-Stelle zu hängen wäre unverhältnismäßig viel
// Verdrahtung für eine reine Popup-Anzeige. "1 Punkt pro erledigtem
// Eintrag" gilt dort unverändert — dieses Fenster zeigt genau das direkt an,
// ohne die Gesamtsumme neu zu berechnen.
// Konfetti-Farben aus den bestehenden Bereichsfarben statt neuer Töne.
const KONFETTI_FARBEN = ["hydration", "supplement", "gewohnheit", "training", "schlaf", "tageslicht"].map((k) => KATEGORIE_META[k].dot);

// Flugbahnen einmal pro Belohnung würfeln (nicht bei jedem Render), damit
// die Schnipsel während der Animation nicht springen.
function baueKonfetti(anzahl, reichweite) {
  return Array.from({ length: anzahl }, (_, i) => {
    const winkel = (Math.PI * 2 * i) / anzahl + Math.random() * 0.5;
    const weite = reichweite * (0.55 + Math.random() * 0.45);
    return {
      dx: `${Math.round(Math.cos(winkel) * weite)}px`,
      dy: `${Math.round(Math.sin(winkel) * weite)}px`,
      rot: `${Math.round(Math.random() * 540 - 270)}deg`,
      farbe: KONFETTI_FARBEN[i % KONFETTI_FARBEN.length],
      delay: `${Math.round(Math.random() * 90)}ms`,
    };
  });
}

// Kurzes haptisches Signal, wo das Gerät es kann (Android/Chrome; iOS-Safari
// ignoriert navigator.vibrate stillschweigend — kein Fehler, nur kein Effekt).
function vibriere(muster) {
  try {
    navigator.vibrate?.(muster);
  } catch {
    // ohne Vibration weiter
  }
}

export default function Belohnungsfenster() {
  const [eintrag, setEintrag] = useState(null);
  const timeoutRef = useRef(null);
  const zaehlerRef = useRef(0);

  useEffect(() => {
    const unhoeren = aufBelohnungHoeren((payload) => {
      zaehlerRef.current += 1;
      const gross = !!payload.gross;
      setEintrag({ ...payload, id: zaehlerRef.current, konfetti: baueKonfetti(gross ? 22 : 12, gross ? 90 : 52) });
      vibriere(gross ? [30, 60, 30, 60, 60] : 25);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setEintrag(null), gross ? 4200 : 2600);
    });
    return () => {
      unhoeren();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!eintrag) return null;

  const gross = !!eintrag.gross;
  const kreis = gross ? 46 : 34;

  return (
    <div
      key={eintrag.id}
      role="status"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: gross ? 14 : 10,
        padding: gross ? "16px 22px" : "12px 18px",
        borderRadius: gross ? 20 : 16,
        background: "#fff",
        boxShadow: shadow,
        border: `1px solid ${accentDark}22`,
        maxWidth: "calc(100vw - 32px)",
        animation: "belohnungEinblenden 0.35s ease-out",
      }}
    >
      <div style={{ position: "relative", width: kreis, height: kreis, flexShrink: 0 }}>
        {eintrag.konfetti.map((k, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="mp-konfetti"
            style={{ background: k.farbe, "--dx": k.dx, "--dy": k.dy, "--rot": k.rot, animationDelay: k.delay }}
          />
        ))}
        <div
          className="mp-belohnung-puls"
          style={{
            width: kreis,
            height: kreis,
            borderRadius: "50%",
            background: success,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={eintrag.icon || "trophy"} size={gross ? 24 : 18} color="#fff" />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: gross ? 15 : 13, fontWeight: 800, color: "#15181A" }}>{eintrag.text}</div>
        {eintrag.untertitel && <div style={{ fontSize: 12, color: "#6B7178", marginTop: 2 }}>{eintrag.untertitel}</div>}
        {eintrag.punkte != null && (
          <div style={{ fontSize: 11.5, color: success, fontWeight: 700 }}>+{eintrag.punkte} Punkt{eintrag.punkte === 1 ? "" : "e"}</div>
        )}
      </div>
    </div>
  );
}
