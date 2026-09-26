import React from "react";

// Einfache, flache Menschen-Figuren für die Vorstellung (26.09., Nutzerin:
// "Menschen, die gerade Tätigkeiten vollziehen oder erfolgreich die App
// benutzen"). Platzhalter, bis echte Bilder/Illustrationen da sind.
// Jede Pose sind Gelenkpunkte im 100×115-Raster; Glieder = dicke runde Linien.
const POSEN = {
  jubel: { h: [50, 17], n: [50, 30], hip: [50, 66], le: [37, 24], lh: [30, 8], re: [63, 24], rh: [70, 8], lk: [41, 86], lf: [35, 106], rk: [59, 86], rf: [65, 106], ding: "handyR", mund: "lachen" },
  strecken: { h: [50, 17], n: [50, 30], hip: [50, 66], le: [43, 18], lh: [47, 2], re: [57, 18], rh: [53, 2], lk: [46, 86], lf: [44, 106], rk: [54, 86], rf: [56, 106], mund: "laecheln", augen: "zu" },
  trinken: { h: [50, 17], n: [50, 30], hip: [50, 66], le: [40, 48], lh: [42, 64], re: [64, 46], rh: [57, 30], lk: [46, 86], lf: [45, 106], rk: [54, 86], rf: [55, 106], ding: "glas" },
  laufen: { h: [54, 17], n: [52, 30], hip: [48, 64], le: [38, 46], lh: [34, 34], re: [62, 46], rh: [70, 58], lk: [36, 82], lf: [24, 94], rk: [58, 84], rf: [56, 106], mund: "laecheln" },
  sitzen: { h: [50, 31], n: [50, 44], hip: [50, 80], le: [36, 62], lh: [32, 82], re: [64, 62], rh: [68, 82], lk: [30, 92], lf: [46, 100], rk: [70, 92], rf: [54, 100], mund: "laecheln", augen: "zu", boden: 102 },
  handy: { h: [50, 17], n: [50, 30], hip: [50, 66], le: [40, 48], lh: [42, 64], re: [62, 50], rh: [56, 40], lk: [46, 86], lf: [45, 106], rk: [54, 86], rf: [55, 106], ding: "handyVorne", mund: "laecheln", blick: "unten" },
  reden: { h: [50, 17], n: [50, 30], hip: [50, 66], le: [38, 46], lh: [36, 60], re: [64, 42], rh: [74, 34], lk: [46, 86], lf: [45, 106], rk: [54, 86], rf: [55, 106], mund: "offen" },
  gehen: { h: [52, 17], n: [51, 30], hip: [50, 66], le: [42, 46], lh: [40, 60], re: [58, 46], rh: [62, 60], lk: [44, 86], lf: [38, 106], rk: [56, 86], rf: [62, 106], mund: "laecheln" },
  kniebeuge: { h: [50, 34], n: [50, 47], hip: [50, 80], le: [34, 44], lh: [30, 36], re: [66, 44], rh: [70, 36], lk: [34, 88], lf: [38, 106], rk: [66, 88], rf: [62, 106], ding: "hantel", mund: "laecheln" },
  liegestuetz: { h: [16, 62], n: [26, 68], hip: [62, 78], le: [28, 82], lh: [28, 100], re: [32, 84], rh: [34, 100], lk: [80, 88], lf: [96, 100], rk: [80, 90], rf: [96, 102], mund: "laecheln", boden: 102 },
  kettlebell: { h: [46, 20], n: [48, 33], hip: [52, 68], le: [58, 46], lh: [70, 50], re: [60, 48], rh: [72, 52], lk: [44, 86], lf: [42, 106], rk: [62, 86], rf: [64, 106], ding: "kettlebell", mund: "laecheln" },
};

const TYPEN = [
  { haut: "#F2C9A0", haar: "#3B2A20", shirt: "#F08A24", hose: "#2B3480", frisur: "lang" },
  { haut: "#8D5A3B", haar: "#1B1410", shirt: "#1FA39A", hose: "#1B2350", frisur: "kurz" },
  { haut: "#D9A477", haar: "#7A3E1F", shirt: "#E0352B", hose: "#3B4A8C", frisur: "dutt" },
  { haut: "#F5D6BA", haar: "#C99A3A", shirt: "#5B5BD6", hose: "#243060", frisur: "kurz" },
  { haut: "#6B4128", haar: "#141014", shirt: "#2D6FD6", hose: "#1B2350", frisur: "locken" },
];

function Glied({ a, b, c, farbe, breite }) {
  return <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}${c ? ` L${c[0]} ${c[1]}` : ""}`} stroke={farbe} strokeWidth={breite} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

export default function MenschFigur({ pose = "gehen", typ = 0, size = 90, label, style }) {
  const p = POSEN[pose] || POSEN.gehen;
  const t = TYPEN[typ % TYPEN.length];
  const [hx, hy] = p.h;
  const ay = hy + (p.blick === "unten" ? 2 : 0);
  return (
    <svg viewBox="0 0 100 115" width={size} height={size * 1.15} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ display: "block", overflow: "visible", ...style }}>
      <ellipse cx="50" cy={(p.boden || 110) + 1} rx="26" ry="3.5" fill="#1B2350" opacity=".12" />
      <Glied a={p.hip} b={p.lk} c={p.lf} farbe={t.hose} breite={9} />
      <Glied a={p.hip} b={p.rk} c={p.rf} farbe={t.hose} breite={9} />
      <circle cx={p.lf[0]} cy={p.lf[1]} r="4" fill="#fff" stroke="#D5D8E4" />
      <circle cx={p.rf[0]} cy={p.rf[1]} r="4" fill="#fff" stroke="#D5D8E4" />
      <Glied a={p.n} b={p.hip} farbe={t.shirt} breite={18} />
      {p.ding === "hantel" && (
        <g>
          <path d="M14 36 H86" stroke="#4A5068" strokeWidth="3" strokeLinecap="round" />
          <rect x="10" y="28" width="7" height="16" rx="2" fill="#2B3480" />
          <rect x="83" y="28" width="7" height="16" rx="2" fill="#2B3480" />
        </g>
      )}
      <Glied a={p.n} b={p.le} c={p.lh} farbe={t.shirt} breite={7} />
      <Glied a={p.n} b={p.re} c={p.rh} farbe={t.shirt} breite={7} />
      <circle cx={p.lh[0]} cy={p.lh[1]} r="3.6" fill={t.haut} />
      <circle cx={p.rh[0]} cy={p.rh[1]} r="3.6" fill={t.haut} />
      {p.ding === "handyR" && <rect x={p.rh[0] - 3} y={p.rh[1] - 10} width="7" height="12" rx="1.5" fill="#1B2350" stroke="#fff" strokeWidth="1" />}
      {p.ding === "handyVorne" && <rect x={p.rh[0] - 9} y={p.rh[1] - 7} width="9" height="13" rx="1.5" fill="#1B2350" stroke="#F4C542" strokeWidth="1.2" />}
      {p.ding === "glas" && <path d={`M${p.rh[0] - 4} ${p.rh[1] - 9} L${p.rh[0] + 3} ${p.rh[1] - 9} L${p.rh[0] + 2} ${p.rh[1] + 3} L${p.rh[0] - 3} ${p.rh[1] + 3} Z`} fill="#9FD3FF" stroke="#2D6FD6" strokeWidth="1" />}
      {p.ding === "kettlebell" && (
        <g>
          <circle cx="75" cy="64" r="8" fill="#2B3480" />
          <path d="M70 57 Q75 48 80 57" stroke="#2B3480" strokeWidth="3" fill="none" />
        </g>
      )}
      {t.frisur === "lang" && (
        <>
          <rect x={hx - 12.5} y={hy - 3} width="7" height="19" rx="3.5" fill={t.haar} />
          <rect x={hx + 5.5} y={hy - 3} width="7" height="19" rx="3.5" fill={t.haar} />
        </>
      )}
      {t.frisur === "dutt" && <circle cx={hx} cy={hy - 12} r="5" fill={t.haar} />}
      <circle cx={hx} cy={hy} r="10" fill={t.haut} />
      {t.frisur === "locken" ? (
        [-8, -3, 3, 8].map((d) => <circle key={d} cx={hx + d} cy={hy - 8} r="4.5" fill={t.haar} />)
      ) : (
        <path d={`M${hx - 10.5} ${hy + 1} Q${hx - 10} ${hy - 12} ${hx} ${hy - 11} Q${hx + 10} ${hy - 12} ${hx + 10.5} ${hy + 1} Q${hx + 4} ${hy - 6} ${hx - 10.5} ${hy + 1} Z`} fill={t.haar} />
      )}
      {p.augen === "zu" ? (
        <path d={`M${hx - 5} ${ay} q2 1.5 4 0 M${hx + 1} ${ay} q2 1.5 4 0`} stroke="#1B2350" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx={hx - 3.5} cy={ay} r="1.2" fill="#1B2350" />
          <circle cx={hx + 3.5} cy={ay} r="1.2" fill="#1B2350" />
        </>
      )}
      {p.mund === "lachen" && <path d={`M${hx - 4} ${hy + 4} Q${hx} ${hy + 9} ${hx + 4} ${hy + 4} Z`} fill="#fff" stroke="#1B2350" strokeWidth="1" />}
      {p.mund === "laecheln" && <path d={`M${hx - 3.5} ${hy + 4.5} Q${hx} ${hy + 7.5} ${hx + 3.5} ${hy + 4.5}`} stroke="#1B2350" strokeWidth="1.2" fill="none" strokeLinecap="round" />}
      {p.mund === "offen" && <ellipse cx={hx} cy={hy + 5.5} rx="2.2" ry="1.8" fill="#1B2350" />}
    </svg>
  );
}
