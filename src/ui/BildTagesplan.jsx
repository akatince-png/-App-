import React, { useEffect, useMemo, useState } from "react";
import { KATEGORIE_META, ROUTINE_META } from "../utils/dayItems";
import { blockHoehe, dauerText, gruppiereBloecke, minZuZeit, planBloecke } from "../utils/bildTagesplan";
import { useFokusTimer } from "../data/useFokusTimer";
import { Ring } from "./TimerRing";
import { textMain, textMuted, verdunkeln, hexZuRgba } from "./theme";
import PlastikSymbol from "./PlastikSymbol";
import AmpelPunkt, { AmpelLegende } from "./AmpelPunkt";
import SchnellIcon from "./SchnellIcon";
import { plastikFarbe, plastikHell } from "./plastik";
import TerminRueckmeldung from "./TerminRueckmeldung";
import GetraenkPortion from "./GetraenkPortion";
import { rueckmeldungText } from "../utils/termin";

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

// Aufklappen (25.10., Nutzerin: „wenn ich auf die Morgenroutine klicke, geht
// sie auf und ich sehe alle Bestandteile und kann sie direkt bearbeiten“ –
// genauso eine gebündelte Supplement-/Injektionsgabe).
function Block({ b, timer, restSek, anteil, onTimer, onAktion, onBearbeiten, renderRoutine, onGabe }) {
  const [offen, setOffen] = useState(false);
  const f = farbenFuer(b);
  const hoehe = blockHoehe(b.dauer);
  const meinTimer = timer?.key === b.key;
  const erledigt = !!b.done;
  const istRoutine = b.kategorie === "morgenroutine" || b.kategorie === "abendroutine";
  const istGruppe = !!b.teile;
  // Termine aus „Mein Alltag“ (26.10.): rückmelden statt nur abhaken.
  const istTermin = b.kategorie === "termin";
  // Getränk über den Tag (26.10.): Portionen statt „✓ Erledigt“.
  const getraenk = b.kategorie === "supplement" && b.raw?.getraenkMl && b.doseRef ? b.raw.getraenkMl : null;
  const aufklappbar = istGruppe || istTermin || !!getraenk || (istRoutine && !!renderRoutine);
  const aktionText = istRoutine ? "▶ Starten" : b.kategorie === "training" ? "Training" : istGruppe ? "✓ Alle" : "✓ Erledigt";
  const textFarbe = erledigt ? "#fff" : f.text;
  return (
    <div style={{ position: "relative", marginBottom: 8 }} data-bild-block={b.key}>
      {b.start != null && <time style={{ position: "absolute", left: -58, top: 10, width: 46, textAlign: "right", fontSize: 12, fontWeight: 800, color: b.vorbei ? "#B4B8C8" : textMuted }}>{minZuZeit(b.start)}</time>}
      <div
        style={{
          minHeight: hoehe,
          borderRadius: 18,
          padding: 10,
          background: erledigt ? verdunkeln(f.dot, 6) : f.bg,
          border: b.laeuft || meinTimer ? `2.5px solid ${verdunkeln(f.dot, 10)}` : `1.5px solid ${f.dot}55`,
          opacity: b.vorbei && !erledigt && !offen ? 0.72 : 1,
          // Plastisch (30.09.): jeder Block liegt mit weichem Schatten auf.
          boxShadow: b.laeuft
            ? `0 12px 24px -8px ${hexZuRgba(f.dot, 0.45)}, inset 0 1px 0 rgba(255,255,255,.55)`
            : `0 6px 16px -8px ${hexZuRgba(f.dot, 0.4)}, 0 1px 2px rgba(16,24,40,.05), inset 0 1px 0 rgba(255,255,255,.55)`,
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          {/* Bereichs-Symbol als plastische Kugel (30.09., Nutzerin) statt Emoji. */}
          <span style={{ position: "relative", zIndex: 3 }}>
            <PlastikSymbol kategorie={b.kategorie} farbe={f.dot} size={46} eckig />
          </span>
          <div
            role={aufklappbar ? "button" : undefined}
            tabIndex={aufklappbar ? 0 : undefined}
            aria-expanded={aufklappbar ? offen : undefined}
            data-bild-aufklappen={aufklappbar ? b.key : undefined}
            onClick={aufklappbar ? () => setOffen((o) => !o) : undefined}
            onKeyDown={aufklappbar ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOffen((o) => !o)) : undefined}
            style={{ flex: 1, minWidth: 0, paddingTop: 2, cursor: aufklappbar ? "pointer" : "default" }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: textFarbe, lineHeight: 1.25 }}>
              {b.name}
              {aufklappbar && <span aria-hidden="true" style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>{offen ? "▲" : "▼"}</span>}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: erledigt ? "rgba(255,255,255,0.88)" : textMain, opacity: 0.8, marginTop: 2 }}>
              {dauerText(b.dauer)}
              {b.start != null ? ` · bis ${minZuZeit(b.ende)}` : ""}
            </div>
            {istTermin && b.rueckmeldung && <div style={{ fontSize: 12, fontWeight: 700, color: erledigt ? "#fff" : textMain, marginTop: 2 }}>{rueckmeldungText(b.rueckmeldung)}</div>}
            {b.detail && !offen && <div style={{ fontSize: 11.5, color: erledigt ? "rgba(255,255,255,0.8)" : textMuted, marginTop: 2 }}>{b.detail}</div>}
            <div style={{ marginTop: 5, color: erledigt ? "#fff" : textMain }}>
              <AmpelPunkt item={b} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, position: "relative", zIndex: 3 }}>
            {!erledigt && !istRoutine && !istTermin && !getraenk && (
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
                  <span style={{ width: 42, height: 42, borderRadius: 21, ...plastikHell(), color: verdunkeln(f.dot, 10), display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <SchnellIcon name="play" size={16} />
                  </span>
                )}
              </button>
            )}
            {getraenk && !erledigt ? (
              <button type="button" className="mp-tap" data-getraenk-oeffnen onClick={() => setOffen((o) => !o)} style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12, fontWeight: 800, ...plastikFarbe(f.dot, "flach"), cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                🥤 Trinken
              </button>
            ) : istTermin && !erledigt ? (
              <button type="button" className="mp-tap" data-termin-wie onClick={() => setOffen((o) => !o)} style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12, fontWeight: 800, ...plastikFarbe(f.dot, "flach"), cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                Wie lief's?
              </button>
            ) : erledigt ? (
              <span style={{ fontSize: 11.5, fontWeight: 800, padding: "6px 10px", borderRadius: 99, background: "rgba(255,255,255,0.94)", boxShadow: "0 4px 10px -4px rgba(0,0,0,.25), inset 0 1px 0 #fff", color: verdunkeln(f.dot, 12) }}>{istTermin && b.rueckmeldung?.status === "ausgefallen" ? "✕ Ausgefallen" : istTermin ? "✓ Wahrgenommen" : "✓ Erledigt"}</span>
            ) : (istRoutine || b.kategorie === "training" || b.onConfirm || istGruppe) && b.kategorie !== "zeitblock" && b.kategorie !== "workflow" ? (
              <button
                type="button"
                className="mp-tap"
                onClick={() => onAktion(b)}
                aria-label={istRoutine ? `${b.name} starten` : b.kategorie === "training" ? undefined : `${b.name} erledigt`}
                style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12, fontWeight: 800, ...plastikFarbe(f.dot, "flach"), cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {aktionText}
              </button>
            ) : null}
          </div>
        </div>
        {offen && istGruppe && (
          <div data-bild-gruppe={b.key} style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {b.teile.map((t) => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: "var(--mp-karte)", color: "var(--mp-text)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 13.5, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>{t.name}</b>
                  {t.detail && <span style={{ fontSize: 12, color: textMuted }}>{t.detail}</span>}
                </span>
                {onBearbeiten && (
                  <button type="button" aria-label={`${t.name} bearbeiten`} onClick={() => onBearbeiten(t)} style={{ border: "none", background: "transparent", fontSize: 15, cursor: "pointer", padding: "4px 6px" }}>
                    ✏️
                  </button>
                )}
                {t.done ? (
                  <span style={{ fontSize: 12, fontWeight: 800, color: verdunkeln(f.dot, 12) }}>✓</span>
                ) : t.onConfirm ? (
                  <button type="button" className="mp-tap" aria-label={`${t.name} erledigt`} onClick={() => (onGabe ? onGabe([t]) : t.onConfirm())} style={{ border: "none", borderRadius: 99, padding: "6px 10px", fontSize: 12, fontWeight: 800, ...plastikFarbe(f.dot, "flach"), cursor: "pointer", fontFamily: "inherit" }}>
                    ✓
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {offen && getraenk && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 14, background: "var(--mp-karte)", color: "var(--mp-text)" }}>
            <GetraenkPortion dose={b.doseRef} gesamtMl={getraenk} farbe={verdunkeln(f.dot, 6)} />
          </div>
        )}
        {offen && istTermin && b.raw && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 14, background: "var(--mp-karte)", color: "var(--mp-text)" }}>
            <TerminRueckmeldung eintrag={b.raw} datum={b.datum} onFertig={() => setOffen(false)} />
          </div>
        )}
        {offen && istRoutine && renderRoutine && (
          <div data-bild-routine={b.routine} style={{ marginTop: 10, padding: 10, borderRadius: 14, background: "var(--mp-karte)", color: "var(--mp-text)" }}>
            {renderRoutine(b.routine)}
          </div>
        )}
      </div>
      {b.laeuft && !offen && <JetztLinie oben={Math.round(b.jetztAnteil * hoehe)} />}
    </div>
  );
}

export default function BildTagesplan({ items, routinen = [], heute, onRoutineStart, onTraining, onBearbeiten, renderRoutine, onGabe }) {
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
  const { mitZeit, ohneZeit, linieVor } = useMemo(() => {
    const plan = planBloecke(alle, heute ? jetztMin : null);
    const { bloecke, linieVor: linie } = gruppiereBloecke(plan.mitZeit, plan.linieVor);
    return { mitZeit: bloecke, ohneZeit: plan.ohneZeit, linieVor: linie };
  }, [alle, heute, jetztMin]);

  const onTimer = (b) => (timer?.key === b.key ? stoppen() : starten({ key: b.key, name: b.name, symbol: b.symbol, minuten: b.dauer }));
  const onAktion = (b) => {
    if (b.kategorie === "morgenroutine" || b.kategorie === "abendroutine") return onRoutineStart?.(b.routine);
    if (b.kategorie === "training") return onTraining?.(b);
    if (timer?.key === b.key) stoppen();
    if (b.teile) return onGabe ? onGabe(b.teile) : b.teile.filter((t) => !t.done).forEach((t) => t.onConfirm?.());
    b.onConfirm?.();
  };
  const blockProps = { timer, restSek, anteil, onTimer, onAktion, onBearbeiten, renderRoutine, onGabe };

  if (!mitZeit.length && !ohneZeit.length) {
    return <div style={{ textAlign: "center", color: textMuted, fontSize: 13.5, padding: "24px 0" }}>Für diesen Tag steht nichts an. 🌿</div>;
  }

  return (
    <div data-bild-tagesplan>
      <AmpelLegende />
      <div style={{ position: "relative", paddingLeft: 58 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 50, top: 6, bottom: 6, width: 2, background: "color-mix(in srgb, #ECEDF3 var(--mp-flaeche), var(--mp-karte))", borderRadius: 2 }} />
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
