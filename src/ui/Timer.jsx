import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "./primitives";
import ProgressRing from "./ProgressRing";
import { accentDark, textMuted } from "./theme";
import { playBeep, playTick } from "../utils/beep";

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
export default function Timer({
  mode,
  initialSeconds = 180,
  arbeitSek = 40,
  pauseSek = 20,
  runden = 5,
  onFertig,
  autoStart = false,
  vorwarnungSek = null,
  // Vorbereitungsphase vor dem eigentlichen Start (15.08., Nutzerin-Vorgabe:
  // "10-15 Sekunden Countdown, um sich zu positionieren", für alle
  // Trainingsarten gedacht, nicht nur isometrisch) — optional, ohne Angabe
  // verhält sich der Timer unverändert wie zuvor (sofortiger Start).
  vorbereitungSek = null,
  // Nur für mode="interval": Beschriftung der "Arbeit"-Phase anpassbar (z. B.
  // "HALTEN" bei isometrischem Training statt "ARBEIT") — Standardwert
  // erhält das bisherige Verhalten.
  arbeitLabel = "ARBEIT",
  pauseLabel = "PAUSE",
  // Nur für mode="interval" (14.08., Nutzerin-Vorgabe: Musik-Sync an
  // Intervallgrenzen, z. B. Spotify pausieren/ausblenden) — beide optional,
  // ohne sie verhält sich der Timer unverändert wie zuvor.
  // onPhaseStart(phase, runde): direkt beim Beginn jeder Phase (inkl. der
  // allerersten "arbeit"-Phase bei Start).
  // onPhaseEndeNaht(phase): einmalig `fadeVorlaufSek` Sekunden bevor die
  // AKTUELLE Phase endet.
  onPhaseStart,
  onPhaseEndeNaht,
  fadeVorlaufSek = null,
  // Nur für mode="interval": ein leiser Klick bei jeder vollen Sekunde,
  // sowohl beim Halten als auch in der Pause — für sehr kurze Intervalle
  // (z. B. 5 Sek. halten / 4 Sek. Pause bei isometrischem Training), bei
  // denen der reine Start-/Ende-Piep pro Phase zu wenig Zeitgefühl gibt
  // (15.08., Nutzerin-Vorgabe: "die Zeit ticken hören mit jeder Sekunde").
  tickJedeSekunde = false,
}) {
  const [status, setStatus] = useState("idle"); // idle | vorbereitung | running | paused | done
  const [phase, setPhase] = useState("arbeit");
  const [rundeAktuell, setRundeAktuell] = useState(1);
  const [tick, setTick] = useState(0);
  const elapsedRef = useRef(0);
  const anchorRef = useRef(null);
  // Eigener Zeitanker für die Vorbereitungsphase — getrennt von
  // elapsedRef/anchorRef, damit deren Segment-Zeitrechnung für die
  // eigentliche Übung/Runde unangetastet bleibt.
  const vorbereitungAnchorRef = useRef(null);
  // Einmaliger Hinweiston kurz vor Ablauf (z. B. "noch 30 Sekunden"), nicht
  // nur der Schluss-Alarm bei 0 — gegen ADHS-typisches Zeitgefühl-Problem,
  // Nutzerinnen-Vorgabe 13.08. Nur für countdown relevant, opt-in per Prop.
  const vorgewarntRef = useRef(false);
  // Analoges Einmal-Flag für onPhaseEndeNaht (s. o.), pro Phasen-Segment.
  const phaseEndeNahtRef = useRef(false);
  // Letzte volle Sekunde, für die schon getickt wurde (tickJedeSekunde) —
  // verhindert Mehrfach-Ticks innerhalb derselben Sekunde bei 200ms-Takt.
  const letzteTickSekundeRef = useRef(null);

  useEffect(() => {
    if (status !== "running" && status !== "vorbereitung") return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [status]);

  const segmentElapsedMs = () => elapsedRef.current + (status === "running" && anchorRef.current ? Date.now() - anchorRef.current : 0);
  const vorbereitungElapsedMs = () => (vorbereitungAnchorRef.current ? Date.now() - vorbereitungAnchorRef.current : 0);

  // Startet die eigentliche Übung/Runde — direkt bei start() (falls keine
  // Vorbereitungsphase konfiguriert ist) oder nach deren Ablauf.
  const startEcht = () => {
    const istErstStart = mode === "interval";
    anchorRef.current = Date.now();
    setStatus("running");
    if (istErstStart) {
      phaseEndeNahtRef.current = false;
      onPhaseStart?.("arbeit", 1);
    }
  };

  const start = () => {
    if (status === "done") return;
    if (status === "idle" && vorbereitungSek) {
      vorbereitungAnchorRef.current = Date.now();
      setStatus("vorbereitung");
      return;
    }
    startEcht();
  };
  const pause = () => {
    elapsedRef.current = segmentElapsedMs();
    anchorRef.current = null;
    setStatus("paused");
  };
  const reset = () => {
    elapsedRef.current = 0;
    anchorRef.current = null;
    vorbereitungAnchorRef.current = null;
    setStatus("idle");
    setPhase("arbeit");
    setRundeAktuell(1);
    vorgewarntRef.current = false;
    phaseEndeNahtRef.current = false;
    letzteTickSekundeRef.current = null;
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

  // Prüft bei jedem Tick, ob Countdown/Intervall-Phase abgelaufen ist — in
  // einem Effect statt direkt im Render-Body (sonst meldet React "Cannot
  // update a component while rendering a different component", sobald
  // onPhaseStart/onPhaseEndeNaht im Elternteil eigenen State setzen, z. B.
  // useIntervallMusikSync.js).
  useEffect(() => {
    if (status === "vorbereitung") {
      const remaining = vorbereitungSek * 1000 - vorbereitungElapsedMs();
      if (remaining <= 0) {
        playBeep(2);
        startEcht();
      }
      return;
    }
    if (status !== "running") return;
    if (mode === "countdown") {
      const remaining = initialSeconds * 1000 - segmentElapsedMs();
      if (vorwarnungSek && !vorgewarntRef.current && remaining <= vorwarnungSek * 1000 && remaining > 0) {
        vorgewarntRef.current = true;
        playBeep(1);
      }
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

      if (fadeVorlaufSek && !phaseEndeNahtRef.current && remaining <= fadeVorlaufSek * 1000 && remaining > 0) {
        phaseEndeNahtRef.current = true;
        onPhaseEndeNaht?.(phase);
      }

      if (remaining <= 0) {
        elapsedRef.current = 0;
        phaseEndeNahtRef.current = false;
        if (phase === "arbeit") {
          anchorRef.current = Date.now();
          playBeep(1);
          setPhase("pause");
          onPhaseStart?.("pause", rundeAktuell);
        } else if (rundeAktuell < runden) {
          anchorRef.current = Date.now();
          playBeep(1);
          setRundeAktuell((r) => r + 1);
          setPhase("arbeit");
          onPhaseStart?.("arbeit", rundeAktuell + 1);
        } else {
          anchorRef.current = null;
          playBeep(3);
          setStatus("done");
          onFertig?.(runden);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status]);

  // Sekunden-Ticken (s. tickJedeSekunde oben) — eigener Effect, damit er die
  // Phasenwechsel-Logik oben nicht durchkreuzt. Zählt an der verbleibenden
  // Zeit runter (5, 4, 3, 2, 1), nicht an der verstrichenen hoch.
  useEffect(() => {
    if (!tickJedeSekunde || mode !== "interval" || status !== "running") return;
    const zielSek = phase === "arbeit" ? arbeitSek : pauseSek;
    const restSek = Math.ceil(zielSek - segmentElapsedMs() / 1000);
    if (restSek > 0 && restSek !== letzteTickSekundeRef.current) {
      letzteTickSekundeRef.current = restSek;
      playTick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status, phase]);

  const remainingSecondsDisplay = () => {
    if (status === "vorbereitung") return Math.max(0, vorbereitungSek - vorbereitungElapsedMs() / 1000);
    if (mode === "stopwatch") return segmentElapsedMs() / 1000;
    if (mode === "countdown") return Math.max(0, initialSeconds - segmentElapsedMs() / 1000);
    const zielSek = phase === "arbeit" ? arbeitSek : pauseSek;
    return Math.max(0, zielSek - segmentElapsedMs() / 1000);
  };

  const ringTotal = status === "vorbereitung" ? vorbereitungSek : mode === "countdown" ? initialSeconds : mode === "interval" ? (phase === "arbeit" ? arbeitSek : pauseSek) : null;
  const ringDone = ringTotal != null ? Math.max(0, ringTotal - remainingSecondsDisplay()) : null;

  return (
    <div style={{ textAlign: "center" }}>
      {status === "vorbereitung" && (
        <div style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 4 }}>BEREIT MACHEN…</div>
      )}
      {mode === "interval" && status !== "idle" && status !== "vorbereitung" && (
        <div style={{ fontSize: 12, fontWeight: 800, color: phase === "arbeit" ? accentDark : textMuted, marginBottom: 4 }}>
          {phase === "arbeit" ? arbeitLabel : pauseLabel} · Runde {rundeAktuell}/{runden}
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
        {status === "vorbereitung" && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={startEcht} variant="ghost">
              Schon bereit? Jetzt starten
            </PrimaryButton>
          </div>
        )}
        {status !== "running" && status !== "done" && status !== "vorbereitung" && (
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
