import React from "react";
import { Heart, RotateCcw } from "lucide-react";

/**
 * GraceDayCard: Wochenrückblick mit Anti-Scham-Mechanismus
 *
 * Props:
 * - weeklyStats: { completedDays: number, missedDays: number, totalDays: 7 }
 * - motivationalMessage: optional custom message
 *
 * Änderungen für ADHS:
 * - Keine Schuldgefühle für "verpasste" Tage
 * - 50%+ Erfolg = "erfolgreich" (nicht 100%!)
 * - Grün für Aktiv, Grau für Pause (nicht Rot!)
 * - Warme, unterstützende Tonalität
 */
export default function GraceDayCard({
  weeklyStats = { completedDays: 4, missedDays: 3, totalDays: 7 },
  motivationalMessage = null,
}) {
  const completionRate = Math.round(
    (weeklyStats.completedDays / weeklyStats.totalDays) * 100
  );
  const isAcceptable = completionRate >= 50;

  const getMessage = () => {
    if (motivationalMessage) return motivationalMessage;

    if (completionRate >= 80) return "🚀 Fantastisch! Eine sehr starke Woche.";
    if (completionRate >= 50)
      return "💪 Sehr gut! 50%+ bedeutet: du machst das richtig.";
    if (completionRate >= 30) return "🌱 Du machst kleine Fortschritte. Das zählt.";
    return "💛 Kein Drama. Jeder Tag ist ein neuer Versuch.";
  };

  return (
    <div
      style={{
        padding: "20px",
        marginBottom: "16px",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: "16px",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Heart size={18} color="#F472B6" />
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#E2E8F0",
              margin: 0,
            }}
          >
            Wochenrückblick
          </h3>
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "#94A3B8",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Das ist dein realer Rhythmus. Nicht gut oder schlecht.
        </p>
      </div>

      {/* VISUAL DAY CIRCLES */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}
        >
          Tage dieser Woche
        </p>
        <div style={{ display: "flex", gap: "6px", justifyContent: "space-between" }}>
          {Array.from({ length: weeklyStats.totalDays }).map((_, i) => {
            const isCompleted = i < weeklyStats.completedDays;
            return (
              <div
                key={i}
                style={{
                  width: "100%",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                  border: "1px solid",
                  background: isCompleted
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(100, 116, 139, 0.08)",
                  borderColor: isCompleted
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(100, 116, 139, 0.2)",
                  color: isCompleted ? "#10B981" : "#94A3B8",
                  transition: "all 200ms ease-out",
                  cursor: "default",
                }}
                title={isCompleted ? "Aktiv ✓" : "Pause"}
              >
                {isCompleted ? "✓" : "○"}
              </div>
            );
          })}
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        <div
          style={{
            padding: "10px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px 0" }}>
            Aktiv
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#10B981",
              margin: 0,
            }}
          >
            {weeklyStats.completedDays}
          </p>
        </div>
        <div
          style={{
            padding: "10px",
            background: "rgba(100, 116, 139, 0.08)",
            border: "1px solid rgba(100, 116, 139, 0.2)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px 0" }}>
            Pause
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#94A3B8",
              margin: 0,
            }}
          >
            {weeklyStats.missedDays}
          </p>
        </div>
        <div
          style={{
            padding: "10px",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px 0" }}>
            Quote
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#3B82F6",
              margin: 0,
            }}
          >
            {completionRate}%
          </p>
        </div>
      </div>

      {/* STATUS MESSAGE */}
      <div
        style={{
          padding: "12px",
          marginBottom: "12px",
          background: isAcceptable
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(59, 130, 246, 0.1)",
          border: isAcceptable
            ? "1px solid rgba(16, 185, 129, 0.2)"
            : "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "8px",
          color: isAcceptable ? "#86EFAC" : "#93C5FD",
          fontSize: "13px",
          fontWeight: "500",
          lineHeight: "1.5",
        }}
      >
        {getMessage()}
      </div>

      {/* GRACE MESSAGE */}
      <div
        style={{
          padding: "12px",
          background: "rgba(148, 163, 184, 0.08)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: "8px",
          display: "flex",
          gap: "10px",
        }}
      >
        <RotateCcw size={14} color="#94A3B8" style={{ marginTop: "2px", flexShrink: 0 }} />
        <p
          style={{
            fontSize: "12px",
            color: "#CBD5E1",
            lineHeight: "1.5",
            margin: 0,
          }}
        >
          <strong>Wichtig:</strong> Mit ADHS sind Pausen nicht Scheitern. Sie sind dein
          Körper, der sagt: "Verschnauf mal." Morgen ist ein neuer Versuch. Keine
          Schuldgefühle.
        </p>
      </div>
    </div>
  );
}
