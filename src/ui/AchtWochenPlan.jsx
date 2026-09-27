import React from "react";
import { BAUSTEINE, WOCHEN, datumKurz } from "../utils/kernprogramm";
import { plusTage } from "../utils/schichtplan";
import { cardBorder, textMain, textMuted } from "./theme";

// Die Einstellungsphase auf einen Blick (27.09., Nutzerinnen-Wunsch: "die
// acht Wochen, diese ganze Einführungsphase … sehr wichtig"). Inhalt nach
// dem freigegebenen Pilotplan (Artefakt "AKA 8 Wochen"): Woche 1–4 kommt je
// ein Baustein dazu, Woche 5–8 wird gefestigt, nach Woche 4 und 8 ein
// Gespräch mit dem Coach. Danach geht das Coaching weiter.
// Darstellung (Nutzerin 27.09.): Fahrplan mit Kacheln – untereinander, jede Woche eine Kachel.

export const ERHALTUNG_WOCHEN = {
  5: { titel: "Festigen", icon: "🔁", text: "Nichts Neues muss. Alles läuft weiter, sonntags ein kurzer Wochen-Check." },
  6: { titel: "Dein Zusatz", icon: "✨", text: "Ein freiwilliger Baustein, den ihr zusammen aussucht – z. B. Schlaf-Feinschliff oder Fokusblöcke." },
  7: { titel: "Nachmessen", icon: "⏱️", text: "Routinen eine Woche wieder mit Stoppuhr – Vergleich mit Woche 1." },
  8: { titel: "Bilanz", icon: "🏁", text: "Vorher und nachher anschauen. Gespräch: wie es weitergeht." },
};

export const wocheInfo = (w) => (w <= 4 ? WOCHEN[w] : ERHALTUNG_WOCHEN[w]);
const bausteineIn = (w) => BAUSTEINE.filter((b) => b.woche === w);
const GESPRAECH = [4, 8];

export default function AchtWochenPlan({ aktuell = 0, start = null }) {
  const ab = (w) => (start ? datumKurz(plusTage(start, (w - 1) * 7)) : null);
  return (
    <div data-acht-wochen style={{ position: "relative" }}>
      <EtappenKopf farbe="#1B2350" titel="Einführung" text="Jede Woche kommt etwas Kleines dazu" />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
        const info = wocheInfo(w);
        const jetzt = w === aktuell;
        const vorbei = aktuell && w < aktuell;
        const einf = w <= 4;
        return (
          <React.Fragment key={w}>
            {w === 5 && <EtappenKopf farbe="#2E9C86" titel="Festigen" text="Nichts Neues muss – dranbleiben" />}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0, paddingTop: 16 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: vorbei ? "#5CC3A8" : jetzt ? "#F4C542" : einf ? "#1B2350" : "#5CC3A8", boxShadow: jetzt ? "0 0 0 4px rgba(244,197,66,.35)" : "none", fontSize: 9, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {vorbei ? "✓" : ""}
                </span>
                {w < 8 && <span style={{ flex: 1, width: 3, background: w < 4 ? "#1B2350" : "#5CC3A8", opacity: 0.25, borderRadius: 2, marginTop: 2 }} />}
              </div>
              <div
                data-woche={w}
                style={{
                  flex: 1,
                  marginBottom: 8,
                  borderRadius: 16,
                  padding: "10px 12px",
                  background: einf ? "#1B2350" : "#E8F7F2",
                  color: einf ? "#fff" : textMain,
                  boxShadow: jetzt ? "0 0 0 3px #F4C542" : "none",
                  opacity: vorbei ? 0.75 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{info.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, opacity: 0.75, letterSpacing: 0.3 }}>
                      WOCHE {w}
                      {ab(w) ? ` · AB ${ab(w).toUpperCase()}` : ""}
                    </span>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>{info.titel}</span>
                  </span>
                  {jetzt && <span style={{ fontSize: 10.5, fontWeight: 900, color: "#1B2350", background: "#F4C542", borderRadius: 99, padding: "2px 8px" }}>JETZT</span>}
                  {vorbei && <span style={{ fontSize: 11, fontWeight: 800, color: einf ? "#8FE0C9" : "#2E9C86" }}>✓</span>}
                </div>
                {einf ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {bausteineIn(w).map((b) => (
                      <span key={b.key} style={{ fontSize: 11.5, fontWeight: 700, background: "rgba(255,255,255,.13)", borderRadius: 99, padding: "3px 8px" }}>
                        {b.icon} {b.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "#1E4D40", lineHeight: 1.45, marginTop: 5 }}>{info.text}</div>
                )}
                {GESPRAECH.includes(w) && (
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 7, color: einf ? "#F4C542" : "#B5501F" }}>💬 Am Ende: Gespräch mit deinem Coach</div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <Danach />
    </div>
  );
}

function EtappenKopf({ farbe, titel, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: farbe }} />
      <span style={{ fontSize: 13, fontWeight: 900, color: textMain }}>{titel}</span>
      <span style={{ fontSize: 12, color: textMuted }}>{text}</span>
    </div>
  );
}

function Danach() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: "10px 12px", borderRadius: 14, border: `1.5px dashed ${cardBorder}` }}>
      <span style={{ fontSize: 18 }}>∞</span>
      <span style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.45 }}>
        <b style={{ color: textMain }}>Danach geht es weiter</b> – in Etappen à 4 Wochen, so lange es dir hilft.
      </span>
    </div>
  );
}
