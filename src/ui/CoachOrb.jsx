import React from "react";

// Animierte "digitale" Kreis-Grafik für den KI-Coach — Trigger-Icon und
// Live-Anzeige des Gesprächszustands statt eines statischen Buttons,
// angelehnt an die Sprachmodus-Optik moderner KI-Apps (Gemini, ChatGPT).
// zustand: "ruhe" (Standard) | "hoert" (Mikrofon aktiv) | "denkt"
// (Antwort wird geladen) | "spricht" (Antwort kommt/wird vorgelesen)
export default function CoachOrb({ zustand = "ruhe", size = 40 }) {
  return (
    <div
      className={`mp-orb mp-orb-${zustand}`}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}
