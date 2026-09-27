import React, { useEffect, useMemo, useState } from "react";
import { KATEGORIE_META, ROUTINE_META } from "../utils/dayItems";
import { blockHoehe, dauerText, minZuZeit, planBloecke } from "../utils/bildTagesplan";
import { useFokusTimer } from "../data/useFokusTimer";
import { Ring } from "./TimerRing";
import { textMain, textMuted, verdunkeln } from "./theme";

// Bild-Tagesplan (27.09., Nutzerinnen-Wunsch nach dem Marktvergleich): der
// Tag als senkrechte Zeitleiste mit großen Bild-Symbolen (🧺 Wäsche · 30 Min),
// Blöcke so hoch wie die Dauer, rote Jetzt-Linie, Farben der Bereiche.
// Jeder Punkt: ▶ Timer (Countdown-Ring) und ✓ Bestätigen – Routinen starten
// direkt den geführten Ablauf, Training öffnet die Vorschau. Die bisherige
// Liste bleibt über den Umschalter "☰ Liste" erreichbar.

const JETZT_ROT = "#E0352B";

function farbenFuer(b) {
  const meta = KATEGORIE_META[b.kategorie] || ROUTINE_META[b.kategorie] || KATEGORIE_META.gewohnheit;
  return { dot: b.farbe || meta.dot, bg: meta.bg, text: meta.text };
}

function JetztLinie({ oben }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: -58, right: 0, top: oben, height: 0, borderTop: `2px solid ${JETZT_ROT}`, zIndex: 2 }}>
      <span style={{ position: "absolute", left: 0, top: -9, fontSize: 10, fontWeight: 800, color: "#fff", background: JETZT_ROT, borderRadius: 6, padding: "1px 5px" }}>jetzt</span>
    </div>
  );
}

function Block({ b, timer, restSek, anteil, onTimer, onAktion }) {
  const f = farbenFuer(b);
  const hoehe = blockHoehe(b.dauer);
  const meinTimer = timer?.key === b.key;
  const erledigt = !!b.done;
  const istRoutine = b.kategorie === "morgenroutine" || b.kategorie === "abendroutine";
  const aktionText = istRoutine ? "▶ Starten" : b.kategorie === "training" ? "Training" : "✓ Erledigt";
  return (
    <div style={{ position: "relative", marginBottom: 8 }} data-bild-block={b.key}>
      {b.start != null && <time style={{ position: "absolute", left: -58, top: 10, width: 46, textAlign: "right", fontSize: 12, fontWeight: 800, color: b.vorbei ? "#B4B8C8" : textMuted }}>{minZuZeit(b.start)}</time>}
      <div
        style={{
          minHeight: hoehe,
          borderRadius: 18,
          padding: "10px 10px 10px 10px",
          display: "flex",
          alignItems: "flex-start",
          gap: 11,
          background: erledigt ? verdunkeln(f.dot, 6) : f.bg,
          border: b.laeuft || meinTimer ? `2.5px solid ${verdunkeln(f.dot, 10)}` : `1.5px solid ${f.dot}55`,
          opacity: b.vorbei && !erledigt ? 0.72 : 1,
          boxShadow: b.laeuft ? `0 8px 18px ${f.dot}40` : "none",
          position: "relative",
        }}
      >
        <span style={{ position: "relative", zIndex: 3, width: 48, height: 48, borderRadius: 15, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, flexShrink: 0, boxShadow: "0 3px 8px rgba(0,0,0,0.08)" }} aria-hidden="true">
          {b.symbol}
        </span>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: erledigt ? "#fff" : f.text, lineHeight: 1.25 }}>{b.name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: erledigt ? "rgba(255,255,255,0.88)" : textMain, opacity: 0.8, marginTop: 2 }}>
            {dauerText(b.dauer)}
            {b.start != null ? ` · bis ${minZuZeit(b.ende)}` : ""}
          </div>
          {b.detail && <div style={{ fontSize: 11.5, color: erledigt ? "rgba(255,255,255,0.8)" : textMuted, marginTop: 2 }}>{b.detail}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, position: "relative", zIndex: 3 }}>
          {!erledigt && !istRoutine && (
            <button
              type="button"
              className="mp-tap"
              aria-label={meinTimer ? `Timer ${b.name} läuft` : `Timer für ${b.name} starten`}
              onClick={() => onTimer(b)}
              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
            >
              {meinTimer ? (
                <Ring anteil={anteil} groesse={42} dicke={5} farbe={verdunkeln(f.dot, 10)}>
                  {Math.ceil(restSek / 60)}′
                </Ring>
              ) : (
                <span style={{ width: 42, height: 42, borderRadius: 21, background: "#fff", border: `2px solid ${f.dot}`, color: verdunkeln(f.dot, 10), display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900 }}>▶</span>
              )}
            </button>
          )}
          {erledigt ? (
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: "6px 10px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: verdunkeln(f.dot, 12) }}>✓ Erledigt</span>
          ) : (istRoutine || b.kategorie === "training" || b.onConfirm) && b.kategorie !== "zeitblock" && b.kategorie !== "workflow" ? (
            <button
              type="button"
              className="mp-tap"
              onClick={() => onAktion(b)}
              style={{ border: "none", borderRadius: 11, padding: "7px 10px", fontSize: 12, fontWeight: 800, background: f.dot, color: "#fff", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {aktionText}
            </button>
          ) : null}
        </div>
      </div>
      {b.laeuft && <JetztLinie oben={Math.round(b.jetztAnteil * hoehe)} />}
    </div>
  );
}

export default function BildTagesplan({ items, routinen = [], heute, onRoutineStart, onTraining }) {
  const { timer, restSek, anteil, starten, stoppen } = useFokusTimer();
  const [jetztMin, setJetztMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    if (!heute) return;
    const id = setInterval(() => {
      const d = new Date();
      setJetztMin(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, [heute]);

  const alle = useMemo(() => [...routinen, ...(items || [])], [routinen, items]);
  const { mitZeit, ohneZeit, linieVor } = useMemo(() => planBloecke(alle, heute ? jetztMin : null), [alle, heute, jetztMin]);

  const onTimer = (b) => (timer?.key === b.key ? stoppen() : starten({ key: b.key, name: b.name, symbol: b.symbol, minuten: b.dauer }));
  const onAktion = (b) => {
    if (b.kategorie === "morgenroutine" || b.kategorie === "abendroutine") return onRoutineStart?.(b.routine);
    if (b.kategorie === "training") return onTraining?.(b);
    if (timer?.key === b.key) stoppen();
    b.onConfirm?.();
  };
  const blockProps = { timer, restSek, anteil, onTimer, onAktion };

  if (!mitZeit.length && !ohneZeit.length) {
    return <div style={{ textAlign: "center", color: textMuted, fontSize: 13.5, padding: "24px 0" }}>Für diesen Tag steht nichts an. 🌿</div>;
  }

  return (
    <div data-bild-tagesplan>
      <div style={{ position: "relative", paddingLeft: 58 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 50, top: 6, bottom: 6, width: 2, background: "#ECEDF3", borderRadius: 2 }} />
        {mitZeit.map((b) => (
          <div key={b.key} style={{ position: "relative" }}>
            {linieVor === b.key && (
              <div style={{ position: "relative", height: 14 }}>
                <JetztLinie oben={6} />
              </div>
            )}
            <Block b={b} {...blockProps} />
          </div>
        ))}
        {linieVor === "ende" && (
          <div style={{ position: "relative", height: 14 }}>
            <JetztLinie oben={6} />
          </div>
        )}
      </div>
      {ohneZeit.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, margin: "14px 0 8px" }}>Irgendwann heute</div>
          {ohneZeit.map((b) => (
            <Block key={b.key} b={b} {...blockProps} />
          ))}
        </>
      )}
    </div>
  );
}
