import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { textMuted } from "./theme";
import TagebuchFormular from "./TagebuchFormular";
import { stimmungEmoji } from "../utils/tagebuch";
import { toLocalISODate } from "../utils/dates";

// Abend-Karte auf der Startseite (25.09.): ab 17 Uhr, einmal am Tag,
// solange heute noch kein Tagebuch-Eintrag da ist. "Heute nicht" blendet
// sie bis morgen aus (nur auf diesem Gerät).
const AUSGEBLENDET_KEY = "tagebuchHeuteNicht";

export default function TagebuchKarte({ onOeffnen }) {
  const { tagebuchEintraege = [] } = useAppData();
  const heute = toLocalISODate(new Date());
  const [gespeichert, setGespeichert] = useState(null);
  const [ausgeblendet, setAusgeblendet] = useState(() => {
    try {
      return localStorage.getItem(AUSGEBLENDET_KEY) === heute;
    } catch {
      return false;
    }
  });
  const vorhanden = tagebuchEintraege.find((e) => e.datum === heute);
  if (gespeichert) {
    return (
      <div role="status" style={{ marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "#EAF7F0", border: "1.5px solid #BFE5D0", fontSize: 13.5, fontWeight: 700 }}>
        {stimmungEmoji(gespeichert.stimmung)} Danke – dein Tag ist festgehalten.{" "}
        <button type="button" onClick={onOeffnen} style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          Tagebuch ›
        </button>
      </div>
    );
  }
  if (vorhanden || ausgeblendet || new Date().getHours() < 17) return null;
  return (
    <section aria-label="Wie war dein Tag?" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: "2px solid #2D3A7A" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, fontWeight: 900, fontSize: 15.5 }}>🌙 Wie war dein Tag?</div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(AUSGEBLENDET_KEY, heute);
            } catch {
              // ohne Speicher bleibt sie nur bis zum Neuladen weg
            }
            setAusgeblendet(true);
          }}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
        >
          Heute nicht
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>30 Sekunden – daraus zeigt dir die App später, unter welchen Bedingungen es dir gut geht.</div>
      <TagebuchFormular datum={heute} kompakt onGespeichert={setGespeichert} />
    </section>
  );
}
