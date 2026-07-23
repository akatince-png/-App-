import React from "react";
import { textMain, textMuted } from "./theme";

// Zentrale Logo-Komponente — ersetzt die bisher an drei Stellen
// (LoginView, WelcomeView, HomeView) einzeln hardcodierte Gradient-Box
// mit 🧬-Emoji durch die echte Marke (public/logo-mark.svg).
export default function Logo({ size = 56, withWordmark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: withWordmark ? 12 : 0 }}>
      <img src="/logo-mark.svg" alt="MyProtocols" width={size} height={size} style={{ display: "block", flexShrink: 0 }} />
      {withWordmark && (
        <div>
          <div style={{ fontSize: size * 0.34, fontWeight: 800, color: textMain, lineHeight: 1.1 }}>MyProtocols</div>
          <div style={{ fontSize: size * 0.15, color: textMuted, fontWeight: 600 }}>Health. Organized.</div>
        </div>
      )}
    </div>
  );
}
