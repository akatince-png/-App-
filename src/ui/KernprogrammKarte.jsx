import React from "react";
import { useAppData } from "../context/AppDataContext";
import { ETAPPEN_NAME, WOCHEN, datumKurz } from "../utils/kernprogramm";

// Startseite (25.09., Vorschau freigegeben): wo stehe ich im AKA-Coaching?
// Einführung: "Woche 2 von 4 – Bewegung" mit dem, was neu dazukommt.
// Erhaltung: "Etappe 2 · Woche 6 von 8". Antippen öffnet die Übersicht.
export function EtappenBalken({ stand, hell = false }) {
  const aktuell = stand.woche;
  return (
    <div style={{ display: "flex", gap: 4, margin: "10px 0 6px" }} aria-hidden="true">
      {[1, 2, 3, 4].map((w) => (
        <i
          key={w}
          style={{
            flex: 1,
            height: 7,
            borderRadius: 4,
            background: w < aktuell ? "#5CC3A8" : w === aktuell ? "#F4C542" : hell ? "#E4E6EE" : "rgba(255,255,255,.22)",
          }}
        />
      ))}
    </div>
  );
}

export default function KernprogrammKarte({ onOeffnen }) {
  const { kernStand: stand, trainingWochenplan = [] } = useAppData();
  if (!stand) return null;
  if (!stand.aktiv) {
    // Programm-Modul (26.09.): Teilnahme wartet, bis der Coach den Start festlegt.
    if (stand.wartet)
      return (
        <div style={{ ...karte, cursor: "default" }} data-kern-wartet>
          <div style={klein}>DEIN AKA-COACHING</div>
          <div style={{ fontWeight: 900, fontSize: 16, marginTop: 3 }}>🧭 Deine Einstellungsphase</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4, lineHeight: 1.4 }}>Deinen Start legst du mit deinem Coach fest. Los geht&apos;s am Abend – mit deiner ersten Abendroutine.</div>
        </div>
      );
    if (stand.pausiert)
      return (
        <div style={{ ...karte, cursor: "default" }} data-kern-pausiert>
          <div style={klein}>DEIN AKA-COACHING</div>
          <div style={{ fontWeight: 900, fontSize: 16, marginTop: 3 }}>⏸ Gerade pausiert</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4, lineHeight: 1.4 }}>Kein Druck. Wenn es weitergeht, machst du genau da weiter, wo du aufgehört hast.</div>
        </div>
      );
    if (!stand.geplant) return null;
    return (
      <button type="button" className="mp-tap" onClick={onOeffnen} style={karte}>
        <div style={klein}>DEIN AKA-COACHING</div>
        <div style={{ fontWeight: 900, fontSize: 16, marginTop: 3 }}>🧭 Startet am {datumKurz(stand.geplant.start)} abends</div>
        <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4, lineHeight: 1.4 }}>Los geht&apos;s mit deiner ersten Abendroutine. Woche 1: {WOCHEN[1].text}</div>
      </button>
    );
  }
  const einfuehrung = !stand.erhaltung;
  const w = WOCHEN[stand.woche];
  const sportFehlt = stand.einfuehrungWoche >= 2 && trainingWochenplan.length === 0;
  return (
    <button type="button" className="mp-tap" onClick={onOeffnen} style={karte} aria-label="AKA-Kernprogramm öffnen" data-kern-woche={stand.gesamtWoche}>
      <div style={klein}>
        {einfuehrung ? `AKA-KERNPROGRAMM · WOCHE ${stand.woche} VON 4` : `ETAPPE ${stand.etappe.nummer} · ${ETAPPEN_NAME.erhaltung.toUpperCase()} · WOCHE ${stand.gesamtWoche} VON ${stand.etappe.nummer * 4}`}
      </div>
      <div style={{ fontWeight: 900, fontSize: 17, marginTop: 4 }}>
        {stand.gespraechFaellig ? "💬 Gespräch mit deinem Coach steht an" : einfuehrung ? `${w.icon} Diese Woche: ${w.titel}` : "🔁 Dranbleiben – nichts Neues dazu"}
      </div>
      <EtappenBalken stand={stand} />
      <div style={{ fontSize: 12.5, opacity: 0.88, lineHeight: 1.4 }}>
        {stand.gespraechFaellig
          ? `Etappe ${stand.etappe.nummer} endet ${datumKurz(stand.etappe.ende)}. Ihr schaut gemeinsam, was bleibt und was angepasst wird.`
          : einfuehrung
            ? w.text
            : "Alle Bausteine laufen weiter. Was nicht passt, stellst du mit deinem Coach um."}
      </div>
      <div style={{ marginTop: 10, display: "block", textAlign: "center", borderRadius: 14, padding: 11, fontWeight: 800, fontSize: 14, background: "#F4C542", color: "#1B2350" }}>
        {sportFehlt ? "🏋️ Sportart wählen ›" : "Übersicht ›"}
      </div>
    </button>
  );
}

const karte = {
  width: "100%",
  textAlign: "left",
  display: "block",
  marginBottom: 14,
  borderRadius: 18,
  padding: 14,
  background: "#1B2350",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};
const klein = { fontSize: 11, fontWeight: 800, opacity: 0.75, letterSpacing: 0.3 };
