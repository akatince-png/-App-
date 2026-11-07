import React from "react";
import { cardBorder, danger, textMuted } from "./theme";

// Zeitprotokoll eines Routine-Durchlaufs (07.11., Nutzerin: „Wecker auf 7,
// ich beginne erst um 9 … wann ich einen Prozess starte und beende, z. B.
// Duschen nach 3 Minuten beendet … noch detaillierter“): Aufwachen, Beginn,
// je Schritt Uhrzeit von–bis und Dauer, in der wirklich gemachten Reihenfolge.
const uhr = (iso) => (iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null);
const dauer = (sek) => {
  if (sek == null) return null;
  const m = Math.floor(sek / 60);
  const s = sek % 60;
  return m ? `${m} Min.${s && m < 10 ? ` ${s} Sek.` : ""}` : `${s} Sek.`;
};

export default function RoutineZeitprotokoll({ durchlauf }) {
  const schritte = [...(durchlauf?.schritte || [])].sort((a, b) => (a.platz ?? 999) - (b.platz ?? 999));
  if (!schritte.length) return null;
  const kopf = [
    durchlauf.aufgewachtUm && `⏰ Wach ${uhr(durchlauf.aufgewachtUm)}`,
    durchlauf.gestartetUm && `▶ Beginn ${uhr(durchlauf.gestartetUm)}`,
    durchlauf.abgeschlossenUm && `✓ Fertig ${uhr(durchlauf.abgeschlossenUm)}`,
  ].filter(Boolean);
  const umgestellt = schritte.some((p) => p.platz && p.planPlatz && p.platz !== p.planPlatz);
  return (
    <div data-routine-zeitprotokoll>
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Zeitprotokoll – was wann wie lange</div>
      {kopf.length > 0 && <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{kopf.join(" · ")}</div>}
      {umgestellt && <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 6 }}>In deiner eigenen Reihenfolge gemacht (↕ = anders als geplant).</div>}
      {schritte.map((p, i) => {
        const geplantSek = (Number(p.geplantMin) || 0) * 60;
        const abweichung = p.tatsaechlichSek != null ? p.tatsaechlichSek - geplantSek : 0;
        const vonBis = p.startUm && p.endeUm ? `${uhr(p.startUm)}–${uhr(p.endeUm)}` : null;
        return (
          <div key={`${p.schrittId || p.name}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: i > 0 ? `1px solid ${cardBorder}` : "none", fontSize: 12.5 }}>
            <div style={{ minWidth: 0 }}>
              {p.platz && p.planPlatz && p.platz !== p.planPlatz ? "↕ " : ""}
              {p.name}
              {vonBis && <div style={{ fontSize: 11.5, color: textMuted, fontWeight: 700 }}>{vonBis}</div>}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right", fontWeight: 700, color: p.ausgelassen ? textMuted : Math.abs(abweichung) > 60 ? (abweichung > 0 ? danger : "var(--mp-accent-dark-text)") : textMuted }}>
              {p.ausgelassen ? "ausgelassen" : p.tatsaechlichSek == null ? "abgehakt" : dauer(p.tatsaechlichSek)}
              <div style={{ fontSize: 11, color: textMuted, fontWeight: 400 }}>geplant {p.geplantMin} Min.</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
