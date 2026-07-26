import React, { useState } from "react";

/**
 * QuickTaskList: One-Tap Task Check-ins mit Micro-Interactions
 *
 * Props:
 * - items: Array von { key, name, detail, done, kategorie, onToggle }
 * - maxItems: Wie viele anzeigen (default: 4)
 * - soundEnabled: Audio-Feedback bei Completion (default: true)
 *
 * Features:
 * - Große Tap-Ziele (min. 44x44px) für ADHS-Zugänglichkeit
 * - Scale-Animation beim Drücken
 * - Sparkles-Animation bei Completion
 * - Optional Sound-Feedback (750Hz beep, 80ms)
 * - Dopamine-Hit durch visuelle Bestätigung
 */
export default function QuickTaskList({ items = [], maxItems = 4, soundEnabled = true }) {
  const displayItems = items.slice(0, maxItems);
  const [completingKey, setCompletingKey] = useState(null);

  const handleToggle = (item) => {
    // Trigger animation
    setCompletingKey(item.key);
    setTimeout(() => setCompletingKey(null), 600);

    // Play sound if enabled
    if (soundEnabled && !item.done) {
      playSuccessSound();
    }

    // Call the item's toggle handler
    item.onToggle();
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 750;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
      // Audio context not available, silently fail
    }
  };

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {displayItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleToggle(item)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 16px",
            borderRadius: 14,
            border: item.done ? "none" : "2px solid #E5E7EB",
            background: item.done
              ? "linear-gradient(135deg, #F0FDF4, #DBEAFE)"
              : "#fff",
            cursor: "pointer",
            transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            minHeight: "56px",
            textAlign: "left",
            transform: completingKey === item.key ? "scale(0.96)" : "scale(1)",
            boxShadow: item.done
              ? "0 4px 12px rgba(16, 185, 129, 0.15)"
              : "0 2px 4px rgba(0, 0, 0, 0.05)",
            animation: completingKey === item.key ? "slideInSuccess 0.6s ease-out" : "none",
          }}
        >
          {/* Checkbox */}
          <div
            style={{
              width: 28,
              height: 28,
              minWidth: 28,
              borderRadius: 8,
              border: `2px solid ${item.done ? "#10B981" : "#D1D5DB"}`,
              background: item.done ? "linear-gradient(135deg, #10B981, #059669)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              animation: item.done && completingKey === item.key ? "successPulse 0.6s ease-out" : "none",
              boxShadow: item.done ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
            }}
          >
            {item.done && <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>✓</span>}
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: item.done ? "#9CA3AF" : "#1F2937",
                textDecoration: item.done ? "line-through" : "none",
                transition: "all 200ms ease-out",
                lineHeight: 1.3,
              }}
            >
              {item.name}
            </div>
            {item.detail && (
              <div
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {item.detail}
              </div>
            )}
          </div>

          {/* Category badge */}
          {item.kategorie && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "6px 10px",
                borderRadius: 6,
                background: getCategoryColor(item.kategorie),
                color: "#fff",
                whiteSpace: "nowrap",
                transition: "all 200ms ease-out",
              }}
            >
              {getCategoryLabel(item.kategorie)}
            </div>
          )}

          {/* Completion indicator */}
          {item.done && completingKey === item.key && (
            <div
              style={{
                animation: "pulse 0.6s ease-out",
              }}
            >
              ✨
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function getCategoryColor(kategorie) {
  const colors = {
    medikament: "rgba(239, 68, 68, 0.8)",
    hormon: "rgba(236, 72, 153, 0.8)",
    supplement: "rgba(59, 130, 246, 0.8)",
    hydration: "rgba(6, 182, 212, 0.8)",
    ernährung: "rgba(168, 85, 247, 0.8)",
    training: "rgba(34, 197, 94, 0.8)",
    gewohnheit: "rgba(251, 146, 60, 0.8)",
    schlaf: "rgba(99, 102, 241, 0.8)",
  };
  return colors[kategorie] || "rgba(107, 114, 128, 0.8)";
}

function getCategoryLabel(kategorie) {
  const labels = {
    medikament: "Med",
    hormon: "Hor",
    supplement: "Sup",
    hydration: "💧",
    ernährung: "🍽️",
    training: "💪",
    gewohnheit: "🎯",
    schlaf: "😴",
  };
  return labels[kategorie] || kategorie.substring(0, 3);
}
