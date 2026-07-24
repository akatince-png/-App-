import React from "react";
import Icon from "./Icon";
import { accent, card, cardBorder, textMuted } from "./theme";

const ITEMS = [
  { id: "home", label: "Übersicht", icon: "grid" },
  { id: "tagesplan", label: "Tagesplan", icon: "calendarCheck" },
  { id: "routinen", label: "Gewohnheiten", icon: "target" },
  { id: "mehr", label: "Mehr", icon: "sliders" },
];

// Feste untere Tab-Leiste (Konzept-4B-Redesign) — ersetzt das bisherige
// reine "Kachel-Dashboard" als primäre Navigation. Bleibt bewusst auf
// jedem authentifizierten Screen sichtbar (außer im Onboarding-Assistenten),
// auch innerhalb der Pläne-/Archiv-Hubs, damit man jederzeit direkt zu
// einem der 4 Hauptbereiche zurück kann statt über "Zuhause" umzuwegen.
// Der frühere "+"-FAB (Neues Protokoll) ist entfernt — der Einstiegspunkt
// liegt jetzt als normaler Menüpunkt in "Mehr", und der Tagesplan hat einen
// eigenen Schnellzugriff direkt auf der Startseite.
export default function BottomNav({ active, onNavigate }) {
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
              <Icon name={item.icon} size={20} color={isActive ? accent : textMuted} strokeWidth={isActive ? 2.1 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? accent : textMuted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
