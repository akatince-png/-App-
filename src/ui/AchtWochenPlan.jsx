import React from "react";
import { BAUSTEINE, WOCHEN, datumKurz } from "../utils/kernprogramm";
import { plusTage } from "../utils/schichtplan";
import { cardBorder, textMain, textMuted } from "./theme";

// Die Einstellungsphase auf einen Blick (27.09., Nutzerinnen-Wunsch: "die
// acht Wochen, diese ganze Einführungsphase … sehr wichtig"). Inhalt nach
// dem freigegebenen Pilotplan (Artefakt "AKA 8 Wochen"): Woche 1–4 kommt je
// ein Baustein dazu, Woche 5–8 wird gefestigt, nach Woche 4 und 8 ein
// Gespräch mit dem Coach. Danach geht das Coaching weiter.
// darstellung: "fahrplan" (Woche für Woche untereinander) | "kacheln" (2 × 4).

export const ERHALTUNG_WOCHEN = {
  5: { titel: "Festigen", icon: "🔁", text: "Nichts Neues muss. Alles läuft weiter, sonntags ein kurzer Wochen-Check." },
  6: { titel: "Dein Zusatz", icon: "✨", text: "Ein freiwilliger Baustein, den ihr zusammen aussucht – z. B. Schlaf-Feinschliff oder Fokusblöcke." },
  7: { titel: "Nachmessen", icon: "⏱️", text: "Routinen eine Woche wieder mit Stoppuhr – Vergleich mit Woche 1." },
  8: { titel: "Bilanz", icon: "🏁", text: "Vorher und nachher anschauen. Gespräch: wie es weitergeht." },
};

export const wocheInfo = (w) => (w <= 4 ? WOCHEN[w] : ERHALTUNG_WOCHEN[w]);
const bausteineIn = (w) => BAUSTEINE.filter((b) => b.woche === w);
const GESPRAECH = [4, 8];

function Status({ w, aktuell }) {
  if (!aktuell) return null;
  if (w < aktuell) return <span style={{ fontSize: 11, fontWeight: 800, color: "#2E9C86" }}>✓ geschafft</span>;
  if (w === aktuell) return <span style={{ fontSize: 11, fontWeight: 900, color: "#1B2350", background: "#F4C542", borderRadius: 99, padding: "2px 8px" }}>JETZT</span>;
  return null;
}

export default function AchtWochenPlan({ darstellung = "fahrplan", aktuell = 0, start = null }) {
  const wochen = [1, 2, 3, 4, 5, 6, 7, 8];
  const ab = (w) => (start ? datumKurz(plusTage(start, (w - 1) * 7)) : null);

  if (darstellung === "kacheln") {
    return (
      <div data-acht-wochen="kacheln">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {wochen.map((w) => {
            const info = wocheInfo(w);
            const jetzt = w === aktuell;
            const einf = w <= 4;
            return (
              <div
                key={w}
                style={{
                  borderRadius: 16,
                  padding: "10px 11px",
                  background: einf ? "#1B2350" : "#E8F7F2",
                  color: einf ? "#fff" : textMain,
                  boxShadow: jetzt ? "0 0 0 3px #F4C542" : "none",
                  opacity: aktuell && w < aktuell ? 0.7 : 1,
                  minHeight: 92,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.75, letterSpacing: 0.3 }}>WOCHE {w}</span>
                  {GESPRAECH.includes(w) && <span title="Gespräch mit deinem Coach">💬</span>}
                </div>
                <div style={{ fontSize: 22, marginTop: 2 }}>{info.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, lineHeight: 1.2 }}>{info.titel}</div>
                {einf && (
                  <div style={{ fontSize: 13, marginTop: 4, letterSpacing: 1 }} aria-label={bausteineIn(w).map((b) => b.name).join(", ")}>
                    {bausteineIn(w).map((b) => b.icon)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Danach />
      </div>
    );
  }

  return (
    <div data-acht-wochen="fahrplan" style={{ position: "relative" }}>
      <EtappenKopf farbe="#1B2350" titel="Einführung" text="Jede Woche kommt etwas Kleines dazu" />
      {wochen.map((w) => {
        const info = wocheInfo(w);
        const jetzt = w === aktuell;
        const vorbei = aktuell && w < aktuell;
        const einf = w <= 4;
        return (
          <React.Fragment key={w}>
            {w === 5 && <EtappenKopf farbe="#2E9C86" titel="Festigen" text="Nichts Neues muss – dranbleiben" />}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34, flexShrink: 0 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    background: vorbei ? "#E8F7F2" : jetzt ? "#F4C542" : einf ? "#1B2350" : "#E8F7F2",
                    boxShadow: jetzt ? "0 0 0 4px rgba(244,197,66,.3)" : "none",
                  }}
                >
                  {vorbei ? "✓" : info.icon}
                </span>
                {w < 8 && <span style={{ flex: 1, width: 3, minHeight: 14, background: w < 4 ? "#1B2350" : "#5CC3A8", opacity: 0.25, borderRadius: 2 }} />}
              </div>
              <div
                style={{
                  flex: 1,
                  marginBottom: 10,
                  padding: jetzt ? "10px 12px" : "4px 0 6px",
                  borderRadius: 14,
                  background: jetzt ? "#FFF8E1" : "transparent",
                  border: jetzt ? "1.5px solid #F4C542" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: textMuted, letterSpacing: 0.3 }}>
                    WOCHE {w}
                    {ab(w) ? ` · ab ${ab(w)}` : ""}
                  </span>
                  <Status w={w} aktuell={aktuell} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: textMain, marginTop: 1 }}>{info.titel}</div>
                {einf ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                    {bausteineIn(w).map((b) => (
                      <span key={b.key} style={{ fontSize: 11.5, fontWeight: 700, color: textMain, background: "#F3F4F8", border: `1px solid ${cardBorder}`, borderRadius: 99, padding: "3px 8px" }}>
                        {b.icon} {b.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.45, marginTop: 2 }}>{info.text}</div>
                )}
                {GESPRAECH.includes(w) && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#B5501F", marginTop: 6 }}>💬 Am Ende: Gespräch mit deinem Coach</div>
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
