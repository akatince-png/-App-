import React, { useMemo, useState } from "react";
import { berechneGehirnZeitraum, WIDGET_REGION } from "../utils/gehirn";
import { KATEGORIEN } from "../utils/errungenschaften";
import { KATEGORIE_META, ROUTINE_META } from "../utils/dayItems";
import { logoBlau, logoTuerkis, logoVerlauf, nachtVerlaufFest } from "./theme";
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

// Klassische Gehirn-Seitenansicht (Nutzerinnen-Wunsch 23.09.: "mehr nach
// Gehirn, nicht nach Wolke"): Stirnlappen vorne links, Scheitel oben,
// Hinterhaupt hinten, Schläfenlappen unten mit Schläfenpol, getrennt durch
// die Seitenfurche; darunter hinten Kleinhirn und Hirnstamm.
const GROSSHIRN =
  "M 58 120 C 50 88 70 58 104 46 C 140 32 196 34 230 52 C 262 68 280 98 276 130 C 274 148 262 160 244 162 C 228 164 214 160 204 156 C 196 170 180 182 160 184 C 132 186 110 176 100 160 C 94 150 96 140 104 134 C 96 136 84 138 74 136 C 62 134 58 128 58 120 Z";
const KLEINHIRN = "M 204 158 C 206 176 222 190 244 190 C 266 190 280 176 276 158 C 266 164 250 166 236 164 C 224 164 212 162 204 158 Z";
const HIRNSTAMM = "M 188 176 C 191 190 193 200 194 212 C 197 218 205 218 208 212 C 208 200 209 190 212 178 Z";

// Regionen als Flächen, an der Kontur zugeschnitten. Grenzen folgen grob
// der Seitenfurche (unten: Schläfenlappen) und der Zentralfurche.
const FLAECHEN = {
  fokus: "0,0 138,0 146,121 104,134 0,150",
  bewegung: "138,0 170,0 172,116 146,121",
  energie: "170,0 320,0 320,70 248,104 196,112 172,116",
  rhythmus: "320,70 320,240 250,240 248,104",
  ruhe: "0,150 104,134 146,121 172,116 196,112 248,104 250,240 0,240",
};
const PUNKT = {
  fokus: [88, 96],
  bewegung: [156, 62],
  energie: [212, 78],
  rhythmus: [260, 128],
  ruhe: [150, 154],
  erholung: [242, 178],
};
// Furchen und Windungen im Logo-Linienstil.
const SEITENFURCHE = "M 104 134 C 130 124 160 118 196 112 C 214 110 232 108 248 104";
const ZENTRALFURCHE = "M 150 38 C 144 56 156 72 148 90 C 142 102 148 112 146 121";
const WINDUNGEN = [
  "M 68 104 C 78 94 88 106 98 98 C 108 90 116 100 126 92",
  "M 80 74 C 92 66 100 78 112 70 C 122 64 128 74 136 68",
  "M 72 126 C 82 120 92 126 100 122",
  "M 110 48 C 116 58 126 54 130 62",
  "M 176 50 C 186 60 198 50 208 60 C 218 70 230 62 240 72",
  "M 172 88 C 184 80 194 94 206 86 C 218 78 228 92 242 86",
  "M 250 96 C 258 106 252 118 262 126 C 268 132 266 142 258 148",
  "M 116 158 C 128 150 138 164 150 156 C 162 148 172 162 188 154",
  "M 128 174 C 140 168 150 178 164 172",
  "M 64 88 C 72 80 80 90 88 84",
  "M 96 56 C 104 64 114 58 120 66",
  "M 118 84 C 126 94 136 86 140 96",
  "M 84 116 C 94 110 104 118 114 112 C 124 106 132 114 140 108",
  "M 168 66 C 176 74 186 70 192 78",
  "M 210 100 C 220 94 232 100 240 96",
  "M 244 58 C 252 66 262 70 266 82",
  "M 108 146 C 118 140 126 148 136 144",
  "M 180 134 C 188 142 198 138 204 146",
  "M 262 104 C 270 110 270 118 266 124",
];

function bahn([x1, y1], [x2, y2]) {
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 16} ${x2} ${y2}`;
}

function deckkraft(r) {
  if (r.zustand === "leer") return 0.05;
  if (r.zustand === "offen") return 0.16;
  return 0.3 + 0.7 * r.ladung;
}

// Stimmung je Tagesphase (utils/tagesphase.js, Nutzerinnen-Wunsch 24.09.):
// morgens Sonnenaufgang in den Morgenroutine-Farben, tagsüber Himmelblau,
// ab Beginn der Abendroutine Nachthimmel mit Sternen und Mond.
const STIMMUNG = {
  morgen: {
    hintergrund: "linear-gradient(165deg, #FFB866 0%, #F08A24 38%, #B24A16 78%, #6E2A10 100%)",
    schatten: "0 14px 30px rgba(176, 74, 22, 0.35)",
    linieVon: "#FFF1DC",
    linieBis: "#FFD39A",
    grund: "rgba(90, 30, 8, 0.35)",
    hinweis: "☀️ Guten Morgen — deine Morgenroutine lädt dein Gehirn auf.",
  },
  tag: {
    hintergrund: "linear-gradient(165deg, #6DB0F5 0%, #2D6FD6 45%, #1B3E8C 100%)",
    schatten: "0 14px 30px rgba(27, 62, 140, 0.35)",
    linieVon: "#FFFFFF",
    linieBis: "#CFE4FF",
    grund: "rgba(10, 30, 80, 0.35)",
    hinweis: null,
  },
  nacht: {
    hintergrund: nachtVerlaufFest,
    schatten: "0 14px 30px rgba(16, 19, 43, 0.35)",
    linieVon: logoTuerkis,
    linieBis: logoBlau,
    grund: "#1D2350",
    hinweis: "🌙 Abendroutine — Zeit, langsam runterzufahren. Gleich geht's ins Bett.",
  },
};

// Feste Sternpositionen (Prozent der Karte) für den Nachthimmel.
const STERNE = [
  [8, 6, 2, 0], [22, 12, 1.5, 0.8], [38, 5, 2, 1.6], [55, 10, 1.5, 0.4], [70, 4, 2.5, 1.2], [84, 13, 1.5, 2],
  [93, 30, 2, 0.6], [5, 38, 1.5, 1.4], [90, 55, 1.5, 2.2], [12, 62, 2, 0.2], [48, 3, 1.5, 2.6], [76, 22, 1.5, 1.8],
];

function Deko({ phase }) {
  if (phase === "nacht") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {STERNE.map(([x, y, r, verz], i) => (
          <span
            key={i}
            className="mp-stern"
            style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, borderRadius: 99, background: "#fff", animationDelay: `${verz}s`, boxShadow: "0 0 6px rgba(255,255,255,0.9)" }}
          />
        ))}
        <span style={{ position: "absolute", right: 16, top: 150, fontSize: 28, filter: "drop-shadow(0 0 10px rgba(255,236,170,0.8))" }}>🌙</span>
      </div>
    );
  }
  if (phase === "morgen") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 24 }}>
        <span style={{ position: "absolute", right: -50, top: 120, width: 170, height: 170, borderRadius: 999, background: "radial-gradient(circle, rgba(255,240,190,0.9) 0%, rgba(255,200,110,0.5) 40%, rgba(255,160,60,0) 70%)" }} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 24 }}>
      <span style={{ position: "absolute", right: 12, top: 140, fontSize: 26, opacity: 0.9 }}>☁️</span>
      <span style={{ position: "absolute", left: 14, top: 300, fontSize: 18, opacity: 0.6 }}>☁️</span>
    </div>
  );
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

// Schnellknöpfe im Gehirnfeld (24.09., Nutzerinnen-Wunsch): statt der
// beiden großen Kacheln "Wasser eintragen" und "Grad nicht gut?" unter der
// Karte ein großer Tropfen und ein runder gelber Knopf unten links im
// Gehirnbild (dort ist unter dem Stirnlappen Platz) — gleiche Funktionen.
function Schnellknoepfe({ onWasser, onAkut }) {
  if (!onWasser && !onAkut) return null;
  return (
    <div style={{ position: "absolute", left: 2, bottom: 4, display: "flex", alignItems: "flex-end", gap: 10 }}>
      {onWasser && (
        <button type="button" className="mp-tap mp-tropfen" aria-label="Wasser eintragen" title="Wasser eintragen" onClick={onWasser} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
          <svg width="54" height="66" viewBox="0 0 54 66" aria-hidden="true" style={{ display: "block" }}>
            <defs>
              <linearGradient id="mp-tropfen-verlauf" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" style={{ stopColor: "#8CC8FF" }} />
                <stop offset="100%" style={{ stopColor: "#1F5FD0" }} />
              </linearGradient>
            </defs>
            <path d="M27 3 C 27 3, 50 30, 50 43 A 23 23 0 0 1 4 43 C 4 30, 27 3, 27 3 Z" fill="url(#mp-tropfen-verlauf)" stroke="#fff" strokeWidth="3" />
            <ellipse cx="18" cy="38" rx="4" ry="7" fill="rgba(255,255,255,0.45)" transform="rotate(20 18 38)" />
            <path d="M27 36 v14 M20 43 h14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {onAkut && (
        <button
          type="button"
          className="mp-tap"
          aria-label="Grad nicht gut?"
          title="Grad nicht gut?"
          onClick={onAkut}
          style={{ width: 46, height: 46, borderRadius: 99, border: "3px solid #fff", background: "linear-gradient(135deg, #F59E0B, #FBBF24)", fontSize: 22, cursor: "pointer", boxShadow: "0 6px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        >
          💡
        </button>
      )}
    </div>
  );
}

export default function GehirnKarte({ kategorien, widgets, zeitraum, setZeitraum, tage, zeigeGesamt, onOpenErfolge, onDenksport, onOpenView, onWasser, onAkut, kopf = null, mitte = null, phase = "nacht", kopfUnten = false, gruss = null }) {
  const stimmung = STIMMUNG[phase] || STIMMUNG.nacht;
  const gehirn = useMemo(() => berechneGehirnZeitraum({ widgets, kategorien, tage }), [widgets, kategorien, tage]);
  const [gewaehlt, setGewaehlt] = useState(null);
  const auswahl = gehirn.regionen.find((r) => r.key === gewaehlt) || null;
  const prozent = Math.round(gehirn.gesamtLadung * 100);
  const waehle = (key) => setGewaehlt((g) => (g === key ? null : key));
  const sichtbareBalken = (widgets || []).filter((w) => w.kategorie !== "notfallmodus");

  return (
    <div style={{ position: "relative", marginBottom: 20, borderRadius: 24, padding: 16, color: "#fff", background: stimmung.hintergrund, boxShadow: stimmung.schatten, transition: "background 1s" }}>
      <Deko phase={phase} />
      <div style={{ position: "relative" }}>
      {/* Spielstand oben in derselben Karte (24.09.), durch eine feine Linie
          vom Gehirn-Teil getrennt. */}
      {kopf && !kopfUnten && (
        <>
          {kopf}
          {mitte}
          <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "14px 0" }} />
        </>
      )}

      {/* Begrüßung als kleine Zeile ganz oben (25.09.), wenn der Spielstand unten steht. */}
      {kopfUnten && gruss && <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, marginBottom: 10 }}>{gruss}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🧠 Dein Gehirn</div>
        <Zeitraumwahl zeitraum={zeitraum} setZeitraum={setZeitraum} zeigeGesamt={zeigeGesamt} />
      </div>

      {stimmung.hinweis && <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{stimmung.hinweis}</div>}
      <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 8 }}>
        {gehirn.genutzt === 0
          ? "Noch alles ruhig — hake etwas ab, dann leuchtet die erste Region auf."
          : `${ZEITRAUM_TEXT[zeitraum] || "Heute"} zu ${prozent} % aufgeladen${prozent >= 100 ? " — alles leuchtet! 🎉" : ""}`}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.12)", marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: `${prozent}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.8s ease-out" }} />
      </div>

      <div style={{ position: "relative" }}>
      <svg viewBox="40 24 250 200" role="img" aria-label={`Dein Gehirn, ${ZEITRAUM_TEXT[zeitraum] || "heute"} zu ${prozent} Prozent aufgeladen`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "8px auto 0" }}>
        <defs>
          <clipPath id="mp-grosshirn">
            <path d={GROSSHIRN} />
          </clipPath>
          <linearGradient id="mp-gehirn-verlauf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stimmung.linieVon} />
            <stop offset="100%" stopColor={stimmung.linieBis} />
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
        <path d={HIRNSTAMM} fill={stimmung.grund} />
        <path d={KLEINHIRN} fill={stimmung.grund} />
        <path d={GROSSHIRN} fill={stimmung.grund} />

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
                  points={r.key === "erholung" ? "170,150 300,150 300,240 170,240" : FLAECHEN[r.key]}
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
          <path d={SEITENFURCHE} strokeWidth="3.5" />
          <path d={ZENTRALFURCHE} strokeWidth="3" opacity="0.85" />
          <g strokeWidth="3" opacity="0.8">
            {WINDUNGEN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g strokeWidth="2.5" opacity="0.6">
            <path d="M 212 170 C 230 176 254 176 272 166" />
            <path d="M 220 180 C 236 184 254 184 268 178" />
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
      <Schnellknoepfe onWasser={onWasser} onAkut={onAkut} />
      </div>

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
            const icon = w.icon || KATEGORIE_META[w.kategorie]?.icon || ROUTINE_META[w.kategorie]?.icon;
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
      {kopf && kopfUnten && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "14px 0" }} />
          {mitte}
          <div style={{ marginTop: 14 }}>{kopf}</div>
        </>
      )}
      </div>
    </div>
  );
}
