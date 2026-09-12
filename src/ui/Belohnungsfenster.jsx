import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { accentDark, shadow, success } from "./theme";
import { aufBelohnungHoeren } from "../utils/belohnungBus";

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
export default function Belohnungsfenster() {
  const [eintrag, setEintrag] = useState(null);
  const timeoutRef = useRef(null);
  const zaehlerRef = useRef(0);

  useEffect(() => {
    const unhoeren = aufBelohnungHoeren((payload) => {
      zaehlerRef.current += 1;
      setEintrag({ ...payload, id: zaehlerRef.current });
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setEintrag(null), 2600);
    });
    return () => {
      unhoeren();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!eintrag) return null;

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
        gap: 10,
        padding: "12px 18px",
        borderRadius: 16,
        background: "#fff",
        boxShadow: shadow,
        border: `1px solid ${accentDark}22`,
        maxWidth: "calc(100vw - 32px)",
        animation: "belohnungEinblenden 0.35s ease-out",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: success,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={eintrag.icon || "trophy"} size={18} color="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#15181A" }}>{eintrag.text}</div>
        {eintrag.punkte != null && (
          <div style={{ fontSize: 11.5, color: success, fontWeight: 700 }}>+{eintrag.punkte} Punkt{eintrag.punkte === 1 ? "" : "e"}</div>
        )}
      </div>
    </div>
  );
}
