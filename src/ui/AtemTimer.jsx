import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "./primitives";
import ProgressRing from "./ProgressRing";
import { textMuted } from "./theme";
import { playBeep, playTick } from "../utils/beep";

const VORBEREITUNG_SEK = 10;

const PHASEN_LABEL = { einatmen: "EINATMEN", halten: "HALTEN", ausatmen: "AUSATMEN" };
const PHASEN_HINWEIS = {
  einatmen: "Tief durch die Nase einatmen …",
  halten: "Kurz halten, locker bleiben …",
  ausatmen: "Langsam wieder ausatmen …",
};

// Eigenständiger Atem-Timer (16.08., Nutzerinnen-Vorgabe: "vier Sekunden
// einatmen, sechs ausatmen ... zehn Sekunden Vorbereitungszeit, Tick Tick
// Tick, dann einatmen, halten, ausatmen"). Bewusst NICHT der bestehende,
// generische Timer.jsx (der kennt nur zwei Phasen "arbeit"/"pause") —
// eigene, einfachere Komponente statt eines riskanten Umbaus des überall
// verwendeten Timer.jsx. Nutzt dieselben Bausteine (playBeep/playTick,
// ProgressRing, Timestamp-Anker statt Zähl-Ticks) für ein vertrautes
// Gefühl.
//
// Ablauf: Vorbereitung (10 Sek., jede Sekunde playTick(), Bereitschafts-
// Ton am Ende) -> Einatmen -> Halten (übersprungen, wenn haltenSek 0) ->
// Ausatmen -> wieder von vorn, bis die eingestellte Gesamtdauer erreicht
// ist (immer erst nach einem vollständig abgeschlossenen Ausatmen, damit
// nicht mitten im Atemzug abgebrochen wird) -> "Fertig" mit optionalem
// kurzen Gefühls-Check-in.
//
// Props:
// - uebung: { name, einatmenSek, haltenSek, ausatmenSek, dauerMinuten }
// - onFertig(dauerSek, gefuehlDanach): beim Abschluss (auch bei
//   vorzeitigem "Beenden")
// - kompakt: kleinere Darstellung fürs Akutmodus-Panel (kein Titel)
export default function AtemTimer({ uebung, onFertig, kompakt = false }) {
  const [status, setStatus] = useState("idle"); // idle | vorbereitung | einatmen | halten | ausatmen | done
  const [tick, setTick] = useState(0);
  const [gefuehlGewaehlt, setGefuehlGewaehlt] = useState(null);
  const phaseStartRef = useRef(null);
  const gesamtStartRef = useRef(null);
  const letzteTickSekundeRef = useRef(null);
  const rundenRef = useRef(0);
  const dauerSekRef = useRef(0);

  const einatmenSek = uebung?.einatmenSek || 4;
  const haltenSek = uebung?.haltenSek || 0;
  const ausatmenSek = uebung?.ausatmenSek || 6;
  const dauerMs = (uebung?.dauerMinuten || 3) * 60 * 1000;

  useEffect(() => {
    if (status === "idle" || status === "done") return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [status]);

  const phaseElapsedMs = () => (phaseStartRef.current ? Date.now() - phaseStartRef.current : 0);
  const phaseZielSek = () => (status === "vorbereitung" ? VORBEREITUNG_SEK : status === "einatmen" ? einatmenSek : status === "halten" ? haltenSek : ausatmenSek);

  const naechstePhaseNachAusatmen = () => {
    const gesamtElapsed = gesamtStartRef.current ? Date.now() - gesamtStartRef.current : 0;
    if (gesamtElapsed >= dauerMs) {
      playBeep(3);
      dauerSekRef.current = Math.round(gesamtElapsed / 1000);
      setStatus("done");
      return;
    }
    rundenRef.current += 1;
    playBeep(1);
    phaseStartRef.current = Date.now();
    setStatus("einatmen");
  };

  useEffect(() => {
    if (status === "vorbereitung") {
      const restSek = Math.ceil(VORBEREITUNG_SEK - phaseElapsedMs() / 1000);
      if (restSek > 0 && restSek !== letzteTickSekundeRef.current) {
        letzteTickSekundeRef.current = restSek;
        playTick();
      }
      if (phaseElapsedMs() >= VORBEREITUNG_SEK * 1000) {
        playBeep(2);
        gesamtStartRef.current = Date.now();
        phaseStartRef.current = Date.now();
        rundenRef.current = 1;
        setStatus("einatmen");
      }
      return;
    }
    if (status === "einatmen" && phaseElapsedMs() >= einatmenSek * 1000) {
      playBeep(1);
      phaseStartRef.current = Date.now();
      setStatus(haltenSek > 0 ? "halten" : "ausatmen");
      return;
    }
    if (status === "halten" && phaseElapsedMs() >= haltenSek * 1000) {
      playBeep(1);
      phaseStartRef.current = Date.now();
      setStatus("ausatmen");
      return;
    }
    if (status === "ausatmen" && phaseElapsedMs() >= ausatmenSek * 1000) {
      naechstePhaseNachAusatmen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status]);

  const start = () => {
    phaseStartRef.current = Date.now();
    letzteTickSekundeRef.current = null;
    setStatus("vorbereitung");
  };

  const beenden = () => {
    const gesamtElapsed = gesamtStartRef.current ? Date.now() - gesamtStartRef.current : 0;
    dauerSekRef.current = Math.round(gesamtElapsed / 1000);
    setStatus("done");
  };

  // onFertig wird bewusst erst hier (einmalig) ausgelöst, nicht schon beim
  // Stoppen des Timers — so kommen Dauer und Gefühls-Check-in immer
  // zusammen in einem Aufruf an statt in zwei, die der aufrufende Code
  // sonst zu einem Log-Eintrag zusammenführen müsste.
  const gefuehlWaehlen = (gefuehl) => {
    setGefuehlGewaehlt(gefuehl);
    onFertig?.(dauerSekRef.current, gefuehl);
  };

  const ueberspringen = () => {
    setGefuehlGewaehlt("uebersprungen");
    onFertig?.(dauerSekRef.current, null);
  };

  const restSekAnzeige = Math.max(0, Math.ceil(phaseZielSek() - phaseElapsedMs() / 1000));
  const ringTotal = status === "idle" || status === "done" ? null : phaseZielSek();
  const ringDone = ringTotal != null ? Math.max(0, ringTotal - phaseElapsedMs() / 1000) : null;

  return (
    <div style={{ textAlign: "center" }}>
      {!kompakt && status === "idle" && (
        <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 10 }}>
          {einatmenSek}s einatmen{haltenSek > 0 ? ` · ${haltenSek}s halten` : ""} · {ausatmenSek}s ausatmen · {uebung?.dauerMinuten || 3} Min.
        </div>
      )}

      {status === "vorbereitung" && (
        <div style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 4 }}>GLEICH GEHT'S LOS …</div>
      )}
      {(status === "einatmen" || status === "halten" || status === "ausatmen") && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 2 }}>{PHASEN_LABEL[status]}</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 4 }}>{PHASEN_HINWEIS[status]}</div>
        </>
      )}

      {ringTotal != null && (
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <ProgressRing done={ringDone} total={ringTotal} size={kompakt ? 100 : 130} stroke={10} />
        </div>
      )}
      {status !== "idle" && status !== "done" && (
        <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{restSekAnzeige}</div>
      )}

      {status === "done" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Fertig! 🎉</div>
          {gefuehlGewaehlt === null ? (
            <div>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Wie fühlst du dich jetzt?</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[
                  { emoji: "😊", wert: "besser" },
                  { emoji: "😐", wert: "gleich" },
                  { emoji: "😞", wert: "schlechter" },
                ].map((g) => (
                  <button
                    key={g.wert}
                    type="button"
                    onClick={() => gefuehlWaehlen(g.wert)}
                    className="mp-tap"
                    style={{ fontSize: 26, border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    {g.emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={ueberspringen}
                style={{ border: "none", background: "transparent", color: textMuted, fontSize: 11, marginTop: 8, cursor: "pointer" }}
              >
                Überspringen
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: textMuted }}>Danke ✓</div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {status === "idle" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={start}>Start</PrimaryButton>
          </div>
        )}
        {status !== "idle" && status !== "done" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={beenden} variant="ghost">
              Beenden
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
