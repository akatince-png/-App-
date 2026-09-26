import React, { useState } from "react";
import { cardBorder, textMuted } from "./theme";
import { MESS_MINDEST, fmtDauer, messAuswertung, trainingAuswertung } from "../utils/messwoche";

// Ergebnis der Messwoche (26.09.): je Routine Ø Gesamtdauer und Ø je Schritt
// mit Vorschlag (Ø + 15 %). Ab 3 Messungen je Schritt "✓ übernehmen" – setzt
// die geplante Dauer des Schritts. Gleiche Ansicht für Coach und Coachee.
const ROUTINE = { morgen: "🌅 Morgenroutine", abend: "🌙 Abendroutine" };

export default function MesswocheAuswertung({ durchlaeufe = [], schritte = [], trainings = [], von, bis, onUebernehmen }) {
  const [erledigt, setErledigt] = useState({});
  const training = trainingAuswertung(trainings, von, bis);
  const uebernehmen = async (s) => {
    const r = await onUebernehmen?.(s.schrittId, s.vorschlagMin);
    if (r?.ok !== false) setErledigt((x) => ({ ...x, [s.schrittId]: true }));
  };
  const alleUebernehmen = async (a) => {
    for (const s of a.schritte.filter((x) => x.bereit && x.schrittId && !erledigt[x.schrittId] && x.geplantMin !== x.vorschlagMin)) await uebernehmen(s);
  };

  return (
    <div aria-label="Messwoche Ergebnis">
      {["morgen", "abend"].map((routine) => {
        const a = messAuswertung(durchlaeufe, routine, von, bis, schritte.filter((s) => s.routine === routine));
        const offen = a.schritte.filter((s) => s.bereit && s.schrittId && !erledigt[s.schrittId] && s.geplantMin !== s.vorschlagMin);
        return (
          <div key={routine} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <b style={{ fontSize: 14 }}>{ROUTINE[routine]}</b>
              <span style={{ fontSize: 12, color: textMuted }}>
                {a.anzahl} von {MESS_MINDEST} Messungen{a.bereit ? " ✓" : ""}
              </span>
            </div>
            {a.anzahl === 0 ? (
              <div style={{ fontSize: 12.5, color: textMuted }}>Noch keine Messung – im geführten Ablauf „Routine starten“ wird automatisch gestoppt.</div>
            ) : (
              <>
                <div style={{ fontSize: 13, margin: "3px 0 6px" }}>
                  Ø gesamt <b>{fmtDauer(a.avgGesamtSek)}</b> (kürzeste {fmtDauer(a.minGesamtSek)}, längste {fmtDauer(a.maxGesamtSek)})
                  {a.bereit && <> · Vorschlag: <b>{a.vorschlagGesamtMin} Min.</b> einplanen</>}
                </div>
                {a.schritte.map((s) => (
                  <div key={s.schrittId || s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "5px 0", borderTop: `1px solid ${cardBorder}`, fontSize: 12.5 }}>
                    <div style={{ minWidth: 0 }}>
                      <b>{s.name}</b>
                      <div style={{ color: textMuted }}>
                        Ø {fmtDauer(s.avgSek)} ({s.anzahl}×) · geplant {s.geplantMin ?? "–"} Min.
                      </div>
                    </div>
                    {s.bereit && s.schrittId && onUebernehmen ? (
                      erledigt[s.schrittId] || s.geplantMin === s.vorschlagMin ? (
                        <span style={{ fontWeight: 800, color: "#1E8E5A", whiteSpace: "nowrap" }}>✓ {s.vorschlagMin} Min.</span>
                      ) : (
                        <button type="button" onClick={() => uebernehmen(s)} style={{ border: "none", borderRadius: 10, padding: "6px 10px", background: "#1B2350", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          ✓ {s.vorschlagMin} Min. übernehmen
                        </button>
                      )
                    ) : (
                      <span style={{ color: textMuted, whiteSpace: "nowrap" }}>{s.bereit ? `${s.vorschlagMin} Min.` : `noch ${MESS_MINDEST - s.anzahl}× messen`}</span>
                    )}
                  </div>
                ))}
                {offen.length > 1 && onUebernehmen && (
                  <button type="button" onClick={() => alleUebernehmen(a)} style={{ marginTop: 6, border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    Alle {offen.length} Vorschläge übernehmen
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 12.5, borderTop: `1px solid ${cardBorder}`, paddingTop: 6 }}>
        <b>🏋️ Training:</b> {training.anzahl ? `Ø ${training.avgMin} Min. (${training.anzahl}×)` : "noch keine Einheit mit Dauer"}
      </div>
    </div>
  );
}
