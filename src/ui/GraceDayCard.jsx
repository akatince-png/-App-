import React from "react";
import { Card } from "./primitives";
import { accent, cardBorder, success, successSoft, textMuted, warn, warnSoft } from "./theme";

// Wochenrückblick mit Anti-Scham-Mechanismus (App-Bauplan-Punkt,
// Gnadentag-/Vergebungsmechanik). War ursprünglich eine komplett
// eigenständige, nirgends verdrahtete Komponente mit hartcodierten
// Hex-Farben (Code-Audit Teil 5, 13.09., zu Recht als toter Code entfernt)
// — jetzt neu aufgebaut mit echten Daten (siehe utils/gnadentag.js,
// dieselbe Ist-geplant-Logik wie Tagesplan/ausgefallenSweep.js statt einer
// zweiten, unabhängigen Berechnung) und den theme.js-Tokens statt eigener
// Farbwerte, damit sich die Komponente stilistisch nicht mehr vom Rest der
// App abhebt.
//
// Kernidee bleibt dieselbe wie im Original: ab 50%+ erledigten Punkten
// gilt eine Woche schon als Erfolg (nicht erst bei 100%), und ein Tag mit
// wenig/nichts erledigt wird als "Pause" bezeichnet, nicht als Fehlschlag
// — passend zum Systemprompt des KI-Coaches ("motivierend statt
// beschämend", siehe aiService.js).
export default function GraceDayCard({ weeklyStats }) {
  const { completedDays = 0, pauseDays = 0, totalDays = 7 } = weeklyStats || {};
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const nachricht =
    totalDays === 0
      ? "🌱 Deine erste Woche läuft — ab morgen siehst du hier deinen Rückblick."
      : completionRate >= 80
      ? "🚀 Fantastisch! Eine sehr starke Woche."
      : completionRate >= 50
        ? "💪 Sehr gut! 50%+ bedeutet: du machst das richtig."
        : completionRate >= 30
          ? "🌱 Du machst kleine Fortschritte. Das zählt."
          : "💛 Kein Drama. Jeder Tag ist ein neuer Versuch.";

  const nachrichtFarbe = totalDays === 0 ? success : completionRate >= 50 ? success : completionRate >= 30 ? warn : textMuted;

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        Diese Woche
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: nachrichtFarbe, marginBottom: 12 }}>{nachricht}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
        {Array.from({ length: totalDays }).map((_, i) => {
          const istAktiv = i < completedDays;
          return (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: istAktiv ? accent : cardBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: istAktiv ? "#fff" : textMuted,
                flexShrink: 0,
              }}
            >
              {istAktiv ? "✓" : "–"}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: 10, background: successSoft, borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Aktive Tage</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: success }}>{completedDays}</div>
        </div>
        <div style={{ padding: 10, background: warnSoft, borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Pausen</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: warn }}>{pauseDays}</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: textMuted, textAlign: "center", marginTop: 10, fontStyle: "italic" }}>
        Pausen sind nicht Scheitern. Du machst das richtig. 💛
      </div>
    </Card>
  );
}
