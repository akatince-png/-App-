import React from "react";
import { useWetter } from "../data/useWetter";
import { himmel, lichtTipp, stundenFuerTag } from "../utils/wetter";
import { sonnenaufgang, sonnenuntergang } from "../utils/sonne";

const SYMBOL = { sonnig: "☀️", "teils bewölkt": "⛅", bewölkt: "🌥️", bedeckt: "☁️", "Regen wahrscheinlich": "🌧️" };

// Wetter-Tipp fürs Tageslicht (28.10.): beste Zeit heute, auf Wunsch mit
// Stundenleiste von Sonnenauf- bis -untergang. Ohne Internet: nichts.
export default function WetterTipp({ stunden: mitStunden = false, style }) {
  const daten = useWetter();
  const jetzt = new Date();
  const tipp = lichtTipp(daten, jetzt, jetzt);
  if (!tipp) return null;
  const heuteIso = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-${String(jetzt.getDate()).padStart(2, "0")}`;
  const auf = sonnenaufgang(jetzt)?.getHours() ?? 7;
  const unter = sonnenuntergang(jetzt)?.getHours() ?? 17;
  const leiste = mitStunden ? stundenFuerTag(daten, heuteIso).filter((s) => s.stunde >= auf && s.stunde <= unter) : [];
  return (
    <div data-wetter-tipp style={{ fontSize: 13, lineHeight: 1.45, ...style }}>
      <div style={{ fontWeight: 800 }}>🌤️ {tipp.text}</div>
      {tipp.zusatz && <div style={{ color: "var(--mp-text-muted)", fontSize: 12.5 }}>{tipp.zusatz}</div>}
      {leiste.length > 0 && (
        <div style={{ display: "flex", gap: 4, overflowX: "auto", marginTop: 8, paddingBottom: 2 }}>
          {leiste.map((s) => {
            const h = himmel(s.wolken, s.regen);
            const best = s.stunde >= tipp.von && s.stunde < tipp.bis;
            return (
              <div key={s.stunde} title={`${s.stunde} Uhr: ${h}`} style={{ flex: "0 0 auto", minWidth: 34, textAlign: "center", borderRadius: 10, padding: "4px 2px", background: best ? "color-mix(in srgb, #F5C542 30%, transparent)" : "transparent" }}>
                <div style={{ fontSize: 16 }}>{SYMBOL[h]}</div>
                <div style={{ fontSize: 11, color: "var(--mp-text-muted)", fontWeight: 700 }}>{s.stunde}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: "var(--mp-text-muted)", marginTop: 4 }}>Vorhersage: Open-Meteo, Hannover</div>
    </div>
  );
}
