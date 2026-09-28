import KoerperFigur from "./KoerperFigur";
import React, { useId, useMemo, useState } from "react";
import { berechneGehirnZeitraum, WIDGET_REGION } from "../utils/gehirn";
import { KATEGORIEN } from "../utils/errungenschaften";
import { KATEGORIE_META, ROUTINE_META } from "../utils/dayItems";
import { logoTuerkis, logoVerlauf, nachtVerlaufFest } from "./theme";
import Icon from "./Icon";
import gehirnTag from "../assets/gehirn/tag.webp";
import gehirnAbend from "../assets/gehirn/abend.webp";

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

// Gehirn-Bilder aus Canva (Design 2.0, Nutzerin 28.09.: „Ja so 2 und 3“):
// tagsüber das Gehirn mit farbigen Lappen, abends das leuchtende Neon-Gehirn.
// Beide Bilder zeigen die Seitenansicht (Stirn links, Kleinhirn hinten unten).
// Die Regionen liegen als Flächen darüber: Wer lädt, bekommt dort die volle
// Farbe bzw. das volle Leuchten, der Rest bleibt blass.
const BILD = {
  hell: { src: gehirnTag, b: 720, h: 590 },
  dunkel: { src: gehirnAbend, b: 720, h: 572 },
};

// Flächen und Symbol-Punkte in Anteilen (0–1) der Bildbreite/-höhe, damit sie
// auf beide Bilder passen. Zuordnung wie bisher: Stirnlappen = Fokus,
// Streifen davor/dahinter = Bewegung (motorischer Bereich), Scheitel =
// Energie, Hinterhaupt = Rhythmus, Schläfenlappen = Ruhe, Kleinhirn = Erholung.
const FLAECHEN = {
  fokus: [[-0.2, -0.2], [0.4, -0.2], [0.32, 0.44], [0.3, 0.56], [0.25, 0.72], [-0.2, 0.72]],
  bewegung: [[0.4, -0.2], [0.53, -0.2], [0.42, 0.43], [0.3, 0.56], [0.32, 0.44]],
  energie: [[0.53, -0.2], [0.8, -0.2], [0.78, 0.2], [0.72, 0.36], [0.56, 0.36], [0.42, 0.43]],
  rhythmus: [[0.8, -0.2], [1.2, -0.2], [1.2, 0.72], [0.8, 0.66], [0.72, 0.52], [0.72, 0.36], [0.78, 0.2]],
  ruhe: [[0.42, 0.43], [0.56, 0.36], [0.72, 0.36], [0.72, 0.52], [0.78, 0.63], [0.55, 0.64], [0.46, 0.78], [0.25, 0.78], [0.25, 0.72], [0.3, 0.56]],
  erholung: [[0.46, 0.64], [0.95, 0.62], [0.95, 1.2], [0.46, 1.2]],
};
const PUNKT = {
  fokus: [0.2, 0.36],
  bewegung: [0.42, 0.16],
  energie: [0.63, 0.19],
  rhythmus: [0.86, 0.42],
  ruhe: [0.48, 0.58],
  erholung: [0.72, 0.8],
};

function bahn([x1, y1], [x2, y2]) {
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 50} ${x2} ${y2}`;
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
  // Design 2.0 (28.09., Entwurf „Mischung B+C“): morgens und tagsüber eine
  // helle Karte mit dunkler Schrift, abends dunkel mit Leuchten.
  morgen: {
    hintergrund: "#FFFFFF",
    schatten: "0 1px 2px rgba(60, 30, 10, 0.05), 0 8px 24px rgba(60, 30, 10, 0.07)",
    hinweis: "☀️ Guten Morgen — deine Morgenroutine lädt dein Gehirn auf.",
    hell: true,
  },
  tag: {
    hintergrund: "#FFFFFF",
    schatten: "0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 24px rgba(16, 24, 40, 0.07)",
    hinweis: null,
    hell: true,
  },
  nacht: {
    hintergrund: nachtVerlaufFest,
    schatten: "0 14px 30px rgba(16, 19, 43, 0.35)",
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
            style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, borderRadius: 99, background: "#fff", animationDelay: `${verz}s`, boxShadow: "0 0 6px rgba(var(--gk-rgb, 255, 255, 255), 0.9)" }}
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
      <span style={{ position: "absolute", right: -60, top: 90, width: 190, height: 190, borderRadius: 999, background: "radial-gradient(circle, rgba(120,170,255,0.28) 0%, rgba(120,170,255,0) 70%)" }} />
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
    <div role="group" aria-label="Zeitraum" style={{ display: "flex", gap: 4, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.08)", borderRadius: 999, padding: 3 }}>
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
            color: zeitraum === id ? "#171B3A" : "rgba(var(--gk-rgb, 255, 255, 255), 0.75)",
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
  // Seit 27.09. (Nutzerin: "sitzen nicht gut, sieht doof aus") als eigene
  // Zeile unter Gehirn und Körper statt über das Gehirnbild gelegt, mit
  // Beschriftung – ganze Pille antippbar.
  const pille = { display: "flex", alignItems: "center", gap: 8, border: "1.5px solid rgba(var(--gk-rgb, 255, 255, 255), 0.35)", background: "rgba(var(--gk-rgb, 255, 255, 255), 0.1)", color: "var(--gk-text, #fff)", borderRadius: 99, padding: "5px 14px 5px 6px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" };
  return (
    <div data-schnellknoepfe style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "6px 0 12px" }}>
      {onWasser && (
        <button type="button" className="mp-tap mp-tropfen" aria-label="Wasser eintragen" onClick={onWasser} style={pille}>
          <svg width="26" height="32" viewBox="0 0 54 66" aria-hidden="true" style={{ display: "block" }}>
            <defs>
              <linearGradient id="mp-tropfen-verlauf" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" style={{ stopColor: "#8CC8FF" }} />
                <stop offset="100%" style={{ stopColor: "#1F5FD0" }} />
              </linearGradient>
            </defs>
            <path d="M27 3 C 27 3, 50 30, 50 43 A 23 23 0 0 1 4 43 C 4 30, 27 3, 27 3 Z" fill="url(#mp-tropfen-verlauf)" stroke="#fff" strokeWidth="3" />
            <path d="M27 36 v14 M20 43 h14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Wasser
        </button>
      )}
      {onAkut && (
        <button type="button" className="mp-tap" aria-label="Grad nicht gut?" onClick={onAkut} style={pille}>
          <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 99, background: "linear-gradient(135deg, #F59E0B, #FBBF24)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            💡
          </span>
          Grad nicht gut?
        </button>
      )}
    </div>
  );
}

export default function GehirnKarte({ kategorien, widgets, zeitraum, setZeitraum, tage, zeigeGesamt, onOpenErfolge, onDenksport, onOpenView, onWasser, onAkut, kopf = null, mitte = null, phase = "nacht", kopfUnten = false, gruss = null, koerper = null, balkenKlappbar = false }) {
  const stimmung = STIMMUNG[phase] || STIMMUNG.nacht;
  const gehirn = useMemo(() => berechneGehirnZeitraum({ widgets, kategorien, tage }), [widgets, kategorien, tage]);
  const [gewaehlt, setGewaehlt] = useState(null);
  // Design 2.0: Balken je Bereich auf der Startseite eingeklappt (ruhiger),
  // mit einem Tipp aufklappbar.
  const [balkenOffen, setBalkenOffen] = useState(!balkenKlappbar);
  const auswahl = gehirn.regionen.find((r) => r.key === gewaehlt) || null;
  const prozent = Math.round(gehirn.gesamtLadung * 100);
  const waehle = (key) => setGewaehlt((g) => (g === key ? null : key));
  const sichtbareBalken = (widgets || []).filter((w) => w.kategorie !== "notfallmodus");
  const uid = useId().replace(/:/g, "");
  const bild = stimmung.hell ? BILD.hell : BILD.dunkel;
  const punkt = (key) => [PUNKT[key][0] * bild.b, PUNKT[key][1] * bild.h];
  const punkte = (liste) => liste.map(([x, y]) => `${x * bild.b},${y * bild.h}`).join(" ");

  return (
    <div style={{ "--gk-rgb": stimmung.hell ? "20, 30, 60" : "255, 255, 255", "--gk-text": stimmung.hell ? "#101828" : "#fff", position: "relative", marginBottom: 20, borderRadius: 24, padding: 16, color: "var(--gk-text)", background: stimmung.hintergrund, boxShadow: stimmung.schatten, border: stimmung.hell ? "1px solid rgba(16, 24, 40, 0.05)" : "none", transition: "background 1s" }}>
      <Deko phase={phase} />
      <div style={{ position: "relative" }}>
      {/* Spielstand oben in derselben Karte (24.09.), durch eine feine Linie
          vom Gehirn-Teil getrennt. */}
      {kopf && !kopfUnten && (
        <>
          {kopf}
          {mitte}
          <div style={{ height: 1, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.18)", margin: "14px 0" }} />
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
      <div style={{ height: 6, borderRadius: 99, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)", marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: `${prozent}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.8s ease-out" }} />
      </div>

      {/* Gehirn + Körper nebeneinander (26.09., Skizze der Nutzerin) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", flex: "1.55 1 0", minWidth: 0 }}>
      <svg viewBox={`0 0 ${bild.b} ${bild.h}`} role="img" aria-label={`Dein Gehirn, ${ZEITRAUM_TEXT[zeitraum] || "heute"} zu ${prozent} Prozent aufgeladen`} data-gehirn-bild={stimmung.hell ? "tag" : "abend"} style={{ width: "100%", maxWidth: 420, display: "block", margin: "8px auto 0" }}>
        <defs>
          <filter id={`${uid}-weich`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={bild.b * 0.03} />
          </filter>
          {/* Maske: je Region so viel Farbe/Leuchten, wie sie aufgeladen ist */}
          <mask id={`${uid}-maske`} maskUnits="userSpaceOnUse" x="0" y="0" width={bild.b} height={bild.h}>
            <g filter={`url(#${uid}-weich)`}>
              {gehirn.regionen.map((r) => (
                <polygon
                  key={r.key}
                  points={punkte(FLAECHEN[r.key])}
                  fill="#fff"
                  fillOpacity={gewaehlt && gewaehlt !== r.key ? deckkraft(r) * 0.45 : deckkraft(r)}
                  className={r.zustand === "aktiv" ? "mp-gehirn-aktiv" : undefined}
                  style={{ transition: "fill-opacity 0.6s ease" }}
                />
              ))}
            </g>
          </mask>
        </defs>

        {/* Grundbild blass (tagsüber entsättigt, abends gedimmt) … */}
        <image href={bild.src} x="0" y="0" width={bild.b} height={bild.h} style={{ filter: stimmung.hell ? "saturate(0.3) brightness(1.06) opacity(0.72)" : "brightness(0.38) saturate(0.6)", mixBlendMode: stimmung.hell ? undefined : "screen" }} />
        {/* … und darüber in voller Farbe, nur wo geladen ist */}
        <image href={bild.src} x="0" y="0" width={bild.b} height={bild.h} mask={`url(#${uid}-maske)`} style={{ mixBlendMode: stimmung.hell ? undefined : "screen" }} />

        {/* Tippflächen je Region */}
        {gehirn.regionen.map((r) => (
          <polygon key={r.key} points={punkte(FLAECHEN[r.key])} fill="transparent" style={{ cursor: "pointer" }} onClick={() => waehle(r.key)} />
        ))}

        {/* Nervenbahnen: Regionen mit laufender Serie */}
        <g fill="none" strokeLinecap="round" style={{ pointerEvents: "none" }}>
          {gehirn.verbindungen
            .filter((v) => v.aktiv)
            .map((v) => (
              <path key={`${v.a}-${v.b}`} d={bahn(punkt(v.a), punkt(v.b))} stroke={stimmung.hell ? "#3E63D6" : "#FFFFFF"} strokeWidth={bild.b * 0.008} strokeDasharray={`${bild.b * 0.02} ${bild.b * 0.024}`} className="mp-gehirn-bahn" opacity="0.8" />
            ))}
        </g>

        {/* Regions-Symbole */}
        {gehirn.regionen.map((r) => {
          const [x, y] = punkt(r.key);
          const an = gewaehlt === r.key;
          const radius = bild.b * (an ? 0.056 : 0.048);
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
                r={radius}
                fill={r.zustand === "leer" ? (stimmung.hell ? "#fff" : "#1B2146") : r.farbe}
                fillOpacity={r.zustand === "aktiv" ? 1 : r.zustand === "leer" ? 0.92 : 0.75}
                style={{ stroke: an ? (stimmung.hell ? "#3E63D6" : "#fff") : stimmung.hell ? "#fff" : "rgba(255, 255, 255, 0.7)", filter: stimmung.hell ? "drop-shadow(0 2px 4px rgba(16, 24, 40, 0.18))" : "drop-shadow(0 0 6px rgba(120, 160, 255, 0.6))" }}
                strokeWidth={bild.b * (an ? 0.01 : 0.006)}
                strokeDasharray={r.zustand === "leer" ? `${bild.b * 0.012} ${bild.b * 0.012}` : undefined}
              />
              <text x={x} y={y + bild.b * 0.017} textAnchor="middle" fontSize={bild.b * 0.048} style={{ pointerEvents: "none" }}>
                {r.emoji}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <KoerperFigur werte={koerper} />
      </div>
      </div>
      <Schnellknoepfe onWasser={onWasser} onAkut={onAkut} />

      {balkenKlappbar && (
        <button
          type="button"
          data-balken-umschalter
          onClick={() => setBalkenOffen((o) => !o)}
          style={{ display: "block", margin: "10px auto 0", border: "none", background: "rgba(var(--gk-rgb, 255, 255, 255), 0.07)", color: "inherit", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          {balkenOffen ? "Bereiche ausblenden ▲" : "📊 Bereiche einzeln ansehen ▼"}
        </button>
      )}
      {/* Tagesfortschritt-Balken je Bereich — gleiche Zeitraum-Wahl wie oben */}
      {balkenOffen && (
      <div style={{ marginTop: 6, padding: "12px 10px 8px", borderRadius: 16, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.06)" }}>
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
                    background: w.aktiv ? farbe : "rgba(var(--gk-rgb, 255, 255, 255), 0.14)",
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
                {icon ? <Icon name={icon} size={14} color={stimmung.hell ? "#667085" : "#fff"} strokeWidth={2} /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: stimmung.hell ? "#667085" : "#fff" }} />}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {auswahl ? (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 16, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.08)", borderLeft: `4px solid ${auswahl.farbe}` }}>
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
            style={{ border: "none", background: "rgba(var(--gk-rgb, 255, 255, 255), 0.12)", color: "var(--gk-text, #fff)", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            Erfolge ›
          </button>
        </div>
      )}
      {kopf && kopfUnten && (
        <>
          <div style={{ height: 1, background: "rgba(var(--gk-rgb, 255, 255, 255), 0.18)", margin: "14px 0" }} />
          {mitte}
          <div style={{ marginTop: 14 }}>{kopf}</div>
        </>
      )}
      </div>
    </div>
  );
}
