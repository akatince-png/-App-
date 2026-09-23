import React, { useMemo } from "react";
import { Card } from "./primitives";
import { textMuted } from "./theme";
import { leseStartzeiten, sekunden } from "../utils/startzeit";

// Zeigt unter "Mehr", wie schnell die App auf DIESEM Gerät startet
// (Messung: utils/startzeit.js).
export default function AppTempoKarte() {
  const liste = useMemo(() => leseStartzeiten(), []);
  if (liste.length === 0) return null;
  const letzte = liste[0];
  const schnitt = Math.round(liste.reduce((s, m) => s + m.ms, 0) / liste.length);
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>⏱️ App-Tempo</div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>
          Letzter Start: {sekunden(letzte.ms)} <span style={{ fontWeight: 500, color: textMuted }}>({letzte.typ})</span>
        </div>
        {liste.length > 1 && (
          <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>
            Durchschnitt der letzten {liste.length} Starts: {sekunden(schnitt)}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8, lineHeight: 1.5 }}>
          Gemessen auf diesem Gerät, bis die Startseite erscheint — „Öffnen“ heißt: du warst schon angemeldet.
        </div>
      </Card>
    </>
  );
}
