import React from "react";
import { ShieldAlert } from "lucide-react";

/**
 * ADHSModeToggle: Notfallmodus für Tage mit exekutiver Dysfunktion
 *
 * Props:
 * - isEmergencyMode: boolean
 * - onToggle: (newState) => void
 *
 * Änderungen für ADHS:
 * - Großer, leicht erreichbarer Button
 * - Klare Farb-Rückmeldung (Amber bei Aktivierung)
 * - Sanfte Animationen, keine Überflutung
 * - LocalStorage-Persistierung (bleibt über Neuladen erhalten)
 */
export default function ADHSModeToggle({ isEmergencyMode = false, onToggle }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      marginBottom: "16px",
      background: isEmergencyMode ? "rgba(180, 83, 9, 0.08)" : "rgba(15, 23, 42, 0.5)",
      border: isEmergencyMode ? "1px solid rgba(217, 119, 6, 0.3)" : "1px solid rgba(100, 116, 139, 0.2)",
      borderRadius: "12px",
      transition: "all 200ms ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ShieldAlert
          size={18}
          color={isEmergencyMode ? "#D97706" : "#64748B"}
          style={{ transition: "color 200ms ease-out" }}
        />
        <div>
          <div style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Modus
          </div>
          <div style={{
            fontSize: "13px",
            fontWeight: "700",
            color: isEmergencyMode ? "#D97706" : "#E2E8F0",
            marginTop: "2px",
          }}>
            {isEmergencyMode ? "🆘 Nur Basics" : "✨ Vollmodus"}
          </div>
        </div>
      </div>

      <button
        onClick={() => onToggle(!isEmergencyMode)}
        style={{
          padding: "8px 14px",
          fontSize: "12px",
          fontWeight: "700",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: isEmergencyMode
            ? "rgba(217, 119, 6, 0.2)"
            : "rgba(100, 116, 139, 0.2)",
          color: isEmergencyMode ? "#D97706" : "#64748B",
          transition: "all 150ms ease-out",
          transform: "scale(1)",
        }}
        onMouseDown={(e) => {
          // Active state Feedback
          e.currentTarget.style.transform = "scale(0.95)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isEmergencyMode ? "→ Normal" : "💤 Notfall?"}
      </button>
    </div>
  );
}
