import React from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { accent, accentDark, accentSoft, blue, textMuted } from "../../ui/theme";

// Abschluss-Screen nach dem Onboarding — ersetzt den bisherigen stillen
// Sprung zum Dashboard mit einem echten, positiven Abschluss-Moment.
// `eingerichteteBereiche`: Array aus { icon, label } — nur tatsächlich
// ausgefüllte Bereiche, übersprungene tauchen bewusst nicht auf (keine
// "0 von 8"-Beschämung).
export default function OnboardingCompletionView({ eingerichteteBereiche, onDone }) {
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            marginBottom: 20,
            boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
          }}
        >
          🎉
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
          Herzlichen Glückwunsch — deine Pläne sind eingerichtet!
        </div>
        <div style={{ fontSize: 14, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
          Du musst dir jetzt nichts mehr merken — dein Tagesplan zeigt dir ab jetzt jeden Tag, was ansteht.
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 10 }}>Eingerichtet:</div>
        {eingerichteteBereiche.map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: accentSoft,
                color: accentDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {b.icon} {b.label}
            </div>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
        Die restlichen Bereiche kannst du jederzeit später über das Dashboard einrichten.
      </div>

      <Card>
        <PrimaryButton onClick={onDone} variant="success">
          Los geht's
        </PrimaryButton>
      </Card>
    </Shell>
  );
}
