import React, { useState } from "react";
import { accentDark, cardBorder, textMuted } from "./theme";
import { sollWiederholungen } from "../utils/trainingSaetze";

// Frage direkt nach jedem Satz (25.09., Vorschau freigegeben): "Alle 10
// Wiederholungen geschafft?" — ein Tipp auf Ja, sonst die Zahl antippen.
// Die Pause läuft dabei schon. Schwere ist freiwillig. Im Moment gefragt
// statt hinterher, weil die Erinnerung sonst ungenau wird.
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "8px 13px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

export default function SatzFrage({ soll, satz, onAntwort, antwort }) {
  const zahl = sollWiederholungen(soll);
  const [schwere, setSchwere] = useState(antwort?.schwere || null);
  const [andere, setAndere] = useState(false);
  const [eingabe, setEingabe] = useState("");
  const vorschlaege = zahl ? [zahl - 5, zahl - 4, zahl - 3, zahl - 2, zahl - 1].filter((n) => n > 0) : [4, 6, 8, 10, 12];
  const antworten = (wdh) => onAntwort({ wdh, schwere, geschafft: zahl ? wdh >= zahl : null });

  if (antwort) {
    return (
      <div role="status" style={{ fontSize: 13.5, fontWeight: 700, color: "#1E8E5A", margin: "0 0 10px" }}>
        ✓ Satz {satz}: {antwort.wdh} Wdh. notiert{antwort.schwere ? ` · ${antwort.schwere}` : ""}
      </div>
    );
  }
  return (
    <section aria-label={`Satz ${satz} – geschafft?`} style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 14, padding: "10px 10px 12px", marginBottom: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{zahl ? `Alle ${soll} Wiederholungen geschafft?` : "Wie viele Wiederholungen?"}</div>
      {zahl && (
        <button type="button" onClick={() => antworten(zahl)} style={{ width: "100%", border: "none", borderRadius: 14, padding: 12, fontSize: 15.5, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", background: accentDark, color: "#fff" }}>
          ✅ Ja, alle {zahl}
        </button>
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>{zahl ? "NEIN – WIE VIELE?" : "ANTIPPEN"}</div>
      <div role="group" aria-label="Geschaffte Wiederholungen" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {vorschlaege.map((n) => (
          <button key={n} type="button" style={chip(false)} onClick={() => antworten(n)}>
            {n}
          </button>
        ))}
        <button type="button" aria-pressed={andere} style={chip(andere)} onClick={() => setAndere(true)}>
          andere
        </button>
      </div>
      {andere && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
          <input
            type="number"
            min={0}
            aria-label="Anzahl Wiederholungen"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            style={{ width: 80, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "8px 10px", fontSize: 15, fontFamily: "inherit" }}
          />
          <button type="button" style={chip(true)} disabled={eingabe === ""} onClick={() => antworten(Number(eingabe))}>
            OK
          </button>
        </div>
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>WIE SCHWER WAR ES? (OPTIONAL)</div>
      <div role="group" aria-label="Wie schwer?" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {["leicht", "passt", "sehr schwer"].map((s) => (
          <button key={s} type="button" aria-pressed={schwere === s} style={chip(schwere === s)} onClick={() => setSchwere(schwere === s ? null : s)}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
