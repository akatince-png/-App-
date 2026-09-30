import React from "react";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";

// Körper neben dem Gehirn (26.09., Skizze der Nutzerin): eine Figur, deren
// Zonen mit den Tageswerten leuchten – Kopf = Schlaf, Brust = Atem/Ruhe,
// Bauch = Essen + Wasser, Arme/Beine = Bewegung, Schein rundherum =
// Tageslicht. Darunter die Werte als kleine Chips. Puls/Uhr-Daten kommen
// erst mit einer Smartwatch-Anbindung (siehe Übergabe).
const clamp = (x) => Math.max(0, Math.min(1, x || 0));

export function koerperWerte(d, heute = toLocalISODate(new Date())) {
  const wasserMl = (d.hydrationEintraege || []).filter((e) => e.datum === heute).reduce((s, e) => s + (Number(e.mengeMl) || 0), 0);
  const wasserZiel = Number(d.hydrationZielMl) || 2000;
  const lichtMin = Number(d.tageslichtHeuteMinuten) || 0;
  const lichtZiel = Number(d.tageslichtZielMinuten) || 30;
  const schlaf = [...(d.schlafEintraege || [])].sort((a, b) => String(a.datum).localeCompare(String(b.datum))).at(-1);
  const schlafH = schlaf && schlaf.datum >= toLocalISODate(new Date(Date.now() - 2 * 86400000)) ? Number(schlaf.stunden) || 0 : 0;
  const trainingHeute = (d.trainingEintraege || []).filter((t) => t.datum === heute);
  const trainingOk = trainingHeute.some((t) => t.erledigt);
  const essen = (d.essenEintraege || []).filter((e) => e.datum === heute);
  const eiweiss = essen.reduce((s, e) => s + (Number(e.werte?.eiweiss) || 0), 0);
  const atem = (d.atemuebungLogs || []).some((l) => toLocalISODate(new Date(l.erstelltAm)) === heute);
  const gewicht = (d.gewichtsEintraege || []).filter((e) => Number(e.gewicht)).at(-1)?.gewicht;
  return {
    kopf: clamp(schlafH / 7.5),
    brust: atem ? 1 : 0,
    bauch: clamp((wasserMl / wasserZiel) * 0.6 + (essen.length ? 0.4 : 0)),
    bewegung: trainingOk ? 1 : trainingHeute.length ? 0.2 : clamp(lichtMin / 60),
    licht: clamp(lichtMin / lichtZiel),
    chips: [
      ["😴", schlafH ? `${String(Math.round(schlafH * 10) / 10).replace(".", ",")} h` : "–", "Schlaf"],
      ["💧", `${String(Math.round(wasserMl / 100) / 10).replace(".", ",")}/${String(wasserZiel / 1000).replace(".", ",")} l`, "Wasser"],
      ["☀️", `${lichtMin}/${lichtZiel} min`, "Tageslicht"],
      ["🏋️", trainingOk ? "✓" : trainingHeute.length ? "offen" : "–", "Training"],
      ["🍽️", eiweiss ? `${Math.round(eiweiss)} g Eiweiß` : `${essen.length}×`, "Essen"],
      ...(gewicht ? [["⚖️", `${String(gewicht).replace(".", ",")} kg`, "Gewicht"]] : []),
    ],
  };
}

// Design 2.0 (28.09., Nutzerin: „Körperfigur gerne überarbeiten“): weiche,
// freundliche Silhouette aus abgerundeten Formen statt kantigem Umriss.
// Jede Zone liegt als Grundfläche (zart) und leuchtet darüber mit ihrem Wert.
const ZONEN = {
  kopf: "#A393FF",
  brust: "#5DD6C6",
  bauch: "#5AAEFF",
  bewegung: "#FFA85C",
};
const deck = (a) => 0.16 + a * 0.84;
const RUMPF = "M40 52 C40 45 46 41 53 41 L67 41 C74 41 80 45 80 52 L79 104 C79 112 73 117 65 117 L55 117 C47 117 41 112 41 104 Z";
const ARM_L = "M42 50 C34 60 29 74 26 92";
const ARM_R = "M78 50 C86 60 91 74 94 92";
const BEIN_L = "M52 114 C51 138 50 158 49 182";
const BEIN_R = "M68 114 C69 138 70 158 71 182";

// `werte` (optional): feste Beispielwerte statt der eigenen Tagesdaten,
// z. B. in der Vorstellung vor dem Start (VorstellungView).
// Werte flach in einer Zeile (30.09., Nutzerin: „die kleinen Daten unter
// dem Mannequin flach nebeneinander“) – unter Gehirn und Figur, über die
// ganze Kartenbreite, bei Platzmangel seitlich wischbar.
export function KoerperChips({ werte = null }) {
  const d = useAppData();
  const w = werte || koerperWerte(d);
  return (
    <div data-koerper-chips style={{ display: "flex", flexWrap: "nowrap", gap: 6, justifyContent: "center", overflowX: "auto", scrollbarWidth: "none", margin: "8px -4px 0", padding: "0 4px" }}>
      {w.chips.map(([emoji, wert, label]) => (
        <span key={label} title={label} style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 99, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)", border: "1px solid rgba(var(--gk-rgb, 255, 255, 255), 0.14)", whiteSpace: "nowrap" }}>
          {emoji} {wert}
        </span>
      ))}
    </div>
  );
}

export default function KoerperFigur({ werte = null, ohneChips = false }) {
  const d = useAppData();
  const w = werte || koerperWerte(d);
  const grund = "rgba(var(--gk-rgb, 255, 255, 255), 0.14)";
  const glied = (dPfad, breite, a) => (
    <>
      <path d={dPfad} style={{ stroke: grund }} strokeWidth={breite} strokeLinecap="round" fill="none" />
      <path d={dPfad} stroke={ZONEN.bewegung} strokeOpacity={deck(a) * 0.9} strokeWidth={breite - 2} strokeLinecap="round" fill="none" filter={a > 0.6 ? "url(#mp-koerper-glow)" : undefined} style={{ transition: "stroke-opacity .6s" }} />
    </>
  );
  return (
    <div aria-label="Dein Körper heute" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <svg viewBox="0 0 120 200" role="img" aria-label={`Körper: Schlaf ${Math.round(w.kopf * 100)} %, Bewegung ${Math.round(w.bewegung * 100)} %, Tageslicht ${Math.round(w.licht * 100)} %`} style={{ width: "100%", maxWidth: 160, display: "block" }}>
        <defs>
          <filter id="mp-koerper-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="mp-koerper-licht" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#FFD166" stopOpacity={0.04 + w.licht * 0.5} />
            <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mp-koerper-glanz" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="mp-koerper-brust">
            <rect x="0" y="0" width="120" height="80" />
          </clipPath>
          <clipPath id="mp-koerper-bauch">
            <rect x="0" y="80" width="120" height="60" />
          </clipPath>
        </defs>
        {/* Tageslicht-Schein */}
        <ellipse cx="60" cy="96" rx="58" ry="100" fill="url(#mp-koerper-licht)" />
        {/* Beine und Arme (Bewegung) */}
        {glied(BEIN_L, 15, w.bewegung)}
        {glied(BEIN_R, 15, w.bewegung)}
        {glied(ARM_L, 12, w.bewegung)}
        {glied(ARM_R, 12, w.bewegung)}
        {/* Rumpf: Brust (Atem/Ruhe) und Bauch (Essen + Wasser) */}
        <path d={RUMPF} style={{ fill: grund }} />
        <path d={RUMPF} clipPath="url(#mp-koerper-brust)" fill={ZONEN.brust} fillOpacity={deck(w.brust) * 0.9} filter={w.brust > 0.6 ? "url(#mp-koerper-glow)" : undefined} style={{ transition: "fill-opacity .6s" }} />
        <path d={RUMPF} clipPath="url(#mp-koerper-bauch)" fill={ZONEN.bauch} fillOpacity={deck(w.bauch) * 0.9} filter={w.bauch > 0.6 ? "url(#mp-koerper-glow)" : undefined} style={{ transition: "fill-opacity .6s" }} />
        <path d="M44 80 Q60 84 76 80" style={{ stroke: "rgba(var(--gk-rgb, 255, 255, 255), 0.35)" }} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d={RUMPF} fill="url(#mp-koerper-glanz)" />
        {/* Hals + Kopf (Schlaf) */}
        <rect x="55" y="34" width="10" height="9" rx="4" style={{ fill: grund }} />
        <circle cx="60" cy="22" r="14" style={{ fill: grund }} />
        <circle cx="60" cy="22" r="14" fill={ZONEN.kopf} fillOpacity={deck(w.kopf) * 0.9} filter={w.kopf > 0.6 ? "url(#mp-koerper-glow)" : undefined} style={{ transition: "fill-opacity .6s" }} />
        <circle cx="60" cy="22" r="14" fill="url(#mp-koerper-glanz)" />
      </svg>
      {!ohneChips && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 4, maxWidth: 200 }}>
        {w.chips.map(([emoji, wert, label]) => (
          <span key={label} title={label} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)", border: "1px solid rgba(var(--gk-rgb, 255, 255, 255), 0.14)", whiteSpace: "nowrap" }}>
            {emoji} {wert}
          </span>
        ))}
      </div>
      )}
    </div>
  );
}
