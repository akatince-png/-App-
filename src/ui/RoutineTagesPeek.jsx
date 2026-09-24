import React from "react";
import RoutineHeuteChecklist from "./RoutineHeuteChecklist";
import { useEscapeSchliesst } from "./useEscapeSchliesst";
import { textMain, textMuted } from "./theme";
import { fmtDate, parseLocalISODate } from "../utils/dates";

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_EMOJI = { morgen: "🌅", abend: "🌙" };

// Bottom-Sheet zum "Reingucken" in eine Morgen-/Abendroutine direkt aus
// Tagesplan/Wochenübersicht/Monatsansicht heraus (Nutzerin-Vorgabe, 17.09.:
// "die ganze Routine pro Tag, aber draufklicken und die Einzelschritte
// einsehen können" — ausdrücklich auch OHNE die Routine zu starten: "ich
// möchte morgens reingucken können, wie war meine Routine noch mal").
// Nutzt dieselbe Checkliste wie die Startseite (RoutineHeuteChecklist,
// jetzt mit `datum`-Prop) statt eine zweite Ansicht zu bauen — Bestätigen
// funktioniert hier genauso, auch für vergangene Tage.
export default function RoutineTagesPeek({ routine, datum, onClose }) {
  useEscapeSchliesst(onClose);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(21, 24, 26, 0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px 22px 0 0",
          padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: textMain }}>
              {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]}
            </div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{fmtDate(parseLocalISODate(datum))}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 20, color: textMuted, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
        <RoutineHeuteChecklist routine={routine} datum={datum} />
      </div>
    </div>
  );
}
