import React, { useState } from "react";
import { accent, accentDark, accentSoft, textMain } from "./theme";
import { zufaelligeDenkpauseAufgabe } from "../data/denkpausen";
import { useAppData } from "../context/AppDataContext";

// "Denkpause" (Nutzerinnen-Vorgabe 16.09., siehe Denkpausen-Mockup): kurzer,
// freiwilliger Denksport-Anstoß VOR einer Handlung. Zwei feste Regeln,
// beide absichtlich hart im Code verankert, nicht nur in der Doku:
// 1. "Nee, weiter" ist in JEDER Phase genauso erreichbar wie die Aufgabe
//    selbst — nie eine Sackgasse ohne Ausstieg.
// 2. In diesem Moment gibt es kein sichtbares "falsch" — nur die richtige
//    Antwort kurz hervorgehoben, dann geht's weiter. Kein Vorwurf, kein
//    Zähler HIER. Richtige Antworten zahlen trotzdem 1 Punkt in die
//    bestehende Punkte-Währung ein (siehe utils/errungenschaften.js) und
//    werden — zusammen mit falschen — unter "Erfolge" pro Kategorie
//    gezählt (ErfolgeTab.jsx); das ist bewusst getrennt von diesem Moment
//    hier, der keinerlei Bewertungs-Gefühl vermitteln soll.
export default function DenkpauseNudge({ text, onDismiss }) {
  const { denkpauseErgebnisVermerken } = useAppData();
  const [phase, setPhase] = useState("angebot"); // angebot | aufgabe
  const [aufgabe, setAufgabe] = useState(null);
  const [gewaehlt, setGewaehlt] = useState(null);

  const starten = () => {
    setAufgabe(zufaelligeDenkpauseAufgabe());
    setPhase("aufgabe");
  };

  const antworten = (i) => {
    if (gewaehlt !== null) return;
    setGewaehlt(i);
    denkpauseErgebnisVermerken(aufgabe.kategorie, i === aufgabe.richtig);
    window.setTimeout(onDismiss, 900);
  };

  if (phase === "angebot") {
    return (
      <div
        style={{
          background: accentSoft,
          border: `1.5px solid ${accent}`,
          borderRadius: 18,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🧠
        </div>
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: accentDark, lineHeight: 1.4 }}>
          {text || "Kurze Denkpause gefällig?"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            className="mp-tap"
            onClick={starten}
            style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Klar
          </button>
          <button
            type="button"
            className="mp-tap"
            onClick={onDismiss}
            style={{ background: "transparent", color: accentDark, border: "none", fontSize: 11, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px", cursor: "pointer" }}
          >
            Nee, weiter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: accentSoft,
        border: `1.5px solid ${accent}`,
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: accentDark, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
        🧠 Denkpause
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: textMain, marginBottom: 12 }}>{aufgabe.frage}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {aufgabe.antworten.map((a, i) => {
          const istRichtig = i === aufgabe.richtig;
          const ausgewertet = gewaehlt !== null;
          return (
            <button
              key={i}
              type="button"
              className="mp-tap"
              onClick={() => antworten(i)}
              disabled={ausgewertet}
              style={{
                border: `1.5px solid ${ausgewertet && istRichtig ? accent : "#EAEAE5"}`,
                background: ausgewertet && istRichtig ? accent : "#fff",
                color: ausgewertet && istRichtig ? "#fff" : textMain,
                borderRadius: 12,
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: ausgewertet ? "default" : "pointer",
                textAlign: "center",
              }}
            >
              {a}
            </button>
          );
        })}
      </div>
      {gewaehlt === null && (
        <button
          type="button"
          className="mp-tap"
          onClick={onDismiss}
          style={{ background: "transparent", color: accentDark, border: "none", fontSize: 11, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px", cursor: "pointer", padding: 0 }}
        >
          Nee, weiter
        </button>
      )}
      {gewaehlt !== null && <div style={{ fontSize: 11.5, fontWeight: 700, color: accentDark }}>{aufgabe.antworten[gewaehlt] === aufgabe.antworten[aufgabe.richtig] ? "Genau richtig! 🎉" : "Kein Ding — weiter geht's."}</div>}
    </div>
  );
}
