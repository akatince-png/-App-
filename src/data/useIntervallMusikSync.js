import { useCallback, useRef } from "react";

// Anzahl Lautstärke-Stufen während einer Ein-/Ausblendung — genug für einen
// spürbar weichen statt harten Übergang, ohne bei jeder Sekunde einen
// eigenen Spotify-API-Aufruf zu verursachen.
const FADE_SCHRITTE = 6;
const FADE_STILL = 0;
const FADE_LEISE_DURCHGEHEND = 25; // Im Modus "durchgehend" nie ganz still, nur spürbar leiser.

// Verbindet Timer.jsx (mode="interval") mit den Spotify-Hintergrund-Aufrufen
// (spotifyPausieren/-Fortsetzen/-Lautstaerke aus useSpotifyVerbindung.js) —
// Nutzerin-Vorgabe (14.08.): Musik soll vor Ende eines Arbeitsintervalls
// leiser werden und beim nächsten Arbeitsintervall wieder lauter, wahlweise
// zusätzlich in den Pausen ganz pausieren statt nur leiser zu werden.
// Geteilt zwischen WorkflowTimer.jsx und TrainingView.jsx (Intervalltimer),
// damit beide dieselbe Fade-Logik nutzen statt sie zweimal zu bauen.
//
// modus: "durchgehend" (Musik läuft immer weiter, wird nur leiser/lauter)
//        oder "pause" (pausiert während der Pause komplett).
// fadeSek: Dauer der Ein-/Ausblendung in Sekunden — sollte demselben Wert
//          entsprechen, der als `fadeVorlaufSek` an <Timer> übergeben wird,
//          damit die Ausblendung genau zum Phasenwechsel fertig ist.
export function useIntervallMusikSync({ modus, fadeSek, spotifyPausieren, spotifyFortsetzen, spotifyLautstaerke, onErsterStart }) {
  const fadeTimerRef = useRef(null);
  const gestartetRef = useRef(false);

  const fadeStoppen = () => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const fadeLaufen = useCallback(
    (von, bis) => {
      fadeStoppen();
      const intervallMs = (fadeSek * 1000) / FADE_SCHRITTE;
      let schritt = 0;
      fadeTimerRef.current = setInterval(() => {
        schritt++;
        spotifyLautstaerke(Math.round(von + ((bis - von) * schritt) / FADE_SCHRITTE));
        if (schritt >= FADE_SCHRITTE) fadeStoppen();
      }, intervallMs);
    },
    [fadeSek, spotifyLautstaerke]
  );

  // fadeVorlaufSek vor Ende der Arbeitsphase — die Pause selbst bleibt
  // still (bzw. im Modus "durchgehend" einfach in der leisen Lautstärke),
  // ein zweites Ausblenden mitten in der Stille ergibt keinen Sinn.
  const onPhaseEndeNaht = useCallback(
    (phase) => {
      if (phase !== "arbeit") return;
      fadeLaufen(100, modus === "pause" ? FADE_STILL : FADE_LEISE_DURCHGEHEND);
    },
    [fadeLaufen, modus]
  );

  const onPhaseStart = useCallback(
    (phase) => {
      fadeStoppen();
      if (!gestartetRef.current) {
        // Allererste Phase = der Moment, in dem der Timer wirklich losläuft
        // (Start-Knopf gedrückt). Meist wurde die Playlist schon vorher
        // separat per spotifyAbspielen() gestartet — falls nicht (z. B. der
        // Kurz-Intervalltimer ohne eigenen Setup-Schritt), erledigt das
        // onErsterStart hier.
        gestartetRef.current = true;
        onErsterStart?.();
        return;
      }
      if (phase === "pause" && modus === "pause") {
        spotifyPausieren();
        return;
      }
      if (phase === "arbeit") {
        if (modus === "pause") spotifyFortsetzen();
        fadeLaufen(modus === "pause" ? FADE_STILL : FADE_LEISE_DURCHGEHEND, 100);
      }
    },
    [fadeLaufen, modus, spotifyPausieren, spotifyFortsetzen, onErsterStart]
  );

  const reset = useCallback(() => {
    fadeStoppen();
    gestartetRef.current = false;
  }, []);

  return { onPhaseStart, onPhaseEndeNaht, reset };
}
