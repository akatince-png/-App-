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

// Nutzerinnen-Wunsch 23.09.: "das Fenster war so kurz offen, dass ich da
// gar nichts von hatte … ich möchte es selbst wegdrücken". Deshalb:
// - GROSSE Momente (Routine/Training abgeschlossen, Trinkziel, Tag
//   geschafft, Level, Abzeichen; `gross: true`) erscheinen als Feier-Karte
//   in der Bildschirmmitte und bleiben stehen, bis sie weggetippt werden.
// - Kleine "+1 Punkt"-Meldungen fürs einzelne Abhaken bleiben deutlich
//   länger sichtbar (5 s) und lassen sich per Tipp sofort schließen — sonst
//   müsste man bei fünf Supplementen hintereinander fünfmal wegtippen.
const KLEIN_DAUER_MS = 5000;

export default function Belohnungsfenster() {
  const [eintrag, setEintrag] = useState(null);
  const timeoutRef = useRef(null);
  const zaehlerRef = useRef(0);

  // Warteschlange: während eine große Feier offen ist, warten alle weiteren
  // Belohnungen, bis sie weggetippt wurde (nichts überschreibt sie).
  const warteschlangeRef = useRef([]);
  const zeigtGrossRef = useRef(false);
  const zeigeRef = useRef(null);

  useEffect(() => {
    const zeige = (payload) => {
      zaehlerRef.current += 1;
      const gross = !!payload.gross;
      zeigtGrossRef.current = gross;
      setEintrag({ ...payload, id: zaehlerRef.current, konfetti: baueKonfetti(gross ? 34 : 12, gross ? 150 : 52) });
      vibriere(gross ? [30, 60, 30, 60, 60] : 25);
      clearTimeout(timeoutRef.current);
      if (!gross) timeoutRef.current = setTimeout(() => naechsterOderZu(), KLEIN_DAUER_MS);
    };
    const naechsterOderZu = () => {
      zeigtGrossRef.current = false;
      const naechster = warteschlangeRef.current.shift();
      if (naechster) zeige(naechster);
      else setEintrag(null);
    };
    zeigeRef.current = naechsterOderZu;
    const unhoeren = aufBelohnungHoeren((payload) => {
      if (zeigtGrossRef.current) {
        if (warteschlangeRef.current.length < 4) warteschlangeRef.current.push(payload);
        return;
      }
      zeige(payload);
    });
    return () => {
      unhoeren();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const schliessen = () => {
    clearTimeout(timeoutRef.current);
    zeigeRef.current?.();
  };

  if (!eintrag) return null;

  const gross = !!eintrag.gross;
  const punkteText = eintrag.punkte != null ? `+${eintrag.punkte} Punkt${eintrag.punkte === 1 ? "" : "e"}` : null;

  const symbol = (kreis, iconGroesse) => (
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
        style={{ width: kreis, height: kreis, borderRadius: "50%", background: success, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Icon name={eintrag.icon || "trophy"} size={iconGroesse} color="#fff" />
      </div>
    </div>
  );

  if (gross) {
    return (
      <div
        key={eintrag.id}
        onClick={schliessen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(21, 24, 26, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          animation: "belohnungHintergrund 0.25s ease-out",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={eintrag.text}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 340,
            background: "#fff",
            borderRadius: 28,
            padding: "34px 24px 22px",
            textAlign: "center",
            boxShadow: shadow,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "belohnungKarte 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
          }}
        >
          {symbol(84, 40)}
          <div style={{ fontSize: 22, fontWeight: 900, color: "#15181A", marginTop: 20, lineHeight: 1.25 }}>{eintrag.text}</div>
          {eintrag.untertitel && <div style={{ fontSize: 14, color: "#6B7178", marginTop: 8, lineHeight: 1.45 }}>{eintrag.untertitel}</div>}
          {punkteText && (
            <div style={{ marginTop: 14, padding: "7px 16px", borderRadius: 999, background: `${success}1A`, color: success, fontSize: 16, fontWeight: 900 }}>
              ⚡ {punkteText}
            </div>
          )}
          <button
            type="button"
            onClick={schliessen}
            autoFocus
            className="mp-tap"
            style={{
              marginTop: 22,
              width: "100%",
              border: "none",
              borderRadius: 16,
              padding: "15px 18px",
              background: success,
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Juhu, weiter! 🎉
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      key={eintrag.id}
      type="button"
      role="status"
      onClick={schliessen}
      aria-label={`${eintrag.text}${punkteText ? `, ${punkteText}` : ""} — antippen zum Schließen`}
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 16,
        background: "#fff",
        boxShadow: shadow,
        border: `1px solid ${accentDark}22`,
        maxWidth: "calc(100vw - 32px)",
        animation: "belohnungEinblenden 0.35s ease-out",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      {symbol(34, 18)}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#15181A" }}>{eintrag.text}</div>
        {eintrag.untertitel && <div style={{ fontSize: 12, color: "#6B7178", marginTop: 2 }}>{eintrag.untertitel}</div>}
        {punkteText && <div style={{ fontSize: 11.5, color: success, fontWeight: 700 }}>{punkteText}</div>}
      </div>
    </button>
  );
}
