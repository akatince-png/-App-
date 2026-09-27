import React, { useEffect, useRef } from "react";
import { useFokusTimer, restText } from "../data/useFokusTimer";
import { feuereBelohnung } from "../utils/belohnungBus";
import { accentDark, cardBorder, shadow, textMain, textMuted } from "./theme";

// Countdown-Ring (27.09.): schrumpft, während die Zeit läuft.
export function Ring({ anteil, groesse = 56, dicke = 6, farbe = accentDark, children }) {
  const r = (groesse - dicke) / 2;
  const umfang = 2 * Math.PI * r;
  return (
    <span style={{ position: "relative", width: groesse, height: groesse, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={groesse} height={groesse} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={groesse / 2} cy={groesse / 2} r={r} fill="none" stroke="#E4E6EE" strokeWidth={dicke} />
        <circle cx={groesse / 2} cy={groesse / 2} r={r} fill="none" stroke={farbe} strokeWidth={dicke} strokeLinecap="round" strokeDasharray={umfang} strokeDashoffset={umfang * (1 - anteil)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span style={{ position: "relative", fontSize: groesse * 0.22, fontWeight: 800, color: textMain, textAlign: "center", lineHeight: 1.05 }}>{children}</span>
    </span>
  );
}

// "Läuft gerade" – auf der Startseite und oben im Tagesplan.
export default function LaufenderTimerKarte({ onFertig }) {
  const { timer, restSek, anteil, abgelaufen, stoppen, verlaengern } = useFokusTimer();
  const gemeldet = useRef(null);
  useEffect(() => {
    if (abgelaufen && timer && gemeldet.current !== timer.start) {
      gemeldet.current = timer.start;
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* nicht überall verfügbar */
      }
    }
  }, [abgelaufen, timer]);
  if (!timer) return null;
  const min = Math.floor(restSek / 60);
  const sek = restSek % 60;
  return (
    <div role="timer" aria-label={`${timer.name}: noch ${restText(restSek)}`} data-fokus-timer style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1.5px solid ${abgelaufen ? "#2E9C86" : cardBorder}`, borderRadius: 18, padding: "10px 12px", marginBottom: 14, boxShadow: shadow }}>
      <Ring anteil={anteil} groesse={58} farbe={abgelaufen ? "#2E9C86" : accentDark}>
        {abgelaufen ? "✓" : `${min}:${String(sek).padStart(2, "0")}`}
      </Ring>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3, color: textMuted }}>{abgelaufen ? "ZEIT UM" : "LÄUFT GERADE"}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {timer.symbol} {timer.name}
        </div>
        <div style={{ fontSize: 12, color: textMuted }}>{abgelaufen ? "Geschafft? Oder noch 5 Minuten?" : `noch ${restText(restSek)}`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <button
          type="button"
          className="mp-tap"
          onClick={() => {
            // Hakt der Tagesplan den Punkt ab, kommt dessen Belohnung; sonst
            // gibt es hier einen eigenen kleinen Moment (Spielcharakter, 27.09.).
            const abgehakt = onFertig?.(timer);
            if (!abgehakt) feuereBelohnung({ text: `${timer.symbol || "⏱️"} ${timer.name}: Fokus-Zeit geschafft`, icon: "target" });
            stoppen();
          }}
          style={{ border: "none", borderRadius: 10, padding: "7px 10px", fontSize: 12, fontWeight: 800, background: "#2E9C86", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
        >
          ✓ Fertig
        </button>
        <button type="button" className="mp-tap" onClick={() => verlaengern(5)} style={{ border: "none", borderRadius: 10, padding: "6px 10px", fontSize: 11.5, fontWeight: 800, background: "#EEF0F5", color: textMain, cursor: "pointer", fontFamily: "inherit" }}>
          +5 Min
        </button>
      </div>
    </div>
  );
}
