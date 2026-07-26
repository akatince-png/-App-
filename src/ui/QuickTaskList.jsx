import React, { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

/**
 * QuickTaskList: Optimiert für One-Tap Check-ins mit ADHS-Micro-Interactions
 *
 * Props:
 * - items: Array von { key, name, kategorie, done, onToggle }
 * - maxItems: wie viele Items anzeigen (default 4)
 * - soundEnabled: Audio-Feedback bei Completion (optional)
 *
 * Änderungen für ADHS:
 * - Großer Tap-Bereich (padding)
 * - Active State Feedback (scale)
 * - Sparkles Animation bei Completion
 * - Keine Touch-Verzögerung
 * - Visuelle Bestätigung (Grün = Erledigt)
 */
export default function QuickTaskList({ items = [], maxItems = 4, soundEnabled = true }) {
  const [justCompleted, setJustCompleted] = useState(null);

  const playTinyBeep = () => {
    if (soundEnabled && typeof window !== "undefined") {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 750;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } catch (e) {
        // Silent fail wenn AudioContext nicht verfügbar
      }
    }
  };

  const handleToggle = (item) => {
    if (!item.done) {
      playTinyBeep();
      setJustCompleted(item.key);
      setTimeout(() => setJustCompleted(null), 600);
    }
    item.onToggle?.();
  };

  const displayItems = items.slice(0, maxItems);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      {displayItems.map((item, idx) => (
        <button
          key={item.key}
          onClick={() => handleToggle(item)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 14px",
            borderRadius: "12px",
            border: "1px solid",
            background: item.done
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(148, 163, 184, 0.04)",
            borderColor: item.done
              ? "rgba(16, 185, 129, 0.3)"
              : "rgba(100, 116, 139, 0.15)",
            cursor: "pointer",
            transition: "all 150ms ease-out",
            transform: "scale(1)",
            // CSS-Klasse für Animations
            animation: justCompleted === item.key ? "slideInSuccess 0.4s ease-out" : "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {/* CHECKBOX CIRCLE */}
          <div
            style={{
              width: "22px",
              height: "22px",
              minWidth: "22px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid",
              borderColor: item.done ? "#10B981" : "#94A3B8",
              background: item.done ? "#10B981" : "transparent",
              transition: "all 150ms ease-out",
              boxShadow: item.done ? "0 0 8px rgba(16, 185, 129, 0.3)" : "none",
            }}
          >
            {item.done && (
              <CheckCircle2 size={14} color="#1F2937" strokeWidth={3} />
            )}
          </div>

          {/* TASK INFO */}
          <div
            style={{
              flex: 1,
              textAlign: "left",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: item.done ? "#64748B" : "#E2E8F0",
                textDecoration: item.done ? "line-through" : "none",
                transition: "color 150ms ease-out",
              }}
            >
              {item.name}
            </div>
            {item.detail && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#94A3B8",
                  marginTop: "2px",
                }}
              >
                {item.detail}
              </div>
            )}
          </div>

          {/* SUCCESS INDICATOR */}
          {item.done && (
            <Sparkles
              size={16}
              color="#10B981"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
