import React from "react";
import { Card, StatusBadge } from "./primitives";
import { cardBorder, textMuted } from "./theme";
import { toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const ROUTINE_FARBE = { morgen: "#E08A3E", abend: "#4E6690" };
const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };

// Direkte Tages-Checkliste für Morgen-/Abendroutine (12.09.,
// Nutzerin-Vorgabe): zeigt AUSSCHLIESSLICH die echten, konfigurierten
// Schritte dieser Routine — Zeit für Zeit, mit je einem eigenen
// Bestätigungs-Haken direkt daneben. Bewusst KEIN Navigieren zu einer
// anderen Seite und KEIN Öffnen des Schritte-Editors ("als würde ich die
// Maske bearbeiten wollen") — reines Abhaken, inline auf der Startseite,
// unabhängig vom geführten "Routine starten"-Ablauf (RoutineAblauf.jsx),
// der für alle, die lieber Schritt für Schritt mit Timer durchgehen,
// weiterhin unverändert verfügbar bleibt.
export default function RoutineHeuteChecklist({ routine }) {
  const { routineSchritte, routineSchrittErledigt, routineSchrittZeit, routineSchrittErledigtUmschalten } = useAppData();
  const heute = toLocalISODate(new Date());
  const schritte = routineSchritte.filter((s) => s.routine === routine).sort((a, b) => a.reihenfolge - b.reihenfolge);
  const farbe = ROUTINE_FARBE[routine];

  if (schritte.length === 0) {
    return (
      <Card style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12.5, color: textMuted, textAlign: "center" }}>
          Für die {ROUTINE_LABEL[routine]} sind noch keine Schritte eingerichtet.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 8 }}>
      {schritte.map((s, i) => {
        const zeit = routineSchrittZeit(s.id);
        const done = !!routineSchrittErledigt[`${heute}__${s.id}`];
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "9px 0",
              borderBottom: i < schritte.length - 1 ? `1px solid ${cardBorder}` : "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                {zeit && <span style={{ color: farbe, fontWeight: 800 }}>{zeit} · </span>}
                {s.name}
              </div>
            </div>
            {done ? (
              <StatusBadge status="erledigt" />
            ) : (
              <button
                type="button"
                onClick={() => routineSchrittErledigtUmschalten(s.id, heute)}
                style={{
                  flexShrink: 0,
                  padding: "7px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: farbe,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Bestätigen
              </button>
            )}
          </div>
        );
      })}
    </Card>
  );
}
