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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
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
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
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
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
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
        color: "#fff",
        background: eingebettet ? "transparent" : nachtVerlauf,
        boxShadow: eingebettet ? "none" : nachtSchatten,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, minWidth: 0 }}>{gruss}</div>
        <span style={{ padding: "5px 11px", borderRadius: 999, background: GOLD, color: "#3B2A00", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
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
        <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${Math.round(fortschritt * 100)}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.6s ease-out" }} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>
          Noch {nochBisLevel} {nochBisLevel === 1 ? "Punkt" : "Punkte"} bis Level {lvl.level + 1} · 1 Punkt je erledigtem Eintrag
        </div>
      </div>
    </button>
  );
}
