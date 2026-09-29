import React from "react";
import { hexZuRgba, logoBlau, logoTuerkis, logoVerlauf, nachtSchatten, nachtVerlauf } from "./theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { levelAusPunkten, levelFortschritt } from "../utils/level";

// Spielstand ganz oben auf Home (Nutzerinnen-Wunsch 23.09.: "die UX ist noch
// nicht auf diesem Spiellevel … die Hauptseite hat sich nicht nachvollziehbar
// verändert"). Bündelt, was es an Spiel-Elementen schon gab, aber verstreut
// oder versteckt war — Tagesfortschritt, globale Serie (🔥) und Punkte (⚡)
// aus dem Erfolge-System (utils/errungenschaften.js) — plus ein Level mit
// Fortschrittsbalken bis zum nächsten Level (utils/level.js). Antippen führt
// zu den Erfolgen.
const GOLD = KATEGORIE_META.tageslicht.dot;

function TagesRing({ erledigt, gesamt }) {
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const umfang = 2 * Math.PI * r;
  const anteil = gesamt > 0 ? Math.min(1, erledigt / gesamt) : 0;
  const fertig = gesamt > 0 && erledigt >= gesamt;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 ${fertig ? 10 : 5}px ${hexZuRgba(logoTuerkis, fertig ? 0.9 : 0.5)})` }}>
        <defs>
          <linearGradient id="mp-tagesring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={logoTuerkis} />
            <stop offset="100%" stopColor={logoBlau} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)" }} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#mp-tagesring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={umfang}
          strokeDashoffset={umfang * (1 - anteil)}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--gk-text, #fff)" }}>
        <div style={{ fontSize: fertig ? 26 : 22, fontWeight: 800, lineHeight: 1 }}>{fertig ? "🎉" : `${erledigt}/${gesamt}`}</div>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginTop: 3 }}>{fertig ? "geschafft" : "heute"}</div>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(var(--gk-rgb, 255, 255, 255), 0.1)",
        color: "var(--gk-text, #fff)",
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// eingebettet (24.09., Nutzerinnen-Wunsch): Spielstand und Gehirn in EINER
// Karte ganz oben — dann ohne eigenen Hintergrund, die Gehirn-Karte liefert
// ihn (siehe GehirnKarte `kopf`).
export default function SpielstandKarte({ gruss, statusZeile, erledigt, gesamt, punkte, serie, onOpenErfolge, eingebettet = false }) {
  const lvl = levelAusPunkten(punkte);
  const fortschritt = levelFortschritt(lvl);
  const nochBisLevel = Math.max(0, lvl.ziel - lvl.punkte);

  return (
    <button
      type="button"
      className="mp-tap"
      onClick={onOpenErfolge}
      aria-label={`Spielstand: ${erledigt} von ${gesamt} heute erledigt, Serie ${serie} Tage, ${punkte} Punkte, Level ${lvl.level}. Zu den Erfolgen.`}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        borderRadius: 24,
        padding: eingebettet ? 2 : 18,
        marginBottom: eingebettet ? 0 : 16,
        color: "var(--gk-text, #fff)",
        background: eingebettet ? "transparent" : nachtVerlauf,
        boxShadow: eingebettet ? "none" : nachtSchatten,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: gruss ? "space-between" : "flex-end", alignItems: "center", gap: 10, marginBottom: gruss ? 12 : 4 }}>
        {gruss && <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, minWidth: 0 }}>{gruss}</div>}
        <span style={{ padding: "5px 11px", borderRadius: 999, background: GOLD, color: "color-mix(in srgb, #3B2A00 var(--mp-schrift), var(--mp-schrift-hell))", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
          Level {lvl.level}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <TagesRing erledigt={erledigt} gesamt={gesamt} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{statusZeile}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Chip>🔥 {serie} {serie === 1 ? "Tag" : "Tage"}</Chip>
            <Chip>⚡ {punkte} Punkte</Chip>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ height: 8, borderRadius: 99, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)", overflow: "hidden" }}>
          <div style={{ width: `${Math.round(fortschritt * 100)}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.6s ease-out" }} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>
          Noch {nochBisLevel} {nochBisLevel === 1 ? "Punkt" : "Punkte"} bis Level {lvl.level + 1} · 1 Punkt je erledigtem Eintrag
        </div>
      </div>
    </button>
  );
}

// Design 2.0 (28.09., Entwurf „Mischung B+C“): Spielstand als drei ruhige
// Kacheln unter der Gehirn-Karte – heute erledigt (Ring), Serie, Level.
// Antippen führt wie bisher zu den Erfolgen.
export function SpielstandReihe({ erledigt, gesamt, punkte, serie, onOpenErfolge }) {
  const lvl = levelAusPunkten(punkte);
  const fortschritt = levelFortschritt(lvl);
  const anteil = gesamt > 0 ? Math.min(1, erledigt / gesamt) : 0;
  const kachel = {
    background: "var(--mp-karte, #fff)",
    border: "1px solid rgba(16, 24, 40, 0.05)",
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05), 0 6px 18px rgba(16, 24, 40, 0.05)",
    borderRadius: 18,
    padding: "11px 12px",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "inherit",
    minWidth: 0,
  };
  const wert = { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 };
  const unter = { fontSize: 11.5, color: "color-mix(in srgb, #667085 var(--mp-schrift), var(--mp-schrift-hell))", fontWeight: 600 };
  return (
    <div data-spielstand-reihe style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }} aria-label={`Spielstand: ${erledigt} von ${gesamt} heute erledigt, Serie ${serie} Tage, ${punkte} Punkte, Level ${lvl.level}`}>
      <button type="button" className="mp-tap" onClick={onOpenErfolge} style={{ ...kachel, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 36, height: 36, borderRadius: 99, flexShrink: 0, background: `conic-gradient(${logoTuerkis} 0 ${anteil * 360}deg, #E6EAF2 0)`, display: "grid", placeItems: "center" }}>
          <span style={{ width: 27, height: 27, borderRadius: 99, background: "var(--mp-karte, #fff)" }} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ ...wert, display: "block" }}>
            {erledigt}/{gesamt}
          </span>
          <span style={{ ...unter, display: "block" }}>heute</span>
        </span>
      </button>
      <button type="button" className="mp-tap" onClick={onOpenErfolge} style={kachel}>
        <span style={{ ...wert, display: "block" }}>🔥 {serie}</span>
        <span style={{ ...unter, display: "block" }}>{serie === 1 ? "Tag" : "Tage"} in Folge</span>
      </button>
      <button type="button" className="mp-tap" onClick={onOpenErfolge} style={kachel}>
        <span style={{ ...wert, display: "block" }}>Level {lvl.level}</span>
        <span style={{ display: "block", height: 5, borderRadius: 9, background: "color-mix(in srgb, #E6EAF2 var(--mp-flaeche), var(--mp-karte))", margin: "5px 0 3px", overflow: "hidden" }}>
          <span style={{ display: "block", width: `${Math.round(fortschritt * 100)}%`, height: "100%", background: logoVerlauf, borderRadius: 9 }} />
        </span>
        <span style={{ ...unter, display: "block" }}>⚡ {punkte} Punkte</span>
      </button>
    </div>
  );
}
