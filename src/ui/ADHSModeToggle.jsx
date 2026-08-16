import React from "react";

/**
 * ADHSModeToggle: Großer, prominenter Notfallmodus für Tage mit exekutiver Dysfunktion
 *
 * Props:
 * - isEmergencyMode: boolean
 * - onToggle: (newState) => void
 * - compact: boolean — schmalere Variante ohne Pfeil-Indikator, für die
 *   Knopf-Reihe neben AkutModusTrigger (HomeView.jsx, 16.08.)
 *
 * Features:
 * - Großer, leicht erreichbarer Button (min 50px Höhe)
 * - Klare Farb-Rückmeldung (Rot bei Aktivierung für Notfall)
 * - Deutliche Animationen
 * - LocalStorage-Persistierung
 */
export default function ADHSModeToggle({ isEmergencyMode = false, onToggle, compact = false }) {
  return (
    <button
      onClick={() => onToggle(!isEmergencyMode)}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: compact ? "flex-start" : "space-between",
        gap: 14,
        padding: compact ? "14px 16px" : "18px 20px",
        marginBottom: compact ? 0 : "18px",
        background: isEmergencyMode
          ? "linear-gradient(135deg, #DC2626, #EF4444)"
          : "linear-gradient(135deg, #6366F1, #818CF8)",
        border: "none",
        borderRadius: "16px",
        cursor: "pointer",
        transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isEmergencyMode
          ? "0 10px 25px rgba(220, 38, 38, 0.25)"
          : "0 8px 16px rgba(99, 102, 249, 0.15)",
        transform: "scale(1)",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, textAlign: "left" }}>
        <div style={{
          fontSize: compact ? "24px" : "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: compact ? "28px" : "40px",
        }}>
          {isEmergencyMode ? "🆘" : "✨"}
        </div>
        <div>
          {!compact && (
            <div style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "2px",
            }}>
              {isEmergencyMode ? "NOTFALL-MODUS" : "Normalmodus"}
            </div>
          )}
          <div style={{
            fontSize: compact ? "13.5px" : "16px",
            fontWeight: "800",
            color: "#fff",
            lineHeight: 1.25,
          }}>
            {isEmergencyMode ? "Nur Basics heute" : "Vollständige Ansicht"}
          </div>
        </div>
      </div>

      {!compact && (
        <div style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#fff",
        }}>
          {isEmergencyMode ? "→" : "↓"}
        </div>
      )}
    </button>
  );
}
