import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { addDays } from "../utils/dates";
import { QUADRANT, quadrantVon } from "../utils/matrix";
import { abschlussTag, alsGeschafft, aufMorgen, heuteFaellig, heuteGeschafft, inDenPool } from "../utils/tagesabschluss";
import MitWahl from "./MitWahl";

// Tagesabschluss in der Abendroutine (25.10., Nutzerin): zuerst „Was hast du
// heute geschafft?“, Liegengebliebenes auf morgen oder in den Pool – erst
// danach „Was planst du für morgen?“.

const knopf = (farbe, aktiv = true) => ({ border: "none", borderRadius: 99, padding: "7px 11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", background: aktiv ? farbe : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: aktiv ? "#fff" : "var(--mp-text)" });

export default function TagesRueckblick() {
  const { matrixAufgaben = [], matrixAufgabeSpeichern } = useAppData();
  const heute = abschlussTag();
  const morgen = addDays(heute, 1);
  const offen = heuteFaellig(matrixAufgaben, heute);
  const geschafft = heuteGeschafft(matrixAufgaben, heute);
  const [planen, setPlanen] = useState(false);
  const speichern = (a) => matrixAufgabeSpeichern?.(a);

  if (planen || (!offen.length && !geschafft.length)) {
    return (
      <div data-tagesabschluss="planen">
        {(offen.length > 0 || geschafft.length > 0) && (
          <button type="button" onClick={() => setPlanen(false)} style={{ border: "none", background: "transparent", padding: 0, marginTop: 12, fontSize: 12.5, fontWeight: 800, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
            ‹ Zurück zu „Heute geschafft?“
          </button>
        )}
        <MitWahl datum={morgen} titel="⭐ Was planst du für morgen?" />
      </div>
    );
  }

  return (
    <div data-tagesabschluss="rueckblick" style={{ textAlign: "left", marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>✅ Was hast du heute geschafft?</div>
      <div style={{ fontSize: 12, color: "var(--mp-text-muted)", marginBottom: 8 }}>Hak ab, was erledigt ist. Den Rest nimmst du auf morgen mit oder legst ihn zurück in den Pool – ganz ohne schlechtes Gewissen.</div>
      {geschafft.map((a) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 6, borderRadius: 14, background: "color-mix(in srgb, #DDF3E9 var(--mp-flaeche), var(--mp-karte))" }}>
          <span aria-hidden="true">✅</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, textDecoration: "line-through", opacity: 0.75 }}>{a.titel}</span>
        </div>
      ))}
      {offen.map((a) => {
        const q = QUADRANT[quadrantVon(a, heute)];
        return (
          <div key={a.id} data-rueckblick-aufgabe={a.id} style={{ padding: "9px 10px", marginBottom: 6, borderRadius: 14, border: "1.5px solid var(--mp-rand)", background: "var(--mp-karte)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <i aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 99, background: q.farbe, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700 }}>{a.titel}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button type="button" onClick={() => speichern(alsGeschafft(a))} style={knopf("#2E9C6E")}>
                ✓ Geschafft
              </button>
              <button type="button" onClick={() => speichern(aufMorgen(a, heute))} style={knopf("var(--mp-accent)")}>
                → Morgen
              </button>
              <button type="button" onClick={() => speichern(inDenPool(a))} style={knopf("", false)}>
                ⏸ Später
              </button>
            </div>
          </div>
        );
      })}
      <button type="button" data-zur-planung onClick={() => setPlanen(true)} style={{ ...knopf("var(--mp-accent)"), width: "100%", padding: "11px", fontSize: 14, marginTop: 6 }}>
        {offen.length ? `Weiter zur Planung für morgen (${offen.length} noch offen)` : "Weiter zur Planung für morgen ›"}
      </button>
    </div>
  );
}
