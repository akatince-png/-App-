import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import TimeWheelField from "./TimeWheelField";
import { danger, textMuted } from "./theme";
import { toLocalISODate } from "../utils/dates";
import { plusTage } from "../utils/schichtplan";
import { zumSchichtplan } from "./SchichtplanLink";

// Startseite bei Schichtarbeit (25.09., Vorschau freigegeben): welche
// Schicht heute gilt, wann die Routinen starten, was morgen kommt — und
// "Heute anders" mit einem Tipp (andere Schicht, normal, krank, eigene
// Zeit). Gilt nur für diesen Tag und wird protokolliert.
const chip = { border: "none", borderRadius: 99, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#2D6FD6" };

export default function SchichtHeuteKarte() {
  const { routineVarianten = [], routinePlanFuer, routineSchichtplanTagSetzen, aenderungVermerken, routineEinstellungenStandard = {} } = useAppData();
  const [offen, setOffen] = useState(false);
  const [eigen, setEigen] = useState(null);
  const [fehler, setFehler] = useState(null);
  if (!routineVarianten.length || !routinePlanFuer) return null;

  const heute = toLocalISODate(new Date());
  const p = routinePlanFuer(heute);
  const m = routinePlanFuer(plusTage(heute, 1));
  const titel = p.art === "standard" ? "Normale Zeiten" : p.label;
  const morgenAnders = m.key !== p.key;

  const setzen = async (eintrag, text) => {
    setFehler(null);
    const r = await routineSchichtplanTagSetzen(heute, eintrag);
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken?.({ kategorie: "morgenroutine", itemName: "Schichtplan", aktion: "geändert (nur dieser Tag)", detail: `Heute: ${text} statt ${titel}` });
    setOffen(false);
    setEigen(null);
  };

  return (
    <section aria-label="Heute im Schichtplan" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "linear-gradient(135deg, #FFE8B8, #FFF6E0)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#8A5A00", letterSpacing: 0.3 }}>
        HEUTE · {p.icon ? `${p.icon} ` : ""}
        {titel.toUpperCase()}
      </div>
      <div style={{ fontWeight: 900, fontSize: 15.5, marginTop: 4 }}>
        {p.art === "krank" ? "Heute zählt nur Erholung – keine Zeiten." : `☀ Morgenroutine ${p.morgen || "–"} · 🌙 Abendroutine ${p.abend || "–"}`}
      </div>
      <div style={{ fontSize: 12.5, color: "#5A4A20", marginTop: 3, fontWeight: morgenAnders ? 800 : 500 }}>
        {morgenAnders
          ? `Morgen: ${m.icon ? `${m.icon} ` : ""}${m.art === "standard" ? "normale Zeiten" : m.label}${m.morgen ? ` – Morgenroutine um ${m.morgen}` : ""}`
          : `Morgen: gleiche Zeiten`}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button type="button" className="mp-tap" style={chip} onClick={() => setOffen((o) => !o)} aria-expanded={offen}>
          Heute anders ›
        </button>
        <button type="button" className="mp-tap" style={{ ...chip, background: "transparent" }} onClick={zumSchichtplan}>
          📅 Plan
        </button>
      </div>
      {offen && (
        <div style={{ marginTop: 10, background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {routineVarianten
              .filter((v) => v.id !== p.variante?.id)
              .map((v) => (
                <button key={v.id} type="button" className="mp-tap" style={chip} onClick={() => setzen({ art: "variante", varianteId: v.id }, v.name)}>
                  {v.icon} {v.name}
                </button>
              ))}
            {p.art !== "standard" && (
              <button type="button" className="mp-tap" style={chip} onClick={() => setzen(null, "normale Zeiten")}>
                Normal
              </button>
            )}
            {p.art !== "krank" && (
              <button type="button" className="mp-tap" style={chip} onClick={() => setzen({ art: "krank" }, "krank")}>
                🤒 Krank
              </button>
            )}
            <button
              type="button"
              className="mp-tap"
              style={chip}
              onClick={() => setEigen({ morgen: p.morgen || routineEinstellungenStandard.morgen?.startZeit || "", abend: p.abend || routineEinstellungenStandard.abend?.startZeit || "" })}
            >
              🕐 Eigene Zeit
            </button>
          </div>
          {eigen && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: textMuted }}>
                  ☀ Morgen
                  <TimeWheelField value={eigen.morgen} onChange={(v) => setEigen((e) => ({ ...e, morgen: v }))} />
                </label>
                <label style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: textMuted }}>
                  🌙 Abend
                  <TimeWheelField value={eigen.abend} onChange={(v) => setEigen((e) => ({ ...e, abend: v }))} />
                </label>
              </div>
              <button
                type="button"
                className="mp-tap"
                style={{ ...chip, background: "#1B2350", color: "#fff", width: "100%", marginTop: 8, padding: 12 }}
                onClick={() => setzen({ art: "eigen", morgenStart: eigen.morgen, abendStart: eigen.abend }, `eigene Zeit (☀ ${eigen.morgen || "–"} · 🌙 ${eigen.abend || "–"})`)}
              >
                Für heute übernehmen
              </button>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 6 }}>Gilt nur für heute und wird im Protokoll vermerkt.</div>
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 4 }}>{fehler}</div>}
        </div>
      )}
    </section>
  );
}
