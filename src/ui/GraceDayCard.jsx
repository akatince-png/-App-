import React from "react";
import { accent, cardBorder } from "./theme";

/**
 * GraceDayCard: Wochenrückblick mit Anti-Scham-Mechanismus
 *
 * Props:
 * - weeklyStats: { completedDays, missedDays, totalDays }
 * - motivationalMessage: Optional custom Message (sonst auto)
 *
 * Features:
 * - Visuelle Day Circles (grün für aktiv, grau für Pause)
 * - 50%+ Erfolg = "Erfolg" (nicht 100% erforderlich)
 * - Dynamische motivierende Messages basierend auf Completion Rate
 * - Anti-Blame-Messaging: "Pausen sind nicht Scheitern"
 * - ADHS-freundlich: Keine Bestrafung, keine Schuld
 */
export default function GraceDayCard({ weeklyStats = {}, motivationalMessage = null }) {
  const { completedDays = 0, missedDays = 0, totalDays = 7 } = weeklyStats;
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const getMotivationalMessage = () => {
    if (motivationalMessage) return motivationalMessage;

    if (completionRate >= 80) {
      return "🚀 Fantastisch! Eine sehr starke Woche.";
    } else if (completionRate >= 50) {
      return "💪 Sehr gut! 50%+ bedeutet: du machst das richtig.";
    } else if (completionRate >= 30) {
      return "🌱 Du machst kleine Fortschritte. Das zählt.";
    } else {
      return "💛 Kein Drama. Jeder Tag ist ein neuer Versuch.";
    }
  };

  const getMessageColor = () => {
    if (completionRate >= 80) return "#16A34A";
    if (completionRate >= 50) return "#0891B2";
    if (completionRate >= 30) return "#D97706";
    return "#6B7280";
  };

  return (
    <div
      style={{
        padding: "16px 14px",
        borderRadius: 14,
        background: "#FFF",
        border: `1px solid ${cardBorder}`,
        animation: "fadeInUp 0.5s ease-out",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 4,
          }}
        >
          Diese Woche
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: getMessageColor(),
          }}
        >
          {getMotivationalMessage()}
        </div>
      </div>

      {/* Day circles */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        {Array.from({ length: totalDays }).map((_, i) => {
          const isCompleted = i < completedDays;
          return (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isCompleted ? accent : cardBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: isCompleted ? "#fff" : "#9CA3AF",
                transition: "all 200ms ease-out",
              }}
            >
              {isCompleted ? "✓" : "–"}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: 10,
            background: "#F0FDF4",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            Aktive Tage
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#16A34A",
            }}
          >
            {completedDays}
          </div>
        </div>
        <div
          style={{
            padding: 10,
            background: "#F3F4F6",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            Pausen
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#9CA3AF",
            }}
          >
            {missedDays}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          textAlign: "center",
          marginTop: 12,
          fontStyle: "italic",
        }}
      >
        Pausen sind nicht Scheitern. Du machst das richtig. 💛
      </div>
    </div>
  );
}
