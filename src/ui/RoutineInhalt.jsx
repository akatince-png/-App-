import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import RoutineSchritteEditor from "./RoutineSchritteEditor";
import RoutineSchritteListe, { LichtZeile } from "./RoutineSchritteListe";
import { istLichtSchritt } from "../utils/sonne";

// Inhalt einer aufgeklappten Routine im Bild-Tagesplan (25.10., Nutzerin:
// „alle Bestandteile ersichtlich und direkt bearbeiten“). Erst die Schritte
// mit Häkchen-Stand, auf Wunsch darunter der Editor wie in der Liste.
export default function RoutineInhalt({ routine, status }) {
  const { routineSchritte = [], routineSchrittZeit, routineSchrittHinzufuegen, routineSchrittEntfernen, routineSchrittVerschieben } = useAppData();
  const [bearbeiten, setBearbeiten] = useState(false);
  const schritte = status?.schritte || [];
  return (
    <div>
      {!schritte.length && <div style={{ fontSize: 12.5, color: "var(--mp-text-muted)", marginBottom: 6 }}>Für diesen Tag sind noch keine Schritte eingerichtet.</div>}
      {!bearbeiten && schritte.length > 0 && (
        <ol data-routine-schritte style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
          {schritte.map((s) => {
            const fertig = status.schrittIstErledigt(s.id);
            return (
              <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                <span aria-hidden="true" style={{ width: 18, textAlign: "center" }}>{fertig ? "✅" : "○"}</span>
                <span style={{ flex: 1, minWidth: 0, textDecoration: fertig ? "line-through" : "none", opacity: fertig ? 0.6 : 1 }}>
                  {s.kurz ? "⚡ " : ""}
                  {s.name}
                  {routine === "morgen" && istLichtSchritt(s) && !fertig && <LichtZeile zeit={routineSchrittZeit?.(s.id)} />}
                </span>
                {Number(s.dauerMin) > 0 && <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{s.dauerMin} Min</span>}
              </li>
            );
          })}
        </ol>
      )}
      {bearbeiten && (
        <>
          <RoutineSchritteEditor routine={routine} schritte={routineSchritte.filter((s) => s.routine === routine)} onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen?.(routine, name, dauerMin)} />
          <RoutineSchritteListe routine={routine} schritte={routineSchritte.filter((s) => s.routine === routine)} onEntfernen={routineSchrittEntfernen} onVerschieben={routineSchrittVerschieben} />
        </>
      )}
      <button
        type="button"
        data-routine-bearbeiten
        onClick={() => setBearbeiten((b) => !b)}
        style={{ marginTop: 8, border: "none", background: "transparent", padding: "4px 0", fontSize: 13, fontWeight: 800, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}
      >
        {bearbeiten ? "✓ Fertig mit Bearbeiten" : "✏️ Schritte bearbeiten"}
      </button>
    </div>
  );
}
