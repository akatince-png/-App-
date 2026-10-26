import React from "react";
import { useAppData } from "../context/AppDataContext";

// Großes Getränk über den Tag (26.10., Nutzerin: „1,5-l-Shake … nicht
// ankreuzen, dass ich ihn komplett getrunken habe, sondern Flüssigkeits-
// angaben, die ersten 250 ml …“). Portionen eintragen, Fortschritt sehen;
// erledigt, sobald alles getrunken ist. Zählt auch zum Wasser.
const PORTIONEN = [125, 250, 500];

export default function GetraenkPortion({ dose, gesamtMl, farbe = "var(--mp-accent)", hell = false }) {
  const { supplementMengeMl = {}, supplementSchluck, hydrationHinzufuegen } = useAppData();
  const menge = supplementMengeMl[`${dose.datum}__${dose.id}__${dose.zeit}`] || 0;
  const anteil = Math.min(1, menge / gesamtMl);
  const eintragen = async (ml) => {
    const r = await supplementSchluck?.(dose, ml);
    if (r?.ok !== false) hydrationHinzufuegen?.(ml, { leise: true });
  };
  return (
    <div data-getraenk-portion style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, marginBottom: 5, color: hell ? "#1F2A44" : "inherit" }}>
        <span>🥤 {menge} von {gesamtMl} ml</span>
        <span>{Math.round(anteil * 100)} %</span>
      </div>
      <div style={{ height: 10, borderRadius: 10, background: "rgba(127,127,127,.22)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${anteil * 100}%`, height: "100%", borderRadius: 10, background: farbe, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {PORTIONEN.map((ml) => (
          <button key={ml} type="button" className="mp-tap" onClick={() => eintragen(ml)} disabled={menge >= gesamtMl} style={{ flex: 1, border: "none", borderRadius: 14, padding: "11px 4px", fontSize: 15, fontWeight: 900, cursor: menge >= gesamtMl ? "default" : "pointer", fontFamily: "inherit", background: farbe, color: "#fff", opacity: menge >= gesamtMl ? 0.5 : 1 }}>
            +{ml} ml
          </button>
        ))}
      </div>
    </div>
  );
}
