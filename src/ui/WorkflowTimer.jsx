import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton } from "./primitives";
import ViewHeader from "./ViewHeader";
import Timer from "./Timer";
import NumberWheelField from "./NumberWheelField";
import SpotifyAnlassPicker from "./SpotifyAnlassPicker";
import MusikModusToggle from "./MusikModusToggle";
import { textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useIntervallMusikSync } from "../data/useIntervallMusikSync";
import { getIntervallMusikEinstellung, saveIntervallMusikEinstellung } from "../utils/intervallMusikStorage";

const FADE_SEK = 5;

// Konzentrations-Intervalltimer (Pomodoro-artig) — Nutzerin-Vorgabe (14.08.):
// "einfach nur ein Timer, wo Workflow draufsteht", frei einstellbare
// Arbeits-/Pause-Intervalle über eine Gesamtdauer, eigene Playlist-
// Zuordnung + Musik-Sync (leiser/lauter an Intervallgrenzen, wahlweise
// Pause komplett stumm). Bewusst NICHT ins Onboarding eingebaut und ohne
// eigene Datenbank-Tabelle (nur für sie selbst, Einstellungen bleiben lokal
// auf dem Gerät über intervallMusikStorage.js) — Ziele/Projekte/Zeitblöcke
// sind als separates, größeres Vorhaben bewusst noch nicht Teil hiervon.
export default function WorkflowTimer({ onSchliessen }) {
  const { spotifyAnlaesse, spotifyAbspielen, spotifyPausieren, spotifyFortsetzen, spotifyLautstaerke } = useAppData();
  const gespeichert = getIntervallMusikEinstellung("workflow");
  const [arbeitMin, setArbeitMin] = useState(gespeichert.arbeitMin);
  const [pauseMin, setPauseMin] = useState(gespeichert.pauseMin);
  const [gesamtMin, setGesamtMin] = useState(gespeichert.gesamtMin);
  const [modus, setModus] = useState(gespeichert.modus);
  const [laeuft, setLaeuft] = useState(false);

  const arbeitSekZahl = Math.max(60, Math.round((Number(arbeitMin) || 25) * 60));
  const pauseSekZahl = Math.max(0, Math.round((Number(pauseMin) || 0) * 60));
  const rundenZahl = Math.max(1, Math.round(((Number(gesamtMin) || 25) * 60) / (arbeitSekZahl + pauseSekZahl)) || 1);
  const tatsaechlicheGesamtMin = Math.round((rundenZahl * (arbeitSekZahl + pauseSekZahl)) / 60);

  const musikSync = useIntervallMusikSync({
    modus,
    fadeSek: FADE_SEK,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
  });

  const playlist = spotifyAnlaesse.workflow;

  const starten = async () => {
    saveIntervallMusikEinstellung("workflow", { arbeitMin, pauseMin, gesamtMin, modus });
    musikSync.reset();
    if (playlist?.uri) await spotifyAbspielen(playlist.uri);
    setLaeuft(true);
  };

  const beenden = () => {
    musikSync.reset();
    setLaeuft(false);
  };

  return (
    <Shell bereich="gewohnheit">
      <ViewHeader title="⏱️ Workflow" onHome={onSchliessen} />

      {!laeuft ? (
        <>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
            Arbeitsphasen in Intervallen mit Pausen dazwischen — z. B. 25 Minuten Arbeit, 5 Minuten Pause.
          </div>
          <Card style={{ marginBottom: 16 }}>
            <Label>Gesamtdauer (Min.)</Label>
            <NumberWheelField value={gesamtMin} onChange={setGesamtMin} min={10} max={240} step={5} placeholder="Min." />

            <Label>Arbeitsintervall (Min.)</Label>
            <NumberWheelField value={arbeitMin} onChange={setArbeitMin} min={5} max={90} step={5} placeholder="Min." />

            <Label>Pauseintervall (Min.)</Label>
            <NumberWheelField value={pauseMin} onChange={setPauseMin} min={0} max={30} step={1} placeholder="Min." />

            <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8 }}>
              Ergibt {rundenZahl} Runde{rundenZahl === 1 ? "" : "n"} · ≈ {tatsaechlicheGesamtMin} Min. insgesamt
            </div>

            <MusikModusToggle modus={modus} onChange={setModus} label="🎵 Musik in den Pausen" />
            <SpotifyAnlassPicker anlass="workflow" label="🎵 Konzentrations-Playlist" />
          </Card>

          <PrimaryButton onClick={starten}>▶️ Workflow starten</PrimaryButton>
        </>
      ) : (
        <Card style={{ textAlign: "center" }}>
          <Timer
            mode="interval"
            arbeitSek={arbeitSekZahl}
            pauseSek={pauseSekZahl}
            runden={rundenZahl}
            autoStart
            fadeVorlaufSek={FADE_SEK}
            onPhaseStart={musikSync.onPhaseStart}
            onPhaseEndeNaht={musikSync.onPhaseEndeNaht}
            onFertig={beenden}
          />
          <div style={{ marginTop: 14 }}>
            <PrimaryButton variant="ghost" onClick={beenden}>
              Abbrechen
            </PrimaryButton>
          </div>
        </Card>
      )}
    </Shell>
  );
}
