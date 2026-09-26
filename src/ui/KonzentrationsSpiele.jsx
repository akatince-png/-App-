import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "./primitives";
import { cardBorder, textMuted } from "./theme";
import { ballParameter, stoppParameter, stoppAuswerten, wechselAufgaben, wechselRichtig, zufallsZiffern } from "../utils/kognitiv";

// Konzentrationsspiele (26.09., siehe utils/kognitiv.js). Jedes Spiel meldet
// am Ende onFertig({ level, richtig, gesamt, reaktionMs, dauerSek }).
const feld = { position: "relative", width: "100%", maxWidth: 420, aspectRatio: "1 / 1", margin: "0 auto", borderRadius: 18, background: "#0F1638", overflow: "hidden", touchAction: "manipulation" };
const hinweis = { textAlign: "center", fontSize: 14, fontWeight: 800, margin: "10px 0" };

// 🏓 Bälle verfolgen (Multiple Object Tracking)
export function BaelleVerfolgen({ level, onFertig }) {
  const p = ballParameter(level);
  const start = useRef(Date.now());
  const [phase, setPhase] = useState("zeigen"); // zeigen | bewegen | waehlen | fertig
  const [baelle, setBaelle] = useState(() =>
    Array.from({ length: p.baelle }, (_, i) => {
      const w = Math.random() * Math.PI * 2;
      return { id: i, x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8, vx: Math.cos(w), vy: Math.sin(w), ziel: i < p.ziele };
    })
  );
  const [gewaehlt, setGewaehlt] = useState([]);

  useEffect(() => {
    if (phase === "zeigen") {
      const t = setTimeout(() => setPhase("bewegen"), 2200);
      return () => clearTimeout(t);
    }
    if (phase !== "bewegen") return undefined;
    let raf;
    let letzte = performance.now();
    const ende = letzte + p.dauerMs;
    const schritt = (jetzt) => {
      const dt = Math.min(0.05, (jetzt - letzte) / 1000);
      letzte = jetzt;
      setBaelle((alt) =>
        alt.map((b) => {
          let { x, y, vx, vy } = b;
          // leichte Richtungswechsel, damit es nicht vorhersehbar ist
          if (Math.random() < 0.02) {
            const w = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.2;
            vx = Math.cos(w);
            vy = Math.sin(w);
          }
          x += vx * p.tempo * dt;
          y += vy * p.tempo * dt;
          if (x < 0.06 || x > 0.94) vx = -vx;
          if (y < 0.06 || y > 0.94) vy = -vy;
          return { ...b, x: Math.min(0.94, Math.max(0.06, x)), y: Math.min(0.94, Math.max(0.06, y)), vx, vy };
        })
      );
      if (jetzt < ende) raf = requestAnimationFrame(schritt);
      else setPhase("waehlen");
    };
    raf = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(raf);
  }, [phase, p.dauerMs, p.tempo]);

  const tippen = (b) => {
    if (phase !== "waehlen" || gewaehlt.includes(b.id)) return;
    const neu = [...gewaehlt, b.id];
    setGewaehlt(neu);
    if (neu.length === p.ziele) {
      const richtig = neu.filter((id) => baelle.find((x) => x.id === id)?.ziel).length;
      setPhase("fertig");
      setTimeout(() => onFertig({ level, richtig, gesamt: p.ziele, dauerSek: Math.round((Date.now() - start.current) / 1000) }), 1400);
    }
  };

  return (
    <div>
      <div style={hinweis}>
        {phase === "zeigen" && `Merk dir die ${p.ziele} leuchtenden Bälle`}
        {phase === "bewegen" && "Mit den Augen folgen …"}
        {phase === "waehlen" && `Tippe die ${p.ziele} Bälle an (${gewaehlt.length}/${p.ziele})`}
        {phase === "fertig" && "Auflösung"}
      </div>
      <div style={feld} aria-label="Spielfeld Bälle">
        {baelle.map((b) => {
          const zeigen = phase === "zeigen" || phase === "fertig";
          const gewaehltHier = gewaehlt.includes(b.id);
          const farbe = zeigen && b.ziel ? "#FFB020" : gewaehltHier ? "#5DD6C6" : "#E8ECFF";
          return (
            <button
              key={b.id}
              type="button"
              aria-label={`Ball ${b.id + 1}`}
              onClick={() => tippen(b)}
              style={{ position: "absolute", left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: "50%", border: phase === "fertig" && gewaehltHier ? "3px solid #5DD6C6" : "none", background: farbe, boxShadow: zeigen && b.ziel ? "0 0 16px #FFB020" : "none", cursor: phase === "waehlen" ? "pointer" : "default", padding: 0 }}
            />
          );
        })}
      </div>
    </div>
  );
}

// 🚦 Stopp-Spiel (Go/No-Go)
export function StoppSpiel({ level, onFertig }) {
  const p = stoppParameter(level);
  const start = useRef(Date.now());
  const [i, setI] = useState(-1); // -1 = Countdown
  const [zeigt, setZeigt] = useState(false);
  const [rot, setRot] = useState(false);
  const durchgaenge = useRef([]);
  const gezeigtUm = useRef(0);
  const aktuell = useRef(null);

  useEffect(() => {
    if (i === -1) {
      const t = setTimeout(() => setI(0), 1200);
      return () => clearTimeout(t);
    }
    if (i >= p.durchgaenge) {
      onFertig({ level, ...stoppAuswerten(durchgaenge.current), dauerSek: Math.round((Date.now() - start.current) / 1000) });
      return undefined;
    }
    const pause = 450 + Math.random() * 600;
    const istRot = Math.random() < p.rotAnteil;
    const t1 = setTimeout(() => {
      aktuell.current = { rot: istRot, getippt: false, ms: null };
      gezeigtUm.current = performance.now();
      setRot(istRot);
      setZeigt(true);
    }, pause);
    const t2 = setTimeout(() => {
      setZeigt(false);
      if (aktuell.current) durchgaenge.current.push(aktuell.current);
      aktuell.current = null;
      setI((x) => x + 1);
    }, pause + p.anzeigeMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const tippen = () => {
    if (!aktuell.current || aktuell.current.getippt) return;
    aktuell.current.getippt = true;
    aktuell.current.ms = Math.round(performance.now() - gezeigtUm.current);
    setZeigt(false);
  };

  return (
    <div>
      <div style={hinweis}>{i === -1 ? "Gleich geht's los …" : `Grün: tippen · Rot: nichts tun (${Math.min(i + 1, p.durchgaenge)}/${p.durchgaenge})`}</div>
      <button type="button" aria-label="Tippfläche" onPointerDown={tippen} style={{ ...feld, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
        {zeigt && <span data-stopp={rot ? "rot" : "gruen"} style={{ width: "45%", height: "45%", borderRadius: "50%", background: rot ? "#E0352B" : "#1FBF72", boxShadow: `0 0 30px ${rot ? "#E0352B" : "#1FBF72"}` }} />}
      </button>
    </div>
  );
}

// 🔢 Zahlen merken (Zahlenspanne vorwärts, ab Level 7 auch rückwärts)
export function ZahlenMerken({ level, onFertig }) {
  const start = useRef(Date.now());
  const [laenge, setLaenge] = useState(level);
  const [folge, setFolge] = useState(() => zufallsZiffern(level));
  const [zeigeIndex, setZeigeIndex] = useState(0);
  const [eingabe, setEingabe] = useState("");
  const [fehlversuche, setFehlversuche] = useState(0);
  const [bester, setBester] = useState(0);
  const [versuche, setVersuche] = useState(0);
  const [richtigeVersuche, setRichtigeVersuche] = useState(0);
  const [rueckmeldung, setRueckmeldung] = useState(null);
  const rueckwaerts = level >= 7;
  const eingeben = zeigeIndex >= folge.length;

  useEffect(() => {
    if (zeigeIndex >= folge.length) return undefined;
    const t = setTimeout(() => setZeigeIndex((x) => x + 1), 900);
    return () => clearTimeout(t);
  }, [zeigeIndex, folge.length]);

  const pruefen = () => {
    const soll = (rueckwaerts ? [...folge].reverse() : folge).join("");
    const ok = eingabe.replace(/\D/g, "") === soll;
    const neueVersuche = versuche + 1;
    setVersuche(neueVersuche);
    if (ok) setRichtigeVersuche((x) => x + 1);
    const neuBester = ok ? Math.max(bester, laenge) : bester;
    setBester(neuBester);
    const neueFehler = ok ? fehlversuche : fehlversuche + 1;
    setFehlversuche(neueFehler);
    setRueckmeldung(ok ? "✓ Richtig!" : `Es war ${soll.split("").join(" ")}`);
    if (neueFehler >= 2 || neueVersuche >= 6) {
      setTimeout(() => onFertig({ level: Math.max(3, neuBester || laenge - 1), richtig: ok ? richtigeVersuche + 1 : richtigeVersuche, gesamt: neueVersuche, dauerSek: Math.round((Date.now() - start.current) / 1000) }), 1300);
      return;
    }
    const naechste = ok ? laenge + 1 : laenge;
    setTimeout(() => {
      setLaenge(naechste);
      setFolge(zufallsZiffern(naechste));
      setZeigeIndex(0);
      setEingabe("");
      setRueckmeldung(null);
    }, 1300);
  };

  return (
    <div>
      <div style={hinweis}>{eingeben ? (rueckwaerts ? "Jetzt RÜCKWÄRTS eintippen" : "Jetzt eintippen") : `Merk dir ${laenge} Ziffern`}</div>
      <div style={{ ...feld, aspectRatio: "2 / 1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 56, fontWeight: 900 }}>
        {!eingeben ? <span key={zeigeIndex}>{folge[zeigeIndex]}</span> : <span style={{ fontSize: 18, opacity: 0.8 }}>{rueckmeldung || "?"}</span>}
      </div>
      {eingeben && !rueckmeldung && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input aria-label="Ziffern" inputMode="numeric" autoFocus value={eingabe} onChange={(e) => setEingabe(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pruefen()} style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "10px 12px", fontSize: 20, letterSpacing: 4, fontFamily: "inherit" }} />
          <PrimaryButton onClick={pruefen} disabled={!eingabe.trim()}>
            OK
          </PrimaryButton>
        </div>
      )}
      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginTop: 8 }}>Bisher längste Folge: {bester || "–"}</div>
    </div>
  );
}

// 🔀 Regel-Wechsel (Task Switching)
export function RegelWechsel({ level, onFertig }) {
  const start = useRef(Date.now());
  const [aufgaben] = useState(() => wechselAufgaben(16 + Math.min(8, level), level));
  const [i, setI] = useState(0);
  const [richtig, setRichtig] = useState(0);
  const [blitz, setBlitz] = useState(null);
  const zeiten = useRef([]);
  const seit = useRef(performance.now());
  const a = aufgaben[i];

  const antworten = (antwort) => {
    if (!a || blitz) return;
    zeiten.current.push(performance.now() - seit.current);
    const ok = wechselRichtig(a, antwort);
    const neuRichtig = richtig + (ok ? 1 : 0);
    setRichtig(neuRichtig);
    setBlitz(ok ? "ok" : "nein");
    setTimeout(() => {
      setBlitz(null);
      seit.current = performance.now();
      if (i + 1 >= aufgaben.length) {
        const reaktionMs = Math.round(zeiten.current.reduce((x, y) => x + y, 0) / zeiten.current.length);
        onFertig({ level, richtig: neuRichtig, gesamt: aufgaben.length, reaktionMs, dauerSek: Math.round((Date.now() - start.current) / 1000) });
      } else setI(i + 1);
    }, 250);
  };

  if (!a) return null;
  const blau = a.regel === "paritaet";
  const knopf = (wert, text) => (
    <button key={wert} type="button" onClick={() => antworten(wert)} style={{ flex: 1, border: "none", borderRadius: 14, padding: "14px 8px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: blau ? "#2D6FD6" : "#E4843F", color: "#fff" }}>
      {text}
    </button>
  );
  return (
    <div>
      <div style={hinweis}>
        {blau ? "🔵 Gerade oder ungerade?" : "🟠 Kleiner oder größer als 5?"} ({i + 1}/{aufgaben.length})
      </div>
      <div style={{ ...feld, aspectRatio: "2 / 1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `inset 0 0 0 8px ${blau ? "#2D6FD6" : "#E4843F"}`, color: "#fff", fontSize: 72, fontWeight: 900, background: blitz === "ok" ? "#15533F" : blitz === "nein" ? "#3A2A55" : "#0F1638" }}>
        {a.zahl}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>{blau ? [knopf("gerade", "gerade"), knopf("ungerade", "ungerade")] : [knopf("kleiner", "< 5 kleiner"), knopf("groesser", "> 5 größer")]}</div>
    </div>
  );
}
