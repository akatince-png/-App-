import React, { useMemo, useState } from "react";
import { berechneGehirnZeitraum, WIDGET_REGION } from "../utils/gehirn";
import { KATEGORIEN } from "../utils/errungenschaften";
import { KATEGORIE_META } from "../utils/dayItems";
import { logoBlau, logoTuerkis, logoVerlauf, nachtSchatten, nachtVerlauf } from "./theme";
import Icon from "./Icon";

// "Dein Gehirn" + Tagesfortschritt in EINER Karte (Nutzerinnen-Wunsch
// 23.09.: "das Diagramm sollte auch in dieser Fläche mit dargestellt
// werden"). Gehirn in Seitenansicht — damit z. B. die Schlafregion
// (Kleinhirn) unten liegen kann —, aber "wolkig" mit gewölbtem Umriss und
// Windungen im Stil des Logos (Türkis → Blau auf Nachtblau).
// Eine Zeitraum-Wahl (Tag/Woche/Monat/Gesamt) steuert beides: die Balken je
// Bereich (utils/zeitraumFortschritt.js) und die Ladung der sechs Regionen
// (utils/gehirn.js: berechneGehirnZeitraum). Laufende Serien leuchten als
// Nervenbahnen. Antippen einer Region hebt ihre Balken hervor und erklärt,
// warum sie dem ADHS-Gehirn hilft.
// Die Grafik ist selbst gezeichnet (SVG) und lässt sich später gegen eine
// gestaltete Illustration tauschen, ohne die Logik anzufassen.

const KATEGORIE_LABEL = new Map(KATEGORIEN.map((k) => [k.key, k.label]));
const ZEITRAUM_TEXT = { tag: "Heute", woche: "Diese Woche", monat: "Diesen Monat", gesamt: "Seit Protokollstart" };

// Großhirn mit gewölbtem Rand (lauter kleine Bögen = "wolkig").
const GROSSHIRN =
  "M 70 150 A 26 26 0 0 1 58 108 A 26 26 0 0 1 86 70 A 26 26 0 0 1 128 50 A 26 26 0 0 1 172 44 A 26 26 0 0 1 214 54 A 26 26 0 0 1 250 80 A 24 24 0 0 1 270 118 A 22 22 0 0 1 256 156 A 20 20 0 0 1 220 166 A 22 22 0 0 1 184 174 A 22 22 0 0 1 146 176 A 22 22 0 0 1 108 170 A 22 22 0 0 1 70 150 Z";
const KLEINHIRN = "M 212 168 C 212 186 230 200 252 200 C 276 200 292 184 288 164 C 276 172 244 174 212 168 Z";
const HIRNSTAMM = "M 188 172 C 192 186 194 198 194 212 C 198 219 208 219 212 212 C 212 198 214 186 220 174 Z";

// Regionen als Flächen, an der Großhirn-Kontur zugeschnitten.
const FLAECHEN = {
  fokus: "0,0 118,0 108,104 0,132",
  bewegung: "118,0 170,0 162,104 108,104",
  energie: "170,0 320,0 320,86 236,112 162,104",
  rhythmus: "320,86 320,240 262,240 236,112",
  ruhe: "0,132 108,104 162,104 236,112 262,240 0,240",
};
const PUNKT = {
  fokus: [82, 106],
  bewegung: [138, 74],
  energie: [204, 82],
  rhythmus: [248, 128],
  ruhe: [150, 146],
  erholung: [250, 184],
};
// Windungen im Logo-Stil (geschwungene Linien mit runden Enden).
const WINDUNGEN = [
  "M 72 118 C 74 104 88 98 98 104",
  "M 96 72 C 110 70 118 80 114 92",
  "M 124 118 C 118 106 124 96 136 96",
  "M 150 58 C 160 66 158 80 148 86",
  "M 178 70 C 190 64 202 72 200 84",
  "M 176 118 C 188 110 204 116 206 128",
  "M 226 88 C 238 84 248 94 244 106",
  "M 110 150 C 118 140 132 140 138 150",
  "M 178 150 C 186 140 202 142 206 152",
  "M 224 136 C 232 128 246 132 248 142",
  // seitliche Furche zwischen Stirn-/Scheitel- und Schläfenbereich
  "M 102 132 C 130 120 162 118 198 126",
];

function bahn([x1, y1], [x2, y2]) {
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 16} ${x2} ${y2}`;
}

function deckkraft(r) {
  if (r.zustand === "leer") return 0.05;
  if (r.zustand === "offen") return 0.16;
  return 0.3 + 0.7 * r.ladung;
}

function Zeitraumwahl({ zeitraum, setZeitraum, zeigeGesamt }) {
  const optionen = [
    ["tag", "Tag"],
    ["woche", "Woche"],
    ["monat", "Monat"],
    ...(zeigeGesamt ? [["gesamt", "Gesamt"]] : []),
  ];
  return (
    <div role="group" aria-label="Zeitraum" style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: 3 }}>
      {optionen.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setZeitraum(id)}
          aria-pressed={zeitraum === id}
          className="mp-tap"
          style={{
            border: "none",
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            background: zeitraum === id ? "#fff" : "transparent",
            color: zeitraum === id ? "#171B3A" : "rgba(255,255,255,0.75)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function GehirnKarte({ kategorien, widgets, zeitraum, setZeitraum, tage, zeigeGesamt, onOpenErfolge, onDenksport, onOpenView }) {
  const gehirn = useMemo(() => berechneGehirnZeitraum({ widgets, kategorien, tage }), [widgets, kategorien, tage]);
  const [gewaehlt, setGewaehlt] = useState(null);
  const auswahl = gehirn.regionen.find((r) => r.key === gewaehlt) || null;
  const prozent = Math.round(gehirn.gesamtLadung * 100);
  const waehle = (key) => setGewaehlt((g) => (g === key ? null : key));
  const sichtbareBalken = (widgets || []).filter((w) => w.kategorie !== "notfallmodus");

  return (
    <div style={{ marginBottom: 20, borderRadius: 24, padding: 16, color: "#fff", background: nachtVerlauf, boxShadow: nachtSchatten }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🧠 Dein Gehirn</div>
        <Zeitraumwahl zeitraum={zeitraum} setZeitraum={setZeitraum} zeigeGesamt={zeigeGesamt} />
      </div>

      <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 8 }}>
        {gehirn.genutzt === 0
          ? "Noch alles ruhig — hake etwas ab, dann leuchtet die erste Region auf."
          : `${ZEITRAUM_TEXT[zeitraum] || "Heute"} zu ${prozent} % aufgeladen${prozent >= 100 ? " — alles leuchtet! 🎉" : ""}`}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.12)", marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: `${prozent}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.8s ease-out" }} />
      </div>

      <svg viewBox="20 30 285 205" role="img" aria-label={`Dein Gehirn, ${ZEITRAUM_TEXT[zeitraum] || "heute"} zu ${prozent} Prozent aufgeladen`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "8px auto 0" }}>
        <defs>
          <clipPath id="mp-grosshirn">
            <path d={GROSSHIRN} />
          </clipPath>
          <linearGradient id="mp-gehirn-verlauf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={logoTuerkis} />
            <stop offset="100%" stopColor={logoBlau} />
          </linearGradient>
          <clipPath id="mp-kleinhirn">
            <path d={KLEINHIRN} />
            <path d={HIRNSTAMM} />
          </clipPath>
          {/* Weiche Übergänge zwischen den Regionen statt harter Kanten */}
          <filter id="mp-gehirn-weich" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="mp-gehirn-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grundform (Hirnstamm hinten, Kleinhirn davor, Großhirn vorne) */}
        <path d={HIRNSTAMM} fill="#1D2350" />
        <path d={KLEINHIRN} fill="#1D2350" />
        <path d={GROSSHIRN} fill="#1D2350" />

        {/* Regionen leuchten mit ihrer Ladung — weich ineinander verlaufend,
            an der Hirnkontur zugeschnitten */}
        {[
          ["mp-grosshirn", gehirn.regionen.filter((r) => r.key !== "erholung")],
          ["mp-kleinhirn", gehirn.regionen.filter((r) => r.key === "erholung")],
        ].map(([clip, liste]) => (
          <g key={clip} clipPath={`url(#${clip})`}>
            <g filter="url(#mp-gehirn-weich)">
              {liste.map((r) => (
                <polygon
                  key={r.key}
                  points={r.key === "erholung" ? "180,150 300,150 300,240 180,240" : FLAECHEN[r.key]}
                  fill={r.zustand === "leer" ? "#C8CEF0" : r.farbe}
                  fillOpacity={gewaehlt && gewaehlt !== r.key ? deckkraft(r) * 0.45 : deckkraft(r)}
                  className={r.zustand === "aktiv" ? "mp-gehirn-aktiv" : undefined}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.6s ease" }}
                  onClick={() => waehle(r.key)}
                />
              ))}
            </g>
          </g>
        ))}

        {/* Logo-Linien: Umriss + Windungen */}
        <g fill="none" stroke="url(#mp-gehirn-verlauf)" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
          <path d={HIRNSTAMM} strokeWidth="3.5" />
          <path d={KLEINHIRN} strokeWidth="3.5" />
          <path d={GROSSHIRN} strokeWidth="4" />
          <g strokeWidth="3.5" opacity="0.85">
            {WINDUNGEN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g strokeWidth="2.5" opacity="0.6">
            <path d="M 222 182 C 240 188 262 188 282 178" />
            <path d="M 232 192 C 246 196 262 196 276 190" />
          </g>
        </g>

        {/* Nervenbahnen: Regionen mit laufender Serie */}
        <g fill="none" strokeLinecap="round" style={{ pointerEvents: "none" }}>
          {gehirn.verbindungen
            .filter((v) => v.aktiv)
            .map((v) => (
              <path key={`${v.a}-${v.b}`} d={bahn(PUNKT[v.a], PUNKT[v.b])} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 6" className="mp-gehirn-bahn" opacity="0.8" />
            ))}
        </g>

        {/* Regions-Symbole */}
        {gehirn.regionen.map((r) => {
          const [x, y] = PUNKT[r.key];
          const an = gewaehlt === r.key;
          return (
            <g
              key={r.key}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}: ${r.zustand === "leer" ? "noch nicht genutzt" : `zu ${Math.round(r.ladung * 100)} Prozent aufgeladen`}`}
              onClick={() => waehle(r.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && waehle(r.key)}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <circle
                cx={x}
                cy={y}
                r={an ? 14 : 12}
                fill={r.zustand === "leer" ? "#1B2146" : r.farbe}
                fillOpacity={r.zustand === "aktiv" ? 1 : 0.5}
                stroke={an ? "#fff" : "rgba(255,255,255,0.55)"}
                strokeWidth={an ? 2.5 : 1.2}
                strokeDasharray={r.zustand === "leer" ? "3 3" : undefined}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" style={{ pointerEvents: "none" }}>
                {r.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tagesfortschritt-Balken je Bereich — gleiche Zeitraum-Wahl wie oben */}
      <div style={{ marginTop: 6, padding: "12px 10px 8px", borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 4, height: 84 }}>
          {sichtbareBalken.map((w) => {
            const region = WIDGET_REGION[w.kategorie];
            const gedimmt = gewaehlt && region !== gewaehlt;
            const anteil = w.aktiv ? Math.min(1, (w.dailyCount || 0) / (w.dailyTotal || 1)) : 0;
            const farbe = w.farbe || KATEGORIE_META[w.kategorie]?.dot || logoTuerkis;
            return (
              <button
                key={w.kategorie}
                type="button"
                title={`${w.name}${w.aktiv ? `: ${Math.round(anteil * 100)} %` : " — noch nicht eingerichtet"}`}
                onClick={() => (region ? waehle(region) : onOpenView?.(w.viewId))}
                style={{ flex: 1, maxWidth: 26, height: "100%", display: "flex", alignItems: "flex-end", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
              >
                <span
                  style={{
                    width: "100%",
                    height: w.aktiv ? `${Math.max(6, Math.round(anteil * 100))}%` : "6%",
                    borderRadius: "6px 6px 2px 2px",
                    background: w.aktiv ? farbe : "rgba(255,255,255,0.14)",
                    opacity: gedimmt ? 0.3 : 1,
                    boxShadow: w.aktiv && anteil > 0 && !gedimmt ? `0 0 10px ${farbe}88` : "none",
                    transition: "height 0.6s ease-out, opacity 0.3s",
                  }}
                />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginTop: 7 }}>
          {sichtbareBalken.map((w) => {
            const icon = w.icon || KATEGORIE_META[w.kategorie]?.icon;
            const gedimmt = gewaehlt && WIDGET_REGION[w.kategorie] !== gewaehlt;
            return (
              <div key={w.kategorie} style={{ flex: 1, maxWidth: 26, display: "flex", justifyContent: "center", opacity: gedimmt ? 0.3 : w.aktiv ? 0.9 : 0.4 }}>
                {icon ? <Icon name={icon} size={14} color="#fff" strokeWidth={2} /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: "#fff" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {auswahl ? (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.08)", borderLeft: `4px solid ${auswahl.farbe}` }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {auswahl.emoji} {auswahl.label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, opacity: 0.9 }}>
            {auswahl.zustand === "leer"
              ? "Noch nicht genutzt."
              : `${ZEITRAUM_TEXT[zeitraum] || "Heute"} zu ${Math.round(auswahl.ladung * 100)} % aufgeladen${auswahl.serie > 0 ? ` · 🔥 ${auswahl.serie} ${auswahl.serie === 1 ? "Tag" : "Tage"} Serie` : ""}`}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6, opacity: 0.9 }}>{auswahl.text}</div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.65 }}>Dazu zählt: {auswahl.kategorien.map((k) => KATEGORIE_LABEL.get(k) || k).join(", ")}</div>
          {auswahl.key === "fokus" && onDenksport && (
            <button
              type="button"
              onClick={onDenksport}
              className="mp-tap"
              style={{ marginTop: 10, border: "none", borderRadius: 12, padding: "9px 14px", background: auswahl.farbe, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
            >
              🧩 Jetzt Denksport machen
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
          <div style={{ fontSize: 11.5, opacity: 0.65 }}>Tippe auf eine Region oder einen Balken.</div>
          <button
            type="button"
            onClick={onOpenErfolge}
            className="mp-tap"
            style={{ border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            Erfolge ›
          </button>
        </div>
      )}
    </div>
  );
}
