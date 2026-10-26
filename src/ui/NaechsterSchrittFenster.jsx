import React, { useEffect, useState } from "react";
import PlastikSymbol from "./PlastikSymbol";
import { plastikFarbe } from "./plastik";
import { KATEGORIE_META } from "../utils/dayItems";
import { zeitText } from "../utils/naechsteSchritte";
import { toLocalISODate } from "../utils/dates";
import GetraenkPortion from "./GetraenkPortion";
import bildSupplemente from "../assets/fenster/supplemente.jpg";
import bildErnaehrung from "../assets/fenster/ernaehrung.jpg";
import bildSport from "../assets/fenster/sport.jpg";
import bildWasser from "../assets/fenster/wasser.jpg";
// Selbst gezeichnet (07.10., Canva-Kontingent leer; Vorlagen in docs/morgenfenster/vorlagen).
import bildWorkflow from "../assets/fenster/workflow.jpg";
import bildTageslicht from "../assets/fenster/tageslicht.jpg";
import bildSchlaf from "../assets/fenster/schlaf.jpg";
import bildAtem from "../assets/fenster/atemuebung.jpg";
import bildGewohnheit from "../assets/fenster/gewohnheit.jpg";

// „Als Nächstes“-Fenster (06.10., Nutzerin: „Wenn ‚Aufgeladen‘ steht, soll
// schon das nächste Actionfenster passieren … je nach Lebensbereich mit
// entsprechendem Bild und Fenster. Ist ein Workflow dran, öffnet sich die
// Workflow-Seite mit der anstehenden Aufgabe.“). Ganzer Bildschirm wie das
// Morgenfenster. Was sich mit einem Tipp abhaken lässt, wird hier abgehakt –
// danach kündigt das Fenster gleich den folgenden Punkt an.
// Bereiche ohne eigenes Bild zeigen ihr großes Plastik-Symbol auf Farbverlauf.
const BILD = {
  supplement: bildSupplemente,
  hormon: bildSupplemente,
  mahlzeit: bildErnaehrung,
  training: bildSport,
  hydration: bildWasser,
  workflow: bildWorkflow,
  zeitblock: bildWorkflow,
  tageslicht: bildTageslicht,
  schlaf: bildSchlaf,
  atemuebung: bildAtem,
  gewohnheit: bildGewohnheit,
  gruppe: bildGewohnheit,
};
const KNOPF = { workflow: "▶ Zum Workflow", training: "▶ Zum Training", zeitblock: "Im Tagesplan ansehen" };

// Bündel (26.10., Nutzerin): eine Abfrage mit Liste; einzelne lassen sich
// abwählen und bleiben dann offen („später / heute nicht“).
function BuendelListe({ teile, gewaehlt, setGewaehlt, farbe }) {
  return (
    <div data-naechster-buendel style={{ textAlign: "left", margin: "0 0 12px", display: "grid", gap: 6 }}>
      {teile.map((t) => {
        const an = gewaehlt.includes(t.key);
        return (
          <button
            key={t.key}
            type="button"
            role="checkbox"
            aria-checked={an}
            onClick={() => setGewaehlt((g) => (an ? g.filter((k) => k !== t.key) : [...g, t.key]))}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: `1.5px solid ${an ? farbe : "#D9DDE7"}`, borderRadius: 14, padding: "9px 12px", background: an ? "#fff" : "#F2F3F7", cursor: "pointer", fontFamily: "inherit", color: "#1F2A44" }}
          >
            <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: an ? farbe : "#fff", border: `2px solid ${an ? farbe : "#C3C8D4"}`, color: "#fff", fontSize: 14, fontWeight: 900 }}>{an ? "✓" : ""}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 14.5, opacity: an ? 1 : 0.55 }}>{t.name}</b>
              {t.detail && <span style={{ fontSize: 12, color: "#6B7590" }}>{t.detail}</span>}
            </span>
            {!an && <span style={{ fontSize: 11.5, fontWeight: 800, color: "#6B7590" }}>später</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function NaechsterSchrittFenster({ schritte = [], direkt, onErledigt, onOeffnen, onSpaeter }) {
  const [item, ...danach] = schritte;
  const teile = item?.teile?.length > 1 ? item.teile : null;
  const getraenk = item?.kategorie === "supplement" && item.raw?.getraenkMl ? item.raw.getraenkMl : null;
  const [gewaehlt, setGewaehlt] = useState([]);
  useEffect(() => setGewaehlt(teile ? teile.map((t) => t.key) : []), [item?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!item) {
    return (
      <Huelle farbe="#2FA36B">
        <div style={{ fontSize: 26, fontWeight: 900 }}>Alles erledigt ✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#4A5570", margin: "6px 0 16px" }}>Für heute steht nichts mehr im Plan.</div>
        <Knopf farbe="#2FA36B" onClick={onSpaeter}>Super</Knopf>
      </Huelle>
    );
  }
  const meta = KATEGORIE_META[item.kategorie] || KATEGORIE_META.gewohnheit;
  const farbe = item.farbe?.dot || meta.dot;
  const kannDirekt = direkt(item);
  return (
    <Huelle farbe={farbe} bild={BILD[item.kategorie]} item={item}>
      <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 0.6, color: farbe }}>ALS NÄCHSTES · {zeitText(item).toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 900, margin: "4px 0 2px", lineHeight: 1.15 }}>{item.name}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#4A5570", marginBottom: 14 }}>
        {teile ? `${meta.label} · alle auf einmal – abwählen, was heute nicht dran ist` : getraenk ? "Über den Tag verteilt trinken – Portion eintragen" : [meta.label, item.detail].filter(Boolean).join(" · ")}
      </div>
      {teile && <BuendelListe teile={teile} gewaehlt={gewaehlt} setGewaehlt={setGewaehlt} farbe={farbe} />}
      {getraenk ? (
        <GetraenkPortion dose={{ datum: toLocalISODate(new Date()), id: item.raw.id, zeit: item.originalUhrzeit ?? item.uhrzeit }} gesamtMl={getraenk} farbe={farbe} hell />
      ) : teile ? (
        <Knopf farbe={farbe} onClick={() => (gewaehlt.length ? onErledigt(item, teile.filter((t) => gewaehlt.includes(t.key))) : onSpaeter())} data="erledigt">
          {gewaehlt.length ? `✓ Genommen (${gewaehlt.length})` : "Alle später"}
        </Knopf>
      ) : kannDirekt ? (
        <Knopf farbe={farbe} onClick={() => onErledigt(item)} data="erledigt">✓ Erledigt</Knopf>
      ) : (
        <Knopf farbe={farbe} onClick={() => onOeffnen(item)} data="oeffnen">{KNOPF[item.kategorie] || "▶ Öffnen"}</Knopf>
      )}
      {danach.length > 0 && (
        <div data-naechster-danach style={{ marginTop: 12, textAlign: "left", fontSize: 13, color: "#4A5570" }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Danach:</div>
          {danach.map((d) => (
            <div key={d.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0" }}>
              <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              <span style={{ flexShrink: 0 }}>{d.uhrzeit ? d.uhrzeit.slice(0, 5) : "heute"}</span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={onSpaeter} style={{ marginTop: 8, border: "none", background: "transparent", color: "#6B7590", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 8, fontFamily: "inherit" }}>
        Später
      </button>
    </Huelle>
  );
}

// Mittig statt unten (26.10., Nutzerin: „so mittig wie möglich, dann sieht man
// das schöne Bild dahinter viel besser“). Im Querformat das Bild in voller
// Höhe mittig, daneben weichgezeichnet – wie beim Morgenfenster.
function Huelle({ farbe, bild, item, children }) {
  const [breit, setBreit] = useState(() => typeof window !== "undefined" && window.innerWidth / window.innerHeight > 0.7);
  useEffect(() => {
    const pruefen = () => setBreit(window.innerWidth / window.innerHeight > 0.7);
    window.addEventListener("resize", pruefen);
    return () => window.removeEventListener("resize", pruefen);
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Als Nächstes"
      data-naechster-schritt
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: bild ? "#F5F1EC" : `radial-gradient(circle at 50% 30%, ${farbe}55, transparent 60%), linear-gradient(180deg, ${farbe}33, #F5F1EC)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflowY: "auto",
        padding: "max(48px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))",
        color: "#1F2A44",
      }}
    >
      {bild && breit && <div aria-hidden="true" style={{ position: "fixed", inset: -40, background: `center / cover no-repeat url(${bild})`, filter: "blur(28px) saturate(1.1)", opacity: 0.85 }} />}
      {bild && <div aria-hidden="true" style={{ position: "fixed", inset: 0, background: `${breit ? "center / auto 100%" : "center 25% / cover"} no-repeat url(${bild})` }} />}
      {!bild && item && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "8%", display: "flex", justifyContent: "center" }}>
          <PlastikSymbol kategorie={item.kategorie} farbe={farbe} size={130} />
        </div>
      )}
      <div style={{ position: "relative", maxWidth: 460, width: "100%", margin: "0 auto", padding: "20px 20px 10px", borderRadius: 30, background: "rgba(255,255,255,.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 10px 30px rgba(0,0,0,.18)", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Knopf({ farbe, onClick, data, children }) {
  return (
    <button type="button" className="mp-tap" data-naechster-knopf={data} onClick={onClick} style={{ width: "100%", minHeight: 58, border: "none", borderRadius: 22, fontSize: 19, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", ...plastikFarbe(farbe) }}>
      {children}
    </button>
  );
}
