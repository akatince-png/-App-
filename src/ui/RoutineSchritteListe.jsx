import React from "react";
import { Card } from "./primitives";
import { accentDark, cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { ROUTINE_META } from "../utils/dayItems";
import ItemVerlauf from "./ItemVerlauf";

const ROUTINE_FARBE = { morgen: ROUTINE_META.morgenroutine.dot, abend: ROUTINE_META.abendroutine.dot };
const ROUTINE_KATEGORIE = { morgen: "morgenroutine", abend: "abendroutine" };

// Eigenständige, klar lesbare Anzeige der Routine-Schritte (Nutzerinnen-
// Vorgabe, 16.09.: "nicht in dieser kleinen Listenform oberhalb, sondern
// immer unter dem jeweiligen Bereich in einem separaten Fenster, in klar
// ersichtlichen, ausreichend großen Druckbuchstaben") — bewusst aus
// RoutineSchritteEditor.jsx herausgelöst (die zeigte die Liste bisher klein
// und GANZ OBEN, noch vor den Eingabefeldern) und als eigene Karte UNTER
// der jeweiligen Morgen-/Abendroutine-Karte platziert. Zeigt, sobald ein
// Zeitrahmen-Start gesetzt ist (routineZeitrahmenSetzen), zusätzlich die
// errechnete Uhrzeit je Schritt — dieselbe Herleitung wie in
// RoutineHeuteChecklist.jsx (routineSchrittZeit), hier nur zusätzlich mit
// Auf/Ab-Pfeilen und Löschen fürs Bearbeiten.
export default function RoutineSchritteListe({ routine, schritte, onEntfernen, onVerschieben, zeigeVerlauf = true }) {
  const { routineSchrittZeit } = useAppData();
  const sortiert = [...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const farbe = ROUTINE_FARBE[routine] || accentDark;

  if (sortiert.length === 0) {
    return (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch keine Schritte — leg oben den ersten an.</div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 14 }}>
      {sortiert.map((s, i) => {
        const zeit = routineSchrittZeit(s.id);
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < sortiert.length - 1 ? `1px solid ${cardBorder}` : "none",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onVerschieben(s.id, "hoch")}
                disabled={i === 0}
                style={{ border: "none", background: "transparent", color: i === 0 ? cardBorder : accentDark, fontSize: 14, cursor: i === 0 ? "default" : "pointer", padding: 0, lineHeight: 1.3 }}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => onVerschieben(s.id, "runter")}
                disabled={i === sortiert.length - 1}
                style={{ border: "none", background: "transparent", color: i === sortiert.length - 1 ? cardBorder : accentDark, fontSize: 14, cursor: i === sortiert.length - 1 ? "default" : "pointer", padding: 0, lineHeight: 1.3 }}
              >
                ▼
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                {zeit && <span style={{ color: farbe }}>{zeit} · </span>}
                {s.name}
              </div>
              <div style={{ fontSize: 13, color: textMuted, marginTop: 1 }}>{s.dauerMin} Min.</div>
              {zeigeVerlauf && <ItemVerlauf kategorie={ROUTINE_KATEGORIE[routine]} itemName={s.name} />}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`"${s.name}" endgültig aus der Routine entfernen?`)) return;
                onEntfernen(s.id);
              }}
              style={{ border: "none", background: "transparent", color: danger, fontSize: 22, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        );
      })}
    </Card>
  );
}
