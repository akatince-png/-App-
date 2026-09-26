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

const glow = (a, farbe) => ({ fill: farbe, fillOpacity: 0.18 + a * 0.72, filter: a > 0.6 ? "url(#mp-koerper-glow)" : undefined, transition: "fill-opacity .6s" });

export default function KoerperFigur() {
  const d = useAppData();
  const w = koerperWerte(d);
  const linie = { fill: "none", stroke: "#fff", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.9 };
  return (
    <div aria-label="Dein Körper heute" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <svg viewBox="0 0 120 200" role="img" aria-label={`Körper: Schlaf ${Math.round(w.kopf * 100)} %, Bewegung ${Math.round(w.bewegung * 100)} %, Tageslicht ${Math.round(w.licht * 100)} %`} style={{ width: "100%", maxWidth: 170, display: "block" }}>
        <defs>
          <filter id="mp-koerper-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="mp-koerper-licht" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFD166" stopOpacity={0.05 + w.licht * 0.45} />
            <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Tageslicht-Schein */}
        <ellipse cx="60" cy="95" rx="58" ry="98" fill="url(#mp-koerper-licht)" />
        {/* Zonen */}
        <circle cx="60" cy="24" r="15" style={glow(w.kopf, "#8E7CF0")} />
        <path d="M44 46 Q60 40 76 46 L78 78 Q60 84 42 78 Z" style={glow(w.brust, "#5DD6C6")} />
        <path d="M42 80 Q60 86 78 80 L76 108 Q60 114 44 108 Z" style={glow(w.bauch, "#4FA3FF")} />
        <path d="M43 48 L24 92 L30 95 L47 60 Z M77 48 L96 92 L90 95 L73 60 Z" style={glow(w.bewegung, "#F2994A")} />
        <path d="M46 110 L40 180 L50 182 L58 118 Z M74 110 L80 180 L70 182 L62 118 Z" style={glow(w.bewegung, "#F2994A")} />
        {/* Umriss */}
        <circle cx="60" cy="24" r="15" style={linie} />
        <path d="M60 39 L60 44 M44 46 Q60 40 76 46 L96 92 L90 95 L76 62 L76 108 L80 180 L70 182 L60 118 L50 182 L40 180 L44 108 L44 62 L30 95 L24 92 Z" style={linie} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 4, maxWidth: 200 }}>
        {w.chips.map(([emoji, wert, label]) => (
          <span key={label} title={label} style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 7px", borderRadius: 99, background: "rgba(255,255,255,0.14)", whiteSpace: "nowrap" }}>
            {emoji} {wert}
          </span>
        ))}
      </div>
    </div>
  );
}
