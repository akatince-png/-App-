import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { ART, MIT_GRENZE, QUADRANT, QUADRANTEN, mitUmschalten, mitsAm, nachQuadrant, quadrantVon } from "../utils/matrix";

// ⭐ MITs wählen (24.10.): in der Abendroutine (Tagesabschluss → für morgen)
// und morgens bei „Top 3“ (für heute). Antippen markiert, höchstens drei.
export default function MitWahl({ datum, titel }) {
  const { matrixAufgaben = [], matrixAufgabeSpeichern } = useAppData();
  const [hinweis, setHinweis] = useState(null);
  const tag = toLocalISODate(datum);
  const gewaehlt = mitsAm(matrixAufgaben, tag);
  const felder = nachQuadrant(matrixAufgaben, datum);
  const kandidaten = QUADRANTEN.flatMap((q) => felder[q.id]).filter((a) => a.mitAm !== tag).slice(0, 8);
  const umschalten = async (a) => {
    setHinweis(null);
    const r = mitUmschalten(a, tag, matrixAufgaben);
    if (r.voll) return setHinweis(`Schon ${MIT_GRENZE} MITs – erst eine abwählen. Weniger ist mehr.`);
    await matrixAufgabeSpeichern?.(r.aufgabe);
  };
  const zeile = (a, an) => (
    <button
      key={a.id}
      type="button"
      aria-pressed={an}
      onClick={() => umschalten(a)}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "9px 10px", marginBottom: 6, borderRadius: 12, border: `1.5px solid ${an ? "#E0A21B" : "var(--mp-rand)"}`, background: an ? "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-karte))" : "var(--mp-karte)", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
    >
      <span style={{ fontSize: 18 }}>{an ? "⭐" : "☆"}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, textDecoration: a.erledigtAm ? "line-through" : "none" }}>
        {a.art && a.art !== "aufgabe" ? `${ART[a.art]?.icon || ""} ` : ""}
        {a.titel}
      </span>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 9, background: QUADRANT[quadrantVon(a, datum)].farbe }} />
    </button>
  );
  return (
    <div data-mit-wahl style={{ textAlign: "left", marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{titel}</div>
      <div style={{ fontSize: 12, color: "var(--mp-text-muted)", marginBottom: 8 }}>
        Deine wichtigsten 1–{MIT_GRENZE} Aufgaben (MIT = Most Important Task). {gewaehlt.length} von {MIT_GRENZE} gewählt.
      </div>
      {gewaehlt.map((a) => zeile(a, true))}
      {kandidaten.map((a) => zeile(a, false))}
      {!gewaehlt.length && !kandidaten.length && <div style={{ fontSize: 12.5, color: "var(--mp-text-muted)" }}>Noch keine offenen Aufgaben in deiner Matrix.</div>}
      {hinweis && <div role="status" style={{ fontSize: 12.5, color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))", marginTop: 4 }}>{hinweis}</div>}
    </div>
  );
}
