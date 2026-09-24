import React from "react";
import { accent, accentSoft, accentDark, hexZuRgba, nachtSchatten, nachtVerlauf } from "./theme";
import { KATEGORIE_META, ROUTINE_META, TAGESRAETSEL_META } from "../utils/dayItems";

// Automatische Tages-Quests (Spiel-Ausbau 23.09., Logik: utils/tagesQuests.js)
// — kleine Etappenziele des eigenen Tages, für alle sichtbar (auch ohne vom
// Coach vergebene Quests).
// Gestaltung (23.09., Nutzerinnen-Wunsch "farblich abheben, und die Quests
// in den Farben ihres Bereichs"): Nachtblau-Kopf wie die anderen
// Highlight-Karten, jede Quest als Kasten in der Farbe ihres Bereichs
// (Morgen-Sprint = Morgenroutine-Orange, Trinkziel = Hydration-Blau).
// Bereichsübergreifende Quests (erster Haken, Halbzeit) in der App-Farbe.
const QUEST_FARBE = {
  morgen: ROUTINE_META.morgenroutine,
  trinken: KATEGORIE_META.hydration,
  raetsel: TAGESRAETSEL_META,
};
const ALLGEMEIN = { dot: accent, bg: accentSoft, text: accentDark };

export default function TagesQuestsKarte({ quests, onOpenView }) {
  if (!quests || quests.length === 0) return null;
  const geschafft = quests.filter((q) => q.geschafft).length;
  const alle = geschafft === quests.length;
  return (
    <div style={{ marginBottom: 20, borderRadius: 24, overflow: "hidden", background: "#fff", boxShadow: nachtSchatten }}>
      <div style={{ background: nachtVerlauf, color: "#fff", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🎯 Tages-Quests</div>
        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>
          {geschafft}/{quests.length} {alle ? "— alle geschafft! 🎉" : "geschafft"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
        {quests.map((q) => {
          const f = QUEST_FARBE[q.key] || ALLGEMEIN;
          const anteil = q.ziel > 0 ? Math.min(1, q.aktuell / q.ziel) : 0;
          const tippbar = q.viewId && onOpenView && !q.geschafft;
          return (
            <div
              key={q.key}
              role={tippbar ? "button" : undefined}
              tabIndex={tippbar ? 0 : undefined}
              className={tippbar ? "mp-tap" : undefined}
              onClick={tippbar ? () => onOpenView(q.viewId) : undefined}
              onKeyDown={tippbar ? (e) => (e.key === "Enter" || e.key === " ") && onOpenView(q.viewId) : undefined}
              style={{
                cursor: tippbar ? "pointer" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 16,
                border: `2px solid ${f.dot}`,
                background: q.geschafft ? f.dot : f.bg,
                color: q.geschafft ? "#fff" : f.text,
                transition: "background 0.4s",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 99, background: q.geschafft ? "rgba(255,255,255,0.25)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {q.geschafft ? "✓" : q.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 800 }}>
                  <span>{q.titel}</span>
                  <span style={{ whiteSpace: "nowrap", opacity: 0.85 }}>
                    {q.aktuell}/{q.ziel}
                    {q.einheit ? ` ${q.einheit}` : ""}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: q.geschafft ? "rgba(255,255,255,0.3)" : hexZuRgba(f.dot, 0.18), marginTop: 5, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(anteil * 100)}%`, height: "100%", borderRadius: 99, background: q.geschafft ? "#fff" : f.dot, transition: "width 0.5s ease-out" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
