import React, { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";
import { cardBorder, textMuted } from "./theme";
import { aktuellesGewicht, makroZiele, tagesTipp, tagesWerte, verhaeltnis } from "../utils/essenRechner";
import { plusTage, wochenBeginn } from "../utils/schichtplan";
import { toLocalISODate } from "../utils/dates";

// Tagesbilanz (25.09., Vorschau freigegeben): Eiweiß, Fett, Kohlenhydrate,
// Kalorien gegen das Ziel, Omega-3 heute, Omega-6 : 3 über 7 Tage, Fisch
// diese Woche und ein konkreter Tipp für den Rest des Tages.
const fmt = (n) => String(Math.round(Number(n) * 10) / 10).replace(".", ",");

function Balken({ label, ist, soll, farbe, einheit = "g" }) {
  const p = soll ? Math.min(100, Math.round((ist / soll) * 100)) : 0;
  return (
    <div style={{ margin: "7px 0" }} data-balken={label}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
        <span>{label}</span>
        <b>
          {fmt(ist)}
          {soll ? ` / ${fmt(soll)}` : ""} {einheit}
        </b>
      </div>
      <div style={{ height: 8, borderRadius: 5, background: "#E4E6EE", marginTop: 3 }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 5, background: farbe }} />
      </div>
    </div>
  );
}

// Hinweis passend zur Tageszeit/zum Tag – Einordnung aus der Studien-
// auswertung (Wissens-Basis "Ernährung bei ADHS"), ohne Wirkversprechen.
function neuroTipp(ist, stunde) {
  if (ist.zucker > 50) return "🍬 Viel Süßes heute – lieber nach einer Mahlzeit oder nach dem Sport als allein auf leeren Magen.";
  if (stunde < 11 && ist.eiweiss < 20) return "🍳 Eiweiß zum Frühstück (z. B. Eier, Skyr, Quark) hält länger satt und den Blutzucker gleichmäßiger.";
  if (stunde >= 13 && ist.anzahl === 0) return "⏰ Noch nichts eingetragen – regelmäßig essen hilft, auch wenn der Hunger fehlt. Eine kleine Mahlzeit mit Eiweiß reicht.";
  return null;
}

export default function ErnaehrungBilanz() {
  const { essenEintraege = [], essenEntfernen, mahlzeiten = [], mahlzeitErledigt = {}, categoryZiele = {}, personalData = {}, gewichtsEintraege = [] } = useAppData();
  const heute = toLocalISODate(new Date());
  const quelle = { essenEintraege, mahlzeiten, mahlzeitErledigt };
  const ist = tagesWerte(heute, quelle);
  const zielE = categoryZiele.ernaehrung || {};
  const z = makroZiele(zielE, aktuellesGewicht(gewichtsEintraege, personalData), zielE.kalorienZiel);
  const woche = useMemo(() => {
    let o3 = 0;
    let o6 = 0;
    for (let i = 0; i < 7; i++) {
      const w = tagesWerte(plusTage(heute, -i), quelle);
      o3 += w.omega3;
      o6 += w.omega6;
    }
    const ws = wochenBeginn(heute);
    let fisch = 0;
    for (let d = ws; d <= heute; d = plusTage(d, 1)) if (tagesWerte(d, quelle).epaDha >= 500) fisch++;
    return { ratio: verhaeltnis(o6, o3), fisch };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essenEintraege, mahlzeiten, mahlzeitErledigt, heute]);
  const tipp = tagesTipp(ist, z, zielE.quellen);
  const neuro = neuroTipp(ist, new Date().getHours());
  const heuteEintraege = essenEintraege.filter((e) => e.datum === heute);

  return (
    <section aria-label="Ernährung heute" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: `1.5px solid ${cardBorder}` }}>
      <div style={{ fontWeight: 900, fontSize: 15.5 }}>📊 Heute</div>
      <Balken label="🥚 Eiweiß" ist={ist.eiweiss} soll={z.eiweiss} farbe="#2E9C86" />
      <Balken label="🥑 Fett" ist={ist.fett} soll={z.fett} farbe="#E0A21B" />
      <Balken label="🍞 Kohlenhydrate" ist={ist.kh} soll={z.kh} farbe="#5C7CE0" />
      <Balken label="🔥 Kalorien" ist={ist.kcal} soll={z.kcal} farbe="#9AA0AA" einheit="kcal" />
      <div style={{ fontSize: 12.5, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "8px 10px", marginTop: 10, lineHeight: 1.8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>🐟 Omega-3 EPA/DHA heute</span>
          <b style={{ color: ist.epaDha >= z.omega3Mg ? "#1E8E5A" : "#15181A" }}>
            {ist.epaDha} / {z.omega3Mg} mg{ist.epaDha >= z.omega3Mg ? " ✓" : ""}
          </b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>⚖️ Omega-6 : 3 (7 Tage)</span>
          <b style={{ color: woche.ratio == null ? textMuted : woche.ratio <= z.omega6zu3Max ? "#1E8E5A" : "#C27A00" }}>{woche.ratio == null ? "–" : `${fmt(woche.ratio)} : 1`}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>🐟 Fisch-Tage diese Woche</span>
          <b>
            {woche.fisch} von {z.fischProWoche}
          </b>
        </div>
      </div>
      {tipp && <div style={{ fontSize: 12.5, background: "#FFF6E0", borderRadius: 12, padding: "8px 10px", marginTop: 8 }}>💡 {tipp}</div>}
      {neuro && <div style={{ fontSize: 12.5, background: "#E8F7F2", borderRadius: 12, padding: "8px 10px", marginTop: 8 }}>{neuro}</div>}
      {heuteEintraege.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, marginBottom: 4 }}>HEUTE EINGETRAGEN</div>
          {heuteEintraege.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, padding: "5px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <span style={{ flex: 1 }}>
                {e.uhrzeit && <b>{e.uhrzeit} </b>}
                {e.text}
                <span style={{ color: textMuted }}>
                  {" "}
                  · {Math.round(e.werte.kcal)} kcal · {fmt(e.werte.eiweiss)} g E
                </span>
              </span>
              <button type="button" aria-label={`${e.text} löschen`} onClick={() => window.confirm("Eintrag löschen?") && essenEntfernen?.(e.id)} style={{ border: "none", background: "transparent", color: "#E0352B", fontSize: 18, cursor: "pointer" }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
