import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "./primitives";
import ViewHeader from "./ViewHeader";
import Timer from "./Timer";
import NumberWheelField from "./NumberWheelField";
import TimeWheelField from "./TimeWheelField";
import SpotifyAnlassPicker from "./SpotifyAnlassPicker";
import MusikModusToggle from "./MusikModusToggle";
import { cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useIntervallMusikSync } from "../data/useIntervallMusikSync";
import { WOCHENTAGE } from "../constants";

const FADE_SEK = 5;

const LEERER_ZEITPLAN_ENTWURF = {
  wochentage: [],
  festeUhrzeit: false,
  uhrzeit: "09:00",
  gueltigkeitModus: "unbestimmt", // 'unbestimmt' | 'abDatum' | 'zeitraum'
  gueltigVon: new Date().toISOString().slice(0, 10),
  gueltigBis: new Date().toISOString().slice(0, 10),
};

function praesetAnlass(presetId) {
  return `workflow:${presetId}`;
}

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function gueltigkeitText(plan) {
  if (plan.gueltigVon && plan.gueltigBis) return `${plan.gueltigVon} – ${plan.gueltigBis}`;
  if (plan.gueltigVon) return `ab ${plan.gueltigVon}`;
  return "unbestimmt";
}

// Konzentrations-Intervalltimer (Pomodoro-artig) — Nutzerin-Vorgabe (14.08.):
// "einfach nur ein Timer, wo Workflow draufsteht", frei einstellbare
// Arbeits-/Pause-Intervalle über eine Gesamtdauer, eigene Playlist-
// Zuordnung + Musik-Sync (leiser/lauter an Intervallgrenzen, wahlweise
// Pause komplett stumm).
//
// Mehrere benannte Presets (15.08.): jedes Preset hat eigene Timer-Werte,
// eine eigene Spotify-Playlist-Zuordnung (anlass = `workflow:${preset.id}`)
// UND — seit der Umstellung von localStorage auf Supabase (workflow_presets/
// workflow_plaene, siehe useWorkflowData.js) — beliebig viele Zeitplan-
// Einträge (Wochentage + optionale Uhrzeit + optionaler Gültigkeits-
// Zeitraum), damit ein Workflow wie die sonstigen Protokolle im Tagesplan
// auftaucht (Nutzerin-Vorgabe: "auf eine bestimmte Zeit ... oder einen
// bestimmten Zeitraum oder auf unbestimmte Zeit festlegen").
export default function WorkflowTimer({ onSchliessen }) {
  const {
    spotifyAnlaesse,
    spotifyAnlassEntfernen,
    spotifyAbspielen,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
    workflowPresets,
    workflowPlaene,
    workflowPresetHinzufuegen,
    workflowPresetAendern,
    workflowPresetLoeschen,
    workflowPlanHinzufuegen,
    workflowPlanEntfernen,
  } = useAppData();
  const [bearbeitetId, setBearbeitetId] = useState(null);
  const [laufendesPreset, setLaufendesPreset] = useState(null);
  const [neuerName, setNeuerName] = useState("");
  const [zeitplanOffenFuer, setZeitplanOffenFuer] = useState(null);
  const [zeitplanEntwurf, setZeitplanEntwurf] = useState(LEERER_ZEITPLAN_ENTWURF);
  const [zeitplanFehler, setZeitplanFehler] = useState(null);

  const presetHinzufuegen = async () => {
    const name = neuerName.trim();
    if (!name) return;
    const result = await workflowPresetHinzufuegen(name);
    if (result?.ok) {
      setNeuerName("");
      setBearbeitetId(result.preset.id);
    }
  };

  const presetLoeschen = async (id) => {
    await workflowPresetLoeschen(id);
    spotifyAnlassEntfernen(praesetAnlass(id));
    if (bearbeitetId === id) setBearbeitetId(null);
  };

  const zeitplanFormOeffnen = (presetId) => {
    setZeitplanOffenFuer(presetId);
    setZeitplanEntwurf(LEERER_ZEITPLAN_ENTWURF);
    setZeitplanFehler(null);
  };

  const zeitplanSpeichern = async (presetId) => {
    if (!zeitplanEntwurf.wochentage.length) {
      setZeitplanFehler("Bitte mindestens einen Wochentag wählen.");
      return;
    }
    const result = await workflowPlanHinzufuegen({
      presetId,
      wochentage: zeitplanEntwurf.wochentage,
      uhrzeit: zeitplanEntwurf.festeUhrzeit ? zeitplanEntwurf.uhrzeit : "",
      gueltigVon: zeitplanEntwurf.gueltigkeitModus !== "unbestimmt" ? zeitplanEntwurf.gueltigVon : "",
      gueltigBis: zeitplanEntwurf.gueltigkeitModus === "zeitraum" ? zeitplanEntwurf.gueltigBis : "",
    });
    if (!result?.ok) {
      setZeitplanFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    setZeitplanOffenFuer(null);
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
            Flotterem) und optional festen Tagen/Uhrzeiten, dann taucht er auch im Tagesplan auf.
          </div>

          {workflowPresets.map((preset) => {
            const offen = bearbeitetId === preset.id;
            const eigenePlaene = workflowPlaene.filter((p) => p.presetId === preset.id);
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

                {!offen && eigenePlaene.length > 0 && (
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 8 }}>
                    📅 {eigenePlaene.map((p) => `${p.wochentage.join("/")}${p.uhrzeit ? ` ${p.uhrzeit}` : ""}`).join(" · ")}
                  </div>
                )}

                {offen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
                    <Label>Name</Label>
                    <TextInput value={preset.name} onChange={(v) => workflowPresetAendern(preset.id, { name: v })} placeholder="z. B. Deep Work" />

                    <Label>Gesamtdauer (Min.)</Label>
                    <NumberWheelField value={preset.gesamtMin} onChange={(v) => workflowPresetAendern(preset.id, { gesamtMin: v })} min={10} max={240} step={5} placeholder="Min." />

                    <Label>Arbeitsintervall (Min.)</Label>
                    <NumberWheelField value={preset.arbeitMin} onChange={(v) => workflowPresetAendern(preset.id, { arbeitMin: v })} min={5} max={90} step={5} placeholder="Min." />

                    <Label>Pauseintervall (Min.)</Label>
                    <NumberWheelField value={preset.pauseMin} onChange={(v) => workflowPresetAendern(preset.id, { pauseMin: v })} min={0} max={30} step={1} placeholder="Min." />

                    <MusikModusToggle modus={preset.modus} onChange={(v) => workflowPresetAendern(preset.id, { modus: v })} label="🎵 Musik in den Pausen" />
                    <SpotifyAnlassPicker anlass={praesetAnlass(preset.id)} label="🎵 Playlist für diesen Workflow" />

                    <Label>📅 Im Tagesplan einplanen (optional)</Label>
                    {eigenePlaene.map((p) => (
                      <div
                        key={p.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 12.5 }}
                      >
                        <div>
                          <span style={{ fontWeight: 700 }}>{p.wochentage.join(", ")}</span>
                          {p.uhrzeit && ` · ${p.uhrzeit} Uhr`}
                          <span style={{ color: textMuted }}> · {gueltigkeitText(p)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => workflowPlanEntfernen(p.id)}
                          style={{ border: "none", background: "transparent", color: danger, fontSize: 14, cursor: "pointer", padding: "0 4px" }}
                        >
                          🗑
                        </button>
                      </div>
                    ))}

                    {zeitplanOffenFuer === preset.id ? (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
                        <Label>Wochentage</Label>
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          {WOCHENTAGE.map((tag) => (
                            <Pill
                              key={tag}
                              label={tag}
                              selected={zeitplanEntwurf.wochentage.includes(tag)}
                              onClick={() => setZeitplanEntwurf((p) => ({ ...p, wochentage: toggleInArray(p.wochentage, tag) }))}
                            />
                          ))}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Pill label="Ohne feste Uhrzeit" selected={!zeitplanEntwurf.festeUhrzeit} onClick={() => setZeitplanEntwurf((p) => ({ ...p, festeUhrzeit: false }))} />
                          <Pill label="Feste Uhrzeit" selected={zeitplanEntwurf.festeUhrzeit} onClick={() => setZeitplanEntwurf((p) => ({ ...p, festeUhrzeit: true }))} />
                        </div>
                        {zeitplanEntwurf.festeUhrzeit && (
                          <div style={{ marginTop: 6 }}>
                            <TimeWheelField value={zeitplanEntwurf.uhrzeit} onChange={(v) => setZeitplanEntwurf((p) => ({ ...p, uhrzeit: v }))} />
                          </div>
                        )}

                        <Label>Gültigkeit</Label>
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          <Pill label="Unbestimmt" selected={zeitplanEntwurf.gueltigkeitModus === "unbestimmt"} onClick={() => setZeitplanEntwurf((p) => ({ ...p, gueltigkeitModus: "unbestimmt" }))} />
                          <Pill label="Ab einem Datum" selected={zeitplanEntwurf.gueltigkeitModus === "abDatum"} onClick={() => setZeitplanEntwurf((p) => ({ ...p, gueltigkeitModus: "abDatum" }))} />
                          <Pill label="Zeitraum" selected={zeitplanEntwurf.gueltigkeitModus === "zeitraum"} onClick={() => setZeitplanEntwurf((p) => ({ ...p, gueltigkeitModus: "zeitraum" }))} />
                        </div>
                        {zeitplanEntwurf.gueltigkeitModus !== "unbestimmt" && (
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                            <div style={{ flex: 1 }}>
                              <TextInput type="date" value={zeitplanEntwurf.gueltigVon} onChange={(v) => setZeitplanEntwurf((p) => ({ ...p, gueltigVon: v }))} />
                            </div>
                            {zeitplanEntwurf.gueltigkeitModus === "zeitraum" && (
                              <>
                                <div style={{ fontSize: 13, color: textMuted }}>bis</div>
                                <div style={{ flex: 1 }}>
                                  <TextInput type="date" value={zeitplanEntwurf.gueltigBis} onChange={(v) => setZeitplanEntwurf((p) => ({ ...p, gueltigBis: v }))} />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {zeitplanFehler && <div style={{ fontSize: 11.5, color: danger, marginTop: 6 }}>{zeitplanFehler}</div>}
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <div style={{ flex: 1 }}>
                            <PrimaryButton onClick={() => zeitplanSpeichern(preset.id)}>Speichern</PrimaryButton>
                          </div>
                          <div style={{ flex: 1 }}>
                            <PrimaryButton variant="ghost" onClick={() => setZeitplanOffenFuer(null)}>
                              Abbrechen
                            </PrimaryButton>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <PrimaryButton variant="ghost" onClick={() => zeitplanFormOeffnen(preset.id)}>
                          + Zeit hinzufügen
                        </PrimaryButton>
                      </div>
                    )}
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
