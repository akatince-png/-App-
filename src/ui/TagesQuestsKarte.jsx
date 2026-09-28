import React from "react";
import { accent, accentSoft, accentDark } from "./theme";
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
    // Design 2.0 (28.09.): Überschrift über der Karte statt farbigem Balken,
    // Zeilen als ruhige Liste mit feinen Trennlinien.
    <div data-tages-quests style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 2px 10px" }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>🎯 Tages-Quests</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#667085" }}>
          {geschafft}/{quests.length} {alle ? "— alle geschafft! 🎉" : "geschafft"}
        </div>
      </div>
      <div style={{ borderRadius: 22, background: "#fff", border: "1px solid rgba(16, 24, 40, 0.05)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 24px rgba(16, 24, 40, 0.06)", padding: "4px 14px" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {quests.map((q, i) => {
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
                gap: 12,
                padding: "11px 0",
                borderTop: i ? "1px solid #EEF1F6" : "none",
                color: "#101828",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 12, background: q.geschafft ? f.dot : f.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                {q.geschafft ? "✓" : q.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14.5, fontWeight: 700 }}>
                  <span>{q.titel}</span>
                  <span style={{ whiteSpace: "nowrap", color: "#667085", fontSize: 13 }}>
                    {q.aktuell}/{q.ziel}
                    {q.einheit ? ` ${q.einheit}` : ""}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "#EEF1F6", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(anteil * 100)}%`, height: "100%", borderRadius: 99, background: f.dot, transition: "width 0.5s ease-out" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
