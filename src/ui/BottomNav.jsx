import React from "react";
import { accent, accentDark, card, cardBorder, textMuted } from "./theme";

const ITEMS = [
  { id: "home", label: "Übersicht", icon: "🗓️" },
  { id: "tagesplan", label: "Tagesplan", icon: "📅" },
  { id: "__fab__", label: "", icon: "+" },
  { id: "routinen", label: "Gewohnheiten", icon: "🌱" },
  { id: "mehr", label: "Mehr", icon: "⚙️" },
];

// Feste untere Tab-Leiste (Konzept-4B-Redesign) — ersetzt das bisherige
// reine "Kachel-Dashboard" als primäre Navigation. Bleibt bewusst auf
// jedem authentifizierten Screen sichtbar (außer im Onboarding-Assistenten),
// auch innerhalb der Pläne-/Archiv-Hubs, damit man jederzeit direkt zu
// einem der 4 Hauptbereiche zurück kann statt über "Zuhause" umzuwegen.
export default function BottomNav({ active, onNavigate, onFab }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "8px 8px calc(8px + env(safe-area-inset-bottom, 0px))",
          background: card,
          borderTop: `1px solid ${cardBorder}`,
          pointerEvents: "auto",
        }}
      >
        {ITEMS.map((item) => {
          if (item.id === "__fab__") {
            return (
              <button
                key="fab"
                className="mp-tap"
                onClick={onFab}
                aria-label="Neues Protokoll"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  border: "none",
                  background: accentDark,
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 14px rgba(10, 95, 79, 0.35)",
                  marginTop: -20,
                }}
              >
                +
              </button>
            );
          }
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              className="mp-tap"
              onClick={() => onNavigate(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "4px 6px",
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 18, opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? accent : textMuted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
