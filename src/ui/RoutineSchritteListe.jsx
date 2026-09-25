import React, { useState } from "react";
import { Card } from "./primitives";
import { accentDark, cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { ROUTINE_META } from "../utils/dayItems";
import ItemVerlauf from "./ItemVerlauf";
import { pauseFuer } from "../utils/kernprogramm";
import { toLocalISODate } from "../utils/dates";

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
  const { routineSchrittZeit, routineSchrittAendern, routineKernPausen = [] } = useAppData();
  // Pflicht-Bausteine des Kernprogramms (25.09.): 🔒 statt ×, dafür Name
  // und Dauer frei einstellbar. Pausieren kann nur der Coach.
  const [bearbeiten, setBearbeiten] = useState(null);
  const heute = toLocalISODate(new Date());
  const pausiertBis = (s) => {
    const p = s.kernKey && pauseFuer(routineKernPausen, s.kernKey, heute);
    return p ? new Date(`${p.bis}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : null;
  };
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
              <div style={{ fontSize: 13, color: textMuted, marginTop: 1 }}>
                {s.dauerMin} Min.
                {s.kernKey && " · 🔒 gehört zum Kernprogramm"}
                {pausiertBis(s) && ` · ⏸ vom Coach pausiert bis ${pausiertBis(s)}`}
              </div>
              {bearbeiten?.id === s.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    aria-label="Name des Schritts"
                    value={bearbeiten.name}
                    onChange={(e) => setBearbeiten((b) => ({ ...b, name: e.target.value }))}
                    style={{ flex: "1 1 160px", border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <input
                    aria-label="Dauer in Minuten"
                    type="number"
                    min={1}
                    value={bearbeiten.dauerMin}
                    onChange={(e) => setBearbeiten((b) => ({ ...b, dauerMin: e.target.value }))}
                    style={{ width: 64, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await routineSchrittAendern?.(s.id, { name: bearbeiten.name, dauerMin: bearbeiten.dauerMin });
                      if (r?.ok) setBearbeiten(null);
                    }}
                    style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: accentDark, color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Speichern
                  </button>
                </div>
              )}
              {zeigeVerlauf && <ItemVerlauf kategorie={ROUTINE_KATEGORIE[routine]} itemName={s.name} />}
            </div>
            {s.kernKey ? (
              <button
                type="button"
                aria-label={`${s.name} einstellen`}
                onClick={() => setBearbeiten(bearbeiten?.id === s.id ? null : { id: s.id, name: s.name, dauerMin: s.dauerMin })}
                style={{ border: "none", background: "transparent", color: accentDark, fontSize: 17, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
              >
                🔒✎
              </button>
            ) : (
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
            )}
          </div>
        );
      })}
    </Card>
  );
}
