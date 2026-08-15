import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton, TextInput } from "./primitives";
import ViewHeader from "./ViewHeader";
import Timer from "./Timer";
import NumberWheelField from "./NumberWheelField";
import SpotifyAnlassPicker from "./SpotifyAnlassPicker";
import MusikModusToggle from "./MusikModusToggle";
import { cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useIntervallMusikSync } from "../data/useIntervallMusikSync";
import { getWorkflowPresets, saveWorkflowPresets } from "../utils/intervallMusikStorage";

const FADE_SEK = 5;
const STANDARD_PRESET = { arbeitMin: "25", pauseMin: "5", gesamtMin: "100", modus: "durchgehend" };

function praesetAnlass(presetId) {
  return `workflow:${presetId}`;
}

function neuePresetId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
}

// Konzentrations-Intervalltimer (Pomodoro-artig) — Nutzerin-Vorgabe (14.08.):
// "einfach nur ein Timer, wo Workflow draufsteht", frei einstellbare
// Arbeits-/Pause-Intervalle über eine Gesamtdauer, eigene Playlist-
// Zuordnung + Musik-Sync (leiser/lauter an Intervallgrenzen, wahlweise
// Pause komplett stumm). Bewusst NICHT ins Onboarding eingebaut und ohne
// eigene Datenbank-Tabelle (nur für sie selbst, Einstellungen bleiben lokal
// auf dem Gerät über intervallMusikStorage.js) — Ziele/Projekte/Zeitblöcke
// sind als separates, größeres Vorhaben bewusst noch nicht Teil hiervon.
//
// Mehrere benannte Presets (15.08., Nutzerin-Vorgabe: "wenn ich mehrere
// Workflows habe, verschiedene Workflownamen, damit ich verschiedene Lieder
// anwenden kann") — jedes Preset hat eigene Timer-Werte UND eine eigene
// Spotify-Playlist-Zuordnung (anlass = `workflow:${preset.id}`, per ID statt
// Name, damit ein Umbenennen die Zuordnung nicht verliert).
export default function WorkflowTimer({ onSchliessen }) {
  const { spotifyAnlaesse, spotifyAnlassEntfernen, spotifyAbspielen, spotifyPausieren, spotifyFortsetzen, spotifyLautstaerke } = useAppData();
  const [presets, setPresets] = useState(() => getWorkflowPresets());
  const [bearbeitetId, setBearbeitetId] = useState(null);
  const [laufendesPreset, setLaufendesPreset] = useState(null);
  const [neuerName, setNeuerName] = useState("");

  const presetAendern = (id, patch) => {
    setPresets((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      saveWorkflowPresets(next);
      return next;
    });
  };

  const presetHinzufuegen = () => {
    const name = neuerName.trim();
    if (!name) return;
    const preset = { id: neuePresetId(), name, ...STANDARD_PRESET };
    setPresets((prev) => {
      const next = [...prev, preset];
      saveWorkflowPresets(next);
      return next;
    });
    setNeuerName("");
    setBearbeitetId(preset.id);
  };

  const presetLoeschen = (id) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveWorkflowPresets(next);
      return next;
    });
    spotifyAnlassEntfernen(praesetAnlass(id));
    if (bearbeitetId === id) setBearbeitetId(null);
  };

  const arbeitSekZahl = laufendesPreset ? Math.max(60, Math.round((Number(laufendesPreset.arbeitMin) || 25) * 60)) : 0;
  const pauseSekZahl = laufendesPreset ? Math.max(0, Math.round((Number(laufendesPreset.pauseMin) || 0) * 60)) : 0;
  const rundenZahl = laufendesPreset
    ? Math.max(1, Math.round(((Number(laufendesPreset.gesamtMin) || 25) * 60) / (arbeitSekZahl + pauseSekZahl)) || 1)
    : 0;
  const tatsaechlicheGesamtMin = laufendesPreset ? Math.round((rundenZahl * (arbeitSekZahl + pauseSekZahl)) / 60) : 0;

  const musikSync = useIntervallMusikSync({
    modus: laufendesPreset?.modus || "durchgehend",
    fadeSek: FADE_SEK,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
  });

  const starten = async (preset) => {
    musikSync.reset();
    const playlist = spotifyAnlaesse[praesetAnlass(preset.id)];
    if (playlist?.uri) await spotifyAbspielen(playlist.uri);
    setLaufendesPreset(preset);
  };

  const beenden = () => {
    musikSync.reset();
    setLaufendesPreset(null);
  };

  return (
    <Shell bereich="gewohnheit">
      <ViewHeader title="⏱️ Workflow" onHome={onSchliessen} />

      {!laufendesPreset ? (
        <>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
            Arbeitsphasen in Intervallen mit Pausen dazwischen — z. B. 25 Minuten Arbeit, 5 Minuten Pause. Lege dir mehrere
            benannte Workflows an, jeder mit eigener Playlist (z. B. "Deep Work" mit ruhiger Musik, "E-Mails" mit was
            Flotterem).
          </div>

          {presets.map((preset) => {
            const offen = bearbeitetId === preset.id;
            return (
              <Card key={preset.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{preset.name}</div>
                    <div style={{ fontSize: 11.5, color: textMuted }}>
                      {preset.arbeitMin} Min. Arbeit · {preset.pauseMin} Min. Pause · ≈ {preset.gesamtMin} Min. gesamt
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setBearbeitetId(offen ? null : preset.id)}
                      style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 6px" }}
                    >
                      {offen ? "Fertig" : "✏️"}
                    </button>
                    <button
                      type="button"
                      onClick={() => presetLoeschen(preset.id)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 6px" }}
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {offen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
                    <Label>Name</Label>
                    <TextInput value={preset.name} onChange={(v) => presetAendern(preset.id, { name: v })} placeholder="z. B. Deep Work" />

                    <Label>Gesamtdauer (Min.)</Label>
                    <NumberWheelField value={preset.gesamtMin} onChange={(v) => presetAendern(preset.id, { gesamtMin: v })} min={10} max={240} step={5} placeholder="Min." />

                    <Label>Arbeitsintervall (Min.)</Label>
                    <NumberWheelField value={preset.arbeitMin} onChange={(v) => presetAendern(preset.id, { arbeitMin: v })} min={5} max={90} step={5} placeholder="Min." />

                    <Label>Pauseintervall (Min.)</Label>
                    <NumberWheelField value={preset.pauseMin} onChange={(v) => presetAendern(preset.id, { pauseMin: v })} min={0} max={30} step={1} placeholder="Min." />

                    <MusikModusToggle modus={preset.modus} onChange={(v) => presetAendern(preset.id, { modus: v })} label="🎵 Musik in den Pausen" />
                    <SpotifyAnlassPicker anlass={praesetAnlass(preset.id)} label="🎵 Playlist für diesen Workflow" />
                  </div>
                )}

                {!offen && (
                  <div style={{ marginTop: 10 }}>
                    <PrimaryButton onClick={() => starten(preset)}>▶️ „{preset.name}" starten</PrimaryButton>
                  </div>
                )}
              </Card>
            );
          })}

          <Card style={{ marginBottom: 16 }}>
            <Label>+ Neuer Workflow</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={neuerName} onChange={setNeuerName} placeholder="z. B. Deep Work, E-Mails, Kreativ" />
              </div>
              <button
                type="button"
                onClick={presetHinzufuegen}
                style={{ padding: "0 16px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: cardBorder }}
              >
                Anlegen
              </button>
            </div>
          </Card>
        </>
      ) : (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{laufendesPreset.name}</div>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>{tatsaechlicheGesamtMin} Min. insgesamt</div>
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
