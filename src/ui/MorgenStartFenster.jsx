import React, { useEffect, useState } from "react";
// Eigene Zeichnung (06.10.): große Sonne, die Figur steht mittendrin
// (Nutzerin: „die Sonne soll erheblich größer sein als das Männchen“).
import bildMorgen from "../assets/fenster/morgen-sonne.jpg";
import bildAbend from "../assets/fenster/abend-fenster.jpg";
import { plastikFarbe } from "./plastik";
import { HEUTE_NICHT_GRUENDE } from "../utils/morgenFenster";

// Morgenfenster (06.10., Nutzerin hat Entwurf C gewählt: „Einmal strecken –
// und los“, eine direkte, motivierende Aufforderung). Füllt den ganzen
// Bildschirm und lässt sich nicht wegtippen: entweder „Starten“ oder
// „Heute nicht“ – dann wird kurz nach dem Grund gefragt (fürs Coaching).
// Abend (06.10. abends, Nutzerin: „solche Bilder auch für die Abendroutine“):
// gleicher Aufbau, Nachtbild, Leitsatz aus dem AKA-Konzept.
const ART = {
  morgen: { bild: bildMorgen, pos: "center 30%", grund: "#3B5F66", titel: "Guten Morgen ☀️", satz: "Einmal strecken – und los.", name: "Morgenroutine", farbe: "#F07A1A" },
  abend: { bild: bildAbend, pos: "center 30%", grund: "#1B2550", titel: "Guten Abend 🌙", satz: "Ein guter Morgen beginnt am Abend davor.", name: "Abendroutine", farbe: "#6C5BD4" },
};

const datumText = (d) => d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
const uhrText = (d) => d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

export default function MorgenStartFenster({ art = "morgen", schritte = 0, dauerMin = 0, fortgesetzt = 0, onStart, onHeuteNicht }) {
  const a = ART[art];
  const [jetzt, setJetzt] = useState(new Date());
  const [frage, setFrage] = useState(false);
  const [grund, setGrund] = useState("");
  const [freitext, setFreitext] = useState("");

  useEffect(() => {
    const id = setInterval(() => setJetzt(new Date()), 20000);
    return () => clearInterval(id);
  }, []);

  const gruendeText = [grund, freitext.trim()].filter(Boolean).join(" · ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={a.titel}
      data-morgenfenster={art}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundImage: `url(${a.bild})`,
        backgroundSize: "cover",
        backgroundPosition: a.pos,
        backgroundColor: a.grund,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "max(48px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))",
        color: "#1F2A44",
        fontFamily: "inherit",
      }}
    >
      <div style={{ textAlign: "center", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.35)" }}>
        <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: -1, lineHeight: 1.1 }}>{uhrText(jetzt)}</div>
        <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.92 }}>{datumText(jetzt)}</div>
      </div>

      <div
        style={{
          maxWidth: 460,
          width: "100%",
          margin: "0 auto",
          padding: "22px 20px 14px",
          borderRadius: 30,
          background: "rgba(255,255,255,.86)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 10px 30px rgba(0,0,0,.18)",
          textAlign: "center",
        }}
      >
        {!frage ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{a.titel}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4A5570", margin: "6px 0 4px" }}>{a.satz}</div>
            <div style={{ fontSize: 13, color: "#6B7590", marginBottom: 16 }}>
              {fortgesetzt > 0 ? `${fortgesetzt} von ${schritte} Schritten schon erledigt` : `${a.name} · ${schritte} Schritte`}
              {dauerMin > 0 ? ` · ca. ${dauerMin} Min.` : ""}
            </div>
            <button
              type="button"
              className="mp-tap"
              data-morgenfenster-start
              onClick={onStart}
              style={{ width: "100%", minHeight: 60, border: "none", borderRadius: 22, fontSize: 20, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", ...plastikFarbe(a.farbe) }}
            >
              ▶ {fortgesetzt > 0 ? "Weitermachen" : "Starten"}
            </button>
            <button
              type="button"
              onClick={() => setFrage(true)}
              style={{ marginTop: 10, border: "none", background: "transparent", color: "#6B7590", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 8, fontFamily: "inherit" }}
            >
              Heute nicht
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Okay – was ist heute los?</div>
            <div style={{ fontSize: 13, color: "#6B7590", marginBottom: 12 }}>Kurz antippen reicht. Das hilft dir und deinem Coach, Muster zu sehen.</div>
            <div role="group" aria-label="Grund" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 10 }}>
              {HEUTE_NICHT_GRUENDE[art].map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grund === g}
                  onClick={() => setGrund(grund === g ? "" : g)}
                  style={{ border: "none", borderRadius: 99, padding: "9px 14px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: grund === g ? a.farbe : "rgba(31,42,68,.08)", color: grund === g ? "#fff" : "#1F2A44" }}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              value={freitext}
              onChange={(e) => setFreitext(e.target.value)}
              placeholder="Oder in eigenen Worten (optional)"
              style={{ width: "100%", boxSizing: "border-box", borderRadius: 14, border: "1px solid rgba(31,42,68,.15)", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", marginBottom: 12, background: "#fff", color: "#1F2A44" }}
            />
            <button
              type="button"
              className="mp-tap"
              data-morgenfenster-nicht
              disabled={!gruendeText}
              onClick={() => onHeuteNicht(gruendeText)}
              style={{ width: "100%", minHeight: 50, border: "none", borderRadius: 18, fontSize: 16, fontWeight: 900, cursor: gruendeText ? "pointer" : "default", fontFamily: "inherit", opacity: gruendeText ? 1 : 0.5, ...plastikFarbe("#5B6A8A") }}
            >
              Heute auslassen
            </button>
            <button
              type="button"
              onClick={() => setFrage(false)}
              style={{ marginTop: 8, border: "none", background: "transparent", color: a.farbe, fontSize: 14, fontWeight: 800, cursor: "pointer", padding: 8, fontFamily: "inherit" }}
            >
              Doch starten
            </button>
          </>
        )}
      </div>
    </div>
  );
}
