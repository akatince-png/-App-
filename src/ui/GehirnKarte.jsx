import React, { useMemo, useState } from "react";
import { berechneGehirn } from "../utils/gehirn";
import { KATEGORIEN } from "../utils/errungenschaften";

const KATEGORIE_LABEL = new Map(KATEGORIEN.map((k) => [k.key, k.label]));

// "Dein Gehirn" auf Home (ersetzt "Deine Welt" mit den Pflanzen, 23.09.,
// Logik: utils/gehirn.js). Seitenansicht eines Gehirns, aufgeteilt in sechs
// Regionen, die mit den aktiven Tagen der letzten Woche aufleuchten; laufende
// Serien verbinden Regionen als leuchtende Nervenbahnen. Antippen einer
// Region erklärt, warum sie dem ADHS-Gehirn hilft. Die Grafik ist bewusst
// selbst gezeichnet (SVG) und lässt sich später gegen eine gestaltete
// Illustration (z. B. aus Canva) tauschen, ohne die Logik anzufassen.

const GROSSHIRN =
  "M 72 158 C 38 150 22 112 34 82 C 44 52 76 30 116 24 C 150 16 190 16 222 28 C 258 40 284 66 290 100 C 296 132 280 158 252 166 C 236 171 220 169 206 166 C 188 174 162 178 136 174 C 112 178 88 170 72 158 Z";
const KLEINHIRN = "M 206 168 C 214 188 238 200 262 196 C 285 192 296 176 289 160 C 280 168 266 172 252 170 C 236 172 220 171 206 168 Z";
const HIRNSTAMM = "M 196 170 C 200 186 203 202 205 222 C 210 228 218 228 223 222 C 222 204 222 190 226 176 Z";

// Regionen als Polygone, die an der Großhirn-Kontur zugeschnitten werden.
const FLAECHEN = {
  fokus: "0,0 128,0 118,98 0,126",
  bewegung: "128,0 176,0 168,102 118,98",
  energie: "176,0 320,0 320,78 236,108 168,102",
  rhythmus: "320,78 320,250 262,250 236,108",
  ruhe: "0,126 118,98 168,102 236,108 262,250 0,250",
};
const PUNKT = {
  fokus: [76, 94],
  bewegung: [145, 56],
  energie: [222, 62],
  rhythmus: [266, 122],
  ruhe: [152, 142],
  erholung: [252, 184],
};
const WINDUNGEN = [
  "M 50 100 C 66 86 84 102 100 86",
  "M 78 56 C 96 66 110 48 128 58",
  "M 60 128 C 78 118 92 134 112 124",
  "M 150 32 C 160 58 150 78 162 96",
  "M 186 40 C 202 60 226 48 242 66",
  "M 196 92 C 214 80 232 98 256 88",
  "M 248 116 C 262 104 274 126 286 114",
  "M 96 150 C 120 138 140 158 166 146",
  "M 176 150 C 196 138 216 156 236 146",
];

function bahn([x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 18;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function deckkraft(r) {
  if (r.zustand === "leer") return 0.05;
  if (r.zustand === "ruht") return 0.26;
  return 0.38 + 0.62 * r.ladung;
}

export default function GehirnKarte({ kategorien, onOpenErfolge }) {
  const gehirn = useMemo(() => berechneGehirn(kategorien), [kategorien]);
  const [gewaehlt, setGewaehlt] = useState(null);
  const auswahl = gehirn.regionen.find((r) => r.key === gewaehlt) || null;
  const prozent = Math.round(gehirn.gesamtLadung * 100);

  const region = (r) => {
    const props = {
      // Ungenutzte Regionen neutral statt in ihrer Farbe — sonst wirkt eine
      // große Fläche (z. B. "Ruhe") schon "aktiv", obwohl nichts passiert ist.
      fill: r.zustand === "leer" ? "#C8CEF0" : r.farbe,
      fillOpacity: deckkraft(r),
      className: r.zustand === "aktiv" ? "mp-gehirn-aktiv" : r.zustand === "ruht" ? "mp-gehirn-ruht" : undefined,
      style: { cursor: "pointer", transition: "fill-opacity 0.6s ease" },
      onClick: () => setGewaehlt((g) => (g === r.key ? null : r.key)),
    };
    if (r.key === "erholung") {
      return (
        <g key={r.key} {...props}>
          <path d={KLEINHIRN} />
          <path d={HIRNSTAMM} />
        </g>
      );
    }
    return <polygon key={r.key} points={FLAECHEN[r.key]} clipPath="url(#mp-grosshirn)" {...props} />;
  };

  return (
    <div
      style={{
        marginBottom: 20,
        borderRadius: 24,
        padding: 16,
        color: "#fff",
        background: "radial-gradient(120% 90% at 30% 20%, #2C3470 0%, #171B3A 60%, #10132B 100%)",
        boxShadow: "0 14px 30px rgba(16, 19, 43, 0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🧠 Dein Gehirn</div>
        <button
          type="button"
          onClick={onOpenErfolge}
          className="mp-tap"
          style={{ border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}
        >
          Erfolge ›
        </button>
      </div>
      <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 4 }}>
        {gehirn.genutzt === 0
          ? "Noch alles ruhig — hake heute etwas ab, dann leuchtet die erste Region auf."
          : `Diese Woche zu ${prozent} % aufgeladen · ${gehirn.aktiv} von ${gehirn.genutzt} Bereichen aktiv`}
      </div>

      <svg viewBox="0 12 320 222" role="img" aria-label={`Dein Gehirn, diese Woche zu ${prozent} Prozent aufgeladen`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "6px auto 0" }}>
        <defs>
          <clipPath id="mp-grosshirn">
            <path d={GROSSHIRN} />
          </clipPath>
          <filter id="mp-gehirn-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grundform */}
        <path d={GROSSHIRN} fill="#20264D" />
        <path d={KLEINHIRN} fill="#20264D" />
        <path d={HIRNSTAMM} fill="#20264D" />

        {/* Regionen (leuchten mit Ladung) */}
        <g filter="url(#mp-gehirn-glow)">{gehirn.regionen.map(region)}</g>

        {/* Windungen + Regionsgrenzen als feine Linien */}
        <g clipPath="url(#mp-grosshirn)" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeLinecap="round" style={{ pointerEvents: "none" }}>
          {WINDUNGEN.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" style={{ pointerEvents: "none" }}>
          <path d="M 222 180 C 240 186 262 186 282 176" />
          <path d="M 216 172 C 236 178 262 178 286 166" />
        </g>
        <path d={GROSSHIRN} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" style={{ pointerEvents: "none" }} />

        {/* Nervenbahnen: leuchten, wenn beide Regionen eine Serie haben */}
        <g fill="none" strokeLinecap="round" style={{ pointerEvents: "none" }}>
          {gehirn.verbindungen.map((v) => (
            <path
              key={`${v.a}-${v.b}`}
              d={bahn(PUNKT[v.a], PUNKT[v.b])}
              stroke={v.aktiv ? "#FFFFFF" : "rgba(255,255,255,0.14)"}
              strokeWidth={v.aktiv ? 2.2 : 1.2}
              strokeDasharray={v.aktiv ? "6 7" : "2 6"}
              className={v.aktiv ? "mp-gehirn-bahn" : undefined}
              opacity={v.aktiv ? 0.85 : 1}
            />
          ))}
        </g>

        {/* Regions-Symbole (antippbar) */}
        {gehirn.regionen.map((r) => {
          const [x, y] = PUNKT[r.key];
          const an = gewaehlt === r.key;
          return (
            <g
              key={r.key}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}: ${r.zustand === "aktiv" ? `an ${r.tageWoche} von 7 Tagen aktiv` : r.zustand === "ruht" ? "ruht gerade" : "noch nicht genutzt"}`}
              onClick={() => setGewaehlt((g) => (g === r.key ? null : r.key))}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setGewaehlt((g) => (g === r.key ? null : r.key))}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <circle cx={x} cy={y} r={an ? 17 : 14} fill={r.zustand === "leer" ? "rgba(255,255,255,0.1)" : r.farbe} stroke="#fff" strokeOpacity={an ? 1 : 0.5} strokeWidth={an ? 2.5 : 1.2} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="14" style={{ pointerEvents: "none" }}>
                {r.zustand === "ruht" ? "💤" : r.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      {auswahl ? (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.08)", borderLeft: `4px solid ${auswahl.farbe}` }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {auswahl.emoji} {auswahl.label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: auswahl.zustand === "aktiv" ? "#fff" : "rgba(255,255,255,0.7)" }}>
            {auswahl.zustand === "aktiv"
              ? `An ${auswahl.tageWoche} von 7 Tagen aufgeladen${auswahl.serie > 0 ? ` · 🔥 ${auswahl.serie} ${auswahl.serie === 1 ? "Tag" : "Tage"} Serie` : ""}`
              : auswahl.zustand === "ruht"
                ? "Ruht gerade — nichts geht verloren. Ein Haken hier, und sie leuchtet wieder."
                : "Noch nicht genutzt."}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6, opacity: 0.9 }}>{auswahl.text}</div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.65 }}>Dazu zählt: {auswahl.kategorien.map((k) => KATEGORIE_LABEL.get(k) || k).join(", ")}</div>
        </div>
      ) : (
        gehirn.genutzt > 0 && <div style={{ fontSize: 11.5, opacity: 0.65, textAlign: "center", marginTop: 4 }}>Tippe auf eine Region, um zu sehen, was sie für dich tut.</div>
      )}
    </div>
  );
}
