import React, { useMemo, useState } from "react";
import { berechneGehirn } from "../utils/gehirn";
import { KATEGORIEN } from "../utils/errungenschaften";

const KATEGORIE_LABEL = new Map(KATEGORIEN.map((k) => [k.key, k.label]));

// "Dein Gehirn" auf Home (ersetzt "Deine Welt" mit den Pflanzen, 23.09.,
// Logik: utils/gehirn.js). Antippen einer Region (großer Punkt oder
// Legende) erklärt, warum sie dem ADHS-Gehirn hilft. Die Grafik ist bewusst
// selbst gezeichnet (SVG) und lässt sich später gegen eine gestaltete
// Illustration (z. B. aus Canva) tauschen, ohne die Logik anzufassen.

// Gestaltung nach dem App-Logo (Nutzerinnen-Wunsch 23.09.): Gehirn von
// vorne, die linke Hälfte als Linienzeichnung, die rechte Hälfte aus
// Punkten, umschlossen von einem offenen Ring (Türkis → Blau). Die Idee
// "vom halben zum ganzen Gehirn": Je stärker die Woche aufgeladen ist,
// desto mehr ziehen sich die verstreuten Punkte zur rechten Hälfte
// zusammen — bei 100 % steht ein ganzes Gehirn. Der Ring zeigt denselben
// Wochenfortschritt. Die sechs Regionen sind die großen Punkte.
const TUERKIS = "#5CC3A8";
const BLAU = "#4274BC";
const HAELFTE =
  "M 150 78 C 142 68 124 66 116 76 C 104 70 88 78 88 92 C 74 96 68 112 76 124 C 64 134 64 152 76 160 C 68 172 72 190 88 194 C 90 208 104 218 120 214 C 128 224 144 226 150 218 Z";
const WINDUNGEN = [
  "M 124 96 C 130 104 128 112 120 116",
  "M 100 118 C 110 116 116 122 116 130",
  "M 132 136 C 124 140 122 148 128 154",
  "M 96 164 C 106 160 114 166 112 176",
  "M 128 180 C 136 184 138 192 132 200",
];
const STRICHE = [86, 102, 120, 138, 156, 174, 192, 208];
const RING = "M 240.5 59.5 A 128 128 0 1 0 240.5 240.5";
const PUNKT = {
  fokus: [174, 100],
  bewegung: [210, 110],
  energie: [188, 140],
  rhythmus: [219, 160],
  ruhe: [176, 180],
  erholung: [207, 202],
};

// Feste, reproduzierbare Punktewolke: Zielpunkte in der rechten Hälfte,
// Startpunkte weiter rechts verstreut (wie im Logo, das nach rechts
// "zerfließt").
const PARTIKEL = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const liste = [];
  while (liste.length < 64) {
    const tx = 156 + rnd() * 66;
    const ty = 72 + rnd() * 152;
    const nx = (tx - 180) / 44;
    const ny = (ty - 148) / 78;
    if (nx * nx + ny * ny > 1) continue;
    liste.push({
      tx,
      ty,
      sx: Math.min(292, tx + 40 + rnd() * 80),
      sy: Math.max(18, Math.min(282, ty + (rnd() - 0.5) * 90)),
      r: 1.6 + rnd() * 2,
      farbe: rnd() > 0.5 ? TUERKIS : BLAU,
    });
  }
  return liste;
})();

function bahn([x1, y1], [x2, y2]) {
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2 + 14} ${(y1 + y2) / 2} ${x2} ${y2}`;
}

export default function GehirnKarte({ kategorien, onOpenErfolge, onDenksport }) {
  const gehirn = useMemo(() => berechneGehirn(kategorien), [kategorien]);
  const [gewaehlt, setGewaehlt] = useState(null);
  const auswahl = gehirn.regionen.find((r) => r.key === gewaehlt) || null;
  const prozent = Math.round(gehirn.gesamtLadung * 100);

  const t = gehirn.gesamtLadung; // 0..1 — wie "ganz" das Gehirn schon ist
  const waehle = (key) => setGewaehlt((g) => (g === key ? null : key));

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
          : prozent >= 100
            ? "Diese Woche zu 100 % aufgeladen — dein Gehirn ist ganz! 🎉"
            : `Diese Woche zu ${prozent} % aufgeladen · je mehr du erledigst, desto ganzer wird dein Gehirn`}
      </div>

      <svg viewBox="0 0 300 300" role="img" aria-label={`Dein Gehirn, diese Woche zu ${prozent} Prozent aufgeladen`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "4px auto 0" }}>
        <defs>
          <linearGradient id="mp-gehirn-verlauf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TUERKIS} />
            <stop offset="100%" stopColor={BLAU} />
          </linearGradient>
          <filter id="mp-gehirn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring wie im Logo = Wochenfortschritt */}
        <path d={RING} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" strokeLinecap="round" />
        <path
          d={RING}
          fill="none"
          stroke="url(#mp-gehirn-verlauf)"
          strokeWidth="9"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${Math.max(0.5, t * 100)} 100`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
          filter="url(#mp-gehirn-glow)"
        />

        {/* Linke Hälfte: Linienzeichnung wie im Logo */}
        <path d={HAELFTE} fill="rgba(92,195,168,0.08)" stroke="url(#mp-gehirn-verlauf)" strokeWidth="5" strokeLinejoin="round" />
        <g fill="none" stroke="url(#mp-gehirn-verlauf)" strokeWidth="4.5" strokeLinecap="round">
          {WINDUNGEN.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Striche an der Mittellinie (Logo-Motiv) */}
        <g stroke={TUERKIS} strokeWidth="4" strokeLinecap="round" opacity="0.8">
          {STRICHE.map((y, i) => (
            <line key={y} x1="158" y1={y} x2={i % 2 ? 170 : 164} y2={y} />
          ))}
        </g>

        {/* Rechte Hälfte: Umriss erscheint, je ganzer das Gehirn wird */}
        <path d={HAELFTE} transform="translate(300 0) scale(-1 1)" fill="none" stroke="url(#mp-gehirn-verlauf)" strokeWidth="4" strokeDasharray={t >= 1 ? "none" : "2 7"} opacity={0.15 + 0.85 * t} style={{ transition: "opacity 1s" }} />

        {/* Punktewolke: sammelt sich mit der Wochenladung zur rechten Hälfte */}
        <g>
          {PARTIKEL.map((p, i) => (
            <circle
              key={i}
              cx={p.sx + (p.tx - p.sx) * t}
              cy={p.sy + (p.ty - p.sy) * t}
              r={p.r}
              fill={p.farbe}
              opacity={0.3 + 0.6 * t}
              style={{ transition: "cx 1.2s ease-out, cy 1.2s ease-out, opacity 1.2s" }}
            />
          ))}
        </g>

        {/* Nervenbahnen zwischen Regionen mit laufender Serie */}
        <g fill="none" strokeLinecap="round" style={{ pointerEvents: "none" }}>
          {gehirn.verbindungen
            .filter((v) => v.aktiv)
            .map((v) => (
              <path key={`${v.a}-${v.b}`} d={bahn(PUNKT[v.a], PUNKT[v.b])} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 6" className="mp-gehirn-bahn" opacity="0.8" />
            ))}
        </g>

        {/* Regionen = die großen Punkte */}
        {gehirn.regionen.map((r) => {
          const [x, y] = PUNKT[r.key];
          const an = gewaehlt === r.key;
          const radius = r.zustand === "aktiv" ? 9 + 4 * r.ladung : 9;
          return (
            <g
              key={r.key}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}: ${r.zustand === "aktiv" ? `an ${r.tageWoche} von 7 Tagen aktiv` : r.zustand === "ruht" ? "ruht gerade" : "noch nicht genutzt"}`}
              onClick={() => waehle(r.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && waehle(r.key)}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <circle
                cx={x}
                cy={y}
                r={radius + (an ? 3 : 0)}
                fill={r.zustand === "leer" ? "#1B2146" : r.farbe}
                fillOpacity={r.zustand === "ruht" ? 0.45 : 1}
                stroke={an ? "#fff" : r.zustand === "leer" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)"}
                strokeWidth={an ? 2.5 : 1.2}
                strokeDasharray={r.zustand === "leer" ? "3 3" : undefined}
                filter={r.zustand === "aktiv" ? "url(#mp-gehirn-glow)" : undefined}
                className={r.zustand === "aktiv" ? "mp-gehirn-aktiv" : r.zustand === "ruht" ? "mp-gehirn-ruht" : undefined}
                style={{ transition: "r 0.6s" }}
              />
              <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" style={{ pointerEvents: "none" }}>
                {r.zustand === "ruht" ? "💤" : r.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legende: welche Region wofür steht, mit Ladebalken */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 4 }}>
        {gehirn.regionen.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => waehle(r.key)}
            className="mp-tap"
            style={{
              border: gewaehlt === r.key ? `1.5px solid ${r.farbe}` : "1.5px solid transparent",
              background: "rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "7px 6px",
              color: "#fff",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: r.zustand === "leer" ? 0.55 : 1,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.emoji} {r.label}
            </div>
            <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)", marginTop: 5, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(r.ladung * 100)}%`, height: "100%", background: r.farbe, borderRadius: 99, transition: "width 0.6s" }} />
            </div>
          </button>
        ))}
      </div>

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
        gehirn.genutzt > 0 && <div style={{ fontSize: 11.5, opacity: 0.65, textAlign: "center", marginTop: 8 }}>Tippe auf eine Region, um zu sehen, was sie für dich tut.</div>
      )}
    </div>
  );
}
