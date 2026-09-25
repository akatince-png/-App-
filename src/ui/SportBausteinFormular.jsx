import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { WOCHENTAGE } from "../constants";
import { SPORTARTEN } from "../utils/kernprogramm";

// Pflicht-Baustein Sport (Kernprogramm Woche 2, 25.09.): nicht "ob", nur
// welche Sportart, wie oft, an welchen Tagen, um wie viel Uhr. Speichert
// ganz normal in den Trainings-Wochenplan (training_wochenplan) — dort
// bleibt alles wie gewohnt bearbeitbar, Erinnerungen laufen wie bei jedem
// Training. Geht genauso per Aka ("Ich will Kampfsport, 3× abends").
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

export default function SportBausteinFormular({ onGespeichert }) {
  const { wochenplanHinzufuegen, trainingWochenplan = [], aenderungVermerken } = useAppData();
  const [sport, setSport] = useState(null);
  const [eigene, setEigene] = useState("");
  const [tage, setTage] = useState([]);
  const [uhrzeit, setUhrzeit] = useState("18:00");
  const [fehler, setFehler] = useState(null);
  const [speichert, setSpeichert] = useState(false);

  const name = sport === "andere" ? eigene.trim() : sport?.label;
  const art = sport === "andere" ? "Sonstiges" : sport?.art;
  const tagUmschalten = (t) => setTage((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  const speichern = async () => {
    setFehler(null);
    if (!name) return setFehler("Bitte eine Sportart wählen.");
    if (tage.length < 2) return setFehler("Bitte mindestens 2 Tage wählen.");
    setSpeichert(true);
    for (const wochentag of WOCHENTAGE.filter((t) => tage.includes(t))) {
      const r = await wochenplanHinzufuegen({ name, wochentag, uhrzeit, arten: [art] });
      if (!r?.ok) {
        setSpeichert(false);
        return setFehler(r?.error || "Speichern fehlgeschlagen.");
      }
    }
    setSpeichert(false);
    aenderungVermerken?.({ kategorie: "training", itemName: name, aktion: "hinzugefügt", detail: `${tage.length}× pro Woche (${tage.join(", ")}) um ${uhrzeit}` });
    onGespeichert?.();
  };

  return (
    <div>
      {trainingWochenplan.length > 0 && (
        <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 8 }}>
          Schon im Plan: {trainingWochenplan.map((w) => `${w.wochentag} ${w.name || (w.arten || []).join("/")}`).join(" · ")}
        </div>
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "4px 0 6px" }}>WELCHE SPORTART?</div>
      <div role="group" aria-label="Sportart" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SPORTARTEN.map((s) => (
          <button key={s.label} type="button" aria-pressed={sport === s} style={chip(sport === s)} onClick={() => setSport(s)}>
            {s.icon} {s.label}
          </button>
        ))}
        <button type="button" aria-pressed={sport === "andere"} style={chip(sport === "andere")} onClick={() => setSport("andere")}>
          ＋ andere
        </button>
      </div>
      {sport === "andere" && (
        <input
          aria-label="Eigene Sportart"
          value={eigene}
          onChange={(e) => setEigene(e.target.value)}
          placeholder="z. B. Yoga, Fußball, Reiten"
          style={{ width: "100%", boxSizing: "border-box", marginTop: 8, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 14, fontFamily: "inherit" }}
        />
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "14px 0 6px" }}>AN WELCHEN TAGEN? (MIND. 2)</div>
      <div role="group" aria-label="Tage" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {WOCHENTAGE.map((t) => (
          <button key={t} type="button" aria-pressed={tage.includes(t)} style={{ ...chip(tage.includes(t)), minWidth: 42 }} onClick={() => tagUmschalten(t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "14px 0 6px" }}>UM WIE VIEL UHR?</div>
      <input
        aria-label="Uhrzeit Sport"
        type="time"
        value={uhrzeit}
        onChange={(e) => setUhrzeit(e.target.value)}
        style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 15, fontFamily: "inherit" }}
      />
      <div style={{ fontSize: 12, background: "#E8F7F2", borderRadius: 12, padding: "8px 10px", marginTop: 12, lineHeight: 1.45 }}>
        💡 Sportarten mit Reaktion und Koordination (Kampfsport, Tanzen, Ballsport, Klettern) fordern zusätzlich Konzentration und Umschalten. Jede Bewegung zählt.
      </div>
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 8 }}>{fehler}</div>}
      <div style={{ marginTop: 12 }}>
        <PrimaryButton onClick={speichern} disabled={speichert}>
          {speichert ? "Speichert…" : "Speichern"}
        </PrimaryButton>
      </div>
    </div>
  );
}
