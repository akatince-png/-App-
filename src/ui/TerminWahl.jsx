import React, { useState } from "react";

// Datum + Uhrzeit beim Verschieben (03.11., Nutzerin: „nicht nur auf später
// drücken, sondern auch gefragt werden, auf wann … Datum und Uhrzeit, damit
// es im Kalender festgehalten wird. Die Festlegung der Zeit ist extrem
// wichtig.“). „→ Morgen“ fragt nur die Uhrzeit, „Später“ Datum und Uhrzeit.
const feld = { border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "7px 9px", fontSize: 15, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };
const knopf = (farbe, aktiv = true) => ({ border: "none", borderRadius: 99, padding: "8px 13px", fontSize: 13, fontWeight: 800, cursor: aktiv ? "pointer" : "not-allowed", fontFamily: "inherit", whiteSpace: "nowrap", background: farbe || "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: farbe ? "#fff" : "var(--mp-text)", opacity: aktiv ? 1 : 0.5 });

export default function TerminWahl({ datum, mitDatum = false, uhrzeit = "", titel, onSpeichern, onOhneTermin, onAbbrechen }) {
  const [tag, setTag] = useState(datum);
  const [zeit, setZeit] = useState(uhrzeit || "");
  const tagText = new Date(`${tag}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  return (
    <div data-termin-wahl style={{ marginTop: 8, padding: "10px 10px 8px", borderRadius: 12, background: "color-mix(in srgb, #F4F7FC var(--mp-flaeche), var(--mp-karte))" }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>{titel || (mitDatum ? "Auf wann?" : `Morgen (${tagText}) – um wie viel Uhr?`)}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {mitDatum && <input type="date" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Datum" style={feld} />}
        <input type="time" value={zeit} onChange={(e) => setZeit(e.target.value)} aria-label="Uhrzeit" style={{ ...feld, width: 120 }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" data-termin-festlegen disabled={!tag || !zeit} onClick={() => onSpeichern({ datum: tag, uhrzeit: zeit })} style={knopf("var(--mp-accent)", !!(tag && zeit))}>
          ✓ Festlegen{tag && zeit ? ` · ${tagText}, ${zeit}` : ""}
        </button>
        {onOhneTermin && (
          <button type="button" onClick={onOhneTermin} style={knopf("")}>
            ⏸ Ohne Termin in den Pool
          </button>
        )}
        <button type="button" onClick={onAbbrechen} style={{ ...knopf(""), background: "transparent" }}>
          Zurück
        </button>
      </div>
      {!mitDatum && tag && (
        <button type="button" onClick={() => onSpeichern({ datum: tag, uhrzeit: null })} style={{ border: "none", background: "transparent", padding: "6px 2px 0", fontSize: 12, fontWeight: 700, color: "var(--mp-text-muted)", cursor: "pointer", fontFamily: "inherit" }}>
          Uhrzeit noch offen
        </button>
      )}
    </div>
  );
}
