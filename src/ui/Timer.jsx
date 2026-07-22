import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "./primitives";
import ProgressRing from "./ProgressRing";
import { accentDark, textMuted } from "./theme";
import { playBeep } from "../utils/beep";

function fmt(sekunden) {
  const s = Math.max(0, Math.round(sekunden));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * Ein Timer für drei Zwecke: Stoppuhr (zählt hoch, manuell stoppen),
 * Countdown (Pausentimer zwischen Sätzen, zählt runter, Alarm bei 0) und
 * Intervall (HIIT/Cardio-Intervalle: wechselt automatisch Arbeit/Pause über
 * mehrere Runden, Alarm bei jedem Wechsel). Zeitmessung über echte
 * Timestamps statt Zähl-Ticks, damit nichts wegdriftet.
 */
export default function Timer({ mode, initialSeconds = 180, arbeitSek = 40, pauseSek = 20, runden = 5, onFertig, autoStart = false }) {
  const [status, setStatus] = useState("idle"); // idle | running | paused | done
  const [phase, setPhase] = useState("arbeit");
  const [rundeAktuell, setRundeAktuell] = useState(1);
  const [, setTick] = useState(0);
  const elapsedRef = useRef(0);
  const anchorRef = useRef(null);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [status]);

  const segmentElapsedMs = () => elapsedRef.current + (status === "running" && anchorRef.current ? Date.now() - anchorRef.current : 0);

  const start = () => {
    if (status === "done") return;
    anchorRef.current = Date.now();
    setStatus("running");
  };
  const pause = () => {
    elapsedRef.current = segmentElapsedMs();
    anchorRef.current = null;
    setStatus("paused");
  };
  const reset = () => {
    elapsedRef.current = 0;
    anchorRef.current = null;
    setStatus("idle");
    setPhase("arbeit");
    setRundeAktuell(1);
  };
  const stoppenUndFertig = () => {
    const sek = Math.round(segmentElapsedMs() / 1000);
    elapsedRef.current = 0;
    anchorRef.current = null;
    setStatus("done");
    onFertig?.(sek);
  };

  useEffect(() => {
    if (autoStart) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prüft bei jedem Tick, ob Countdown/Intervall-Phase abgelaufen ist.
  if (status === "running") {
    if (mode === "countdown") {
      const remaining = initialSeconds * 1000 - segmentElapsedMs();
      if (remaining <= 0) {
        playBeep(2);
        elapsedRef.current = 0;
        anchorRef.current = null;
        setStatus("done");
        onFertig?.();
      }
    } else if (mode === "interval") {
      const zielSek = phase === "arbeit" ? arbeitSek : pauseSek;
      const remaining = zielSek * 1000 - segmentElapsedMs();
      if (remaining <= 0) {
        elapsedRef.current = 0;
        if (phase === "arbeit") {
          anchorRef.current = Date.now();
          playBeep(1);
          setPhase("pause");
        } else if (rundeAktuell < runden) {
          anchorRef.current = Date.now();
          playBeep(1);
          setRundeAktuell((r) => r + 1);
          setPhase("arbeit");
        } else {
          anchorRef.current = null;
          playBeep(3);
          setStatus("done");
          onFertig?.(runden);
        }
      }
    }
  }

  const remainingSecondsDisplay = () => {
    if (mode === "stopwatch") return segmentElapsedMs() / 1000;
    if (mode === "countdown") return Math.max(0, initialSeconds - segmentElapsedMs() / 1000);
    const zielSek = phase === "arbeit" ? arbeitSek : pauseSek;
    return Math.max(0, zielSek - segmentElapsedMs() / 1000);
  };

  const ringTotal = mode === "countdown" ? initialSeconds : mode === "interval" ? (phase === "arbeit" ? arbeitSek : pauseSek) : null;
  const ringDone = ringTotal != null ? Math.max(0, ringTotal - remainingSecondsDisplay()) : null;

  return (
    <div style={{ textAlign: "center" }}>
      {mode === "interval" && status !== "idle" && (
        <div style={{ fontSize: 12, fontWeight: 800, color: phase === "arbeit" ? accentDark : textMuted, marginBottom: 4 }}>
          {phase === "arbeit" ? "ARBEIT" : "PAUSE"} · Runde {rundeAktuell}/{runden}
        </div>
      )}
      {ringTotal != null && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <ProgressRing done={ringDone} total={ringTotal} size={120} stroke={10} />
        </div>
      )}
      <div style={{ fontSize: 36, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(remainingSecondsDisplay())}</div>
      {status === "done" && mode !== "stopwatch" && (
        <div style={{ fontSize: 12, color: accentDark, fontWeight: 700, marginTop: 4 }}>Fertig! 🎉</div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {status !== "running" && status !== "done" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={start}>{status === "paused" ? "Weiter" : "Start"}</PrimaryButton>
          </div>
        )}
        {status === "running" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={pause} variant="ghost">
              Pause
            </PrimaryButton>
          </div>
        )}
        {mode === "stopwatch" && status === "running" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={stoppenUndFertig} variant="success">
              Fertig
            </PrimaryButton>
          </div>
        )}
        {status !== "idle" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={reset} variant="ghost">
              Reset
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
