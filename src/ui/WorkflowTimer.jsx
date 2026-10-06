import React, { useEffect, useRef, useState } from "react";
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
import { toLocalISODate } from "../utils/dates";
import { workflowStartHolen, workflowHeuteErledigtMerken } from "../utils/workflowStart";
import { MatrixWahl } from "./SpontanStart";

const FADE_SEK = 5;

const LEERER_ZEITPLAN_ENTWURF = {
  wochentage: [],
  festeUhrzeit: false,
  uhrzeit: "09:00",
  gueltigkeitModus: "unbestimmt", // 'unbestimmt' | 'abDatum' | 'zeitraum'
  gueltigVon: toLocalISODate(new Date()),
  gueltigBis: toLocalISODate(new Date()),
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
    aenderungVermerken,
    matrixAufgaben = [],
    matrixAufgabeSpeichern,
  } = useAppData();
  // Aufgabe aus der Matrix (05.10.): woran im Spontan-Workflow gearbeitet wird;
  // nach dem Ende kommt die Frage, ob sie erledigt ist.
  const [matrixAufgabeId, setMatrixAufgabeId] = useState(null);
  const [erledigtFrage, setErledigtFrage] = useState(null);
  // Angekündigter Workflow aus „Als Nächstes“ (06.10.): oben groß mit
  // Überschrift; gestartet wird erst, wenn man selbst „Jetzt starten“ tippt.
  const [anstehendId, setAnstehendId] = useState(null);
  const matrixAufgabe = matrixAufgaben.find((a) => a.id === matrixAufgabeId) || null;
  // Spontan-Workflow (30.09., Nutzerin: „spontan 25 Minuten mit 5 Minuten
  // Pause, offenes Ende, Playlist wählen“): ohne vorher einen benannten
  // Workflow anzulegen. Offenes Ende = läuft, bis man „Fertig“ tippt.
  const [spontan, setSpontan] = useState({ arbeitMin: 25, pauseMin: 5, gesamtMin: 60, offen: true, modus: "durchgehend" });
  const spontanRef = useRef(null);
  const startZeitRef = useRef(null);
  const [bearbeitetId, setBearbeitetId] = useState(null);
  const [laufendesPreset, setLaufendesPreset] = useState(null);
  const [neuerName, setNeuerName] = useState("");
  const [zeitplanOffenFuer, setZeitplanOffenFuer] = useState(null);
  const [zeitplanEntwurf, setZeitplanEntwurf] = useState(LEERER_ZEITPLAN_ENTWURF);
  const [zeitplanFehler, setZeitplanFehler] = useState(null);
  const [musikFehler, setMusikFehler] = useState(null);

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

  // Schnellstart von der Startseite: Preset sofort starten bzw. zum
  // Spontan-Kasten springen.
  useEffect(() => {
    const ziel = workflowStartHolen();
    if (!ziel) return;
    if (ziel.startsWith("anstehend:")) {
      setAnstehendId(ziel.slice(10));
      return;
    }
    if (ziel.startsWith("matrix:")) setMatrixAufgabeId(ziel.slice(7));
    if (ziel === "spontan" || ziel.startsWith("matrix:")) {
      setTimeout(() => spontanRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 50);
      return;
    }
    const preset = (workflowPresets || []).find((p) => p.id === ziel);
    if (preset) starten(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arbeitSekZahl = laufendesPreset ? Math.max(60, Math.round((Number(laufendesPreset.arbeitMin) || 25) * 60)) : 0;
  const pauseSekZahl = laufendesPreset ? Math.max(0, Math.round((Number(laufendesPreset.pauseMin) || 0) * 60)) : 0;
  const rundenZahl = laufendesPreset
    ? laufendesPreset.offen
      ? 99
      : Math.max(1, Math.round(((Number(laufendesPreset.gesamtMin) || 25) * 60) / (arbeitSekZahl + pauseSekZahl)) || 1)
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
    setMusikFehler(null);
    const playlist = spotifyAnlaesse[praesetAnlass(preset.id)];
    if (playlist?.uri) {
      const result = await spotifyAbspielen(playlist.uri);
      if (!result?.ok) setMusikFehler(result?.error || "Wiedergabe fehlgeschlagen.");
    }
    startZeitRef.current = Date.now();
    setLaufendesPreset(preset);
  };

  const beenden = () => {
    musikSync.reset();
    // musikSync.reset() räumt nur den internen Fade-Timer auf, stoppt aber
    // nie tatsächlich die Wiedergabe bei Spotify — Nutzerin-Vorgabe: "sie
    // beendet es nicht, wenn ich den Workflow beende, die Musik läuft dann
    // einfach weiter". Gilt für Fertig- UND Abbrechen-Weg gleichermaßen, da
    // beide hier zusammenlaufen.
    spotifyPausieren();
    // Im Tagesverlauf festhalten (30.09.), damit auch spontane Sessions
    // dokumentiert sind – ab 1 Minute.
    const min = startZeitRef.current ? Math.round((Date.now() - startZeitRef.current) / 60000) : 0;
    if (laufendesPreset && min >= 1) aenderungVermerken?.({ kategorie: "workflow", itemName: laufendesPreset.name, aktion: "erledigt", detail: `${min} Min.` });
    if (laufendesPreset?.id && min >= 1) workflowHeuteErledigtMerken(laufendesPreset.id);
    if (laufendesPreset?.matrixAufgabeId) setErledigtFrage(laufendesPreset.matrixAufgabeId);
    startZeitRef.current = null;
    setLaufendesPreset(null);
  };

  const anstehend = anstehendId ? (workflowPresets || []).find((p) => p.id === anstehendId) || null : null;
  const wochentagHeute = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date().getDay()];
  const heuteGeplant = (workflowPlaene || [])
    .filter((p) => !p.wochentage?.length || p.wochentage.includes(wochentagHeute))
    .sort((a, b) => String(a.uhrzeit || "99").localeCompare(String(b.uhrzeit || "99")));

  return (
    <Shell bereich="gewohnheit">
      {/* Bug-Fix: Der Home-Knopf rief bisher direkt onSchliessen() auf und
          umging damit beenden() — genau den Fix, der laut Kommentar oben
          extra für "Musik läuft nach dem Beenden einfach weiter" eingebaut
          wurde. Verließ man eine laufende Session über ⌂ statt über
          "Abbrechen"/"Fertig", spielte Spotify unbemerkt weiter. Jetzt läuft
          bei laufendem Preset erst beenden() (stoppt Musik), danach erst
          die eigentliche Navigation. */}
      <ViewHeader
        title="⏱️ Workflow"
        onHome={
          laufendesPreset
            ? () => {
                beenden();
                onSchliessen?.();
              }
            : onSchliessen
        }
      />

      {!laufendesPreset ? (
        <>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
            Arbeitsphasen in Intervallen mit Pausen dazwischen — z. B. 25 Minuten Arbeit, 5 Minuten Pause. Lege dir mehrere
            benannte Workflows an, jeder mit eigener Playlist (z. B. "Deep Work" mit ruhiger Musik, "E-Mails" mit was
            Flotterem) und optional festen Tagen/Uhrzeiten, dann taucht er auch im Tagesplan auf.
          </div>

          {anstehend && (
            <Card style={{ marginBottom: 14, border: "2px solid #C43A8E" }}>
              <div data-workflow-anstehend style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5, color: "#C43A8E" }}>STEHT JETZT AN</div>
              <div style={{ fontSize: 21, fontWeight: 900, margin: "2px 0 4px" }}>{anstehend.name}</div>
              <div style={{ fontSize: 13, color: textMuted, marginBottom: 10 }}>
                {anstehend.arbeitMin} Min. Arbeit · {anstehend.pauseMin} Min. Pause · {anstehend.offen ? "offenes Ende" : `ca. ${anstehend.gesamtMin} Min. insgesamt`}
              </div>
              {heuteGeplant.length > 1 && (
                <div style={{ fontSize: 12.5, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>Heute geplant, in dieser Reihenfolge:</div>
                  {heuteGeplant.map((p, i) => (
                    <div key={p.id} style={{ color: p.presetId === anstehend.id ? "inherit" : textMuted, fontWeight: p.presetId === anstehend.id ? 800 : 500 }}>
                      {i + 1}. {(workflowPresets || []).find((x) => x.id === p.presetId)?.name || "Workflow"}
                      {p.uhrzeit ? ` · ${p.uhrzeit.slice(0, 5)}` : ""}
                    </div>
                  ))}
                </div>
              )}
              <PrimaryButton
                onClick={() => {
                  setAnstehendId(null);
                  starten(anstehend);
                }}
              >
                ▶ Jetzt starten
              </PrimaryButton>
            </Card>
          )}
          {erledigtFrage && (
            <Card style={{ marginBottom: 14 }}>
              <div data-matrix-erledigt-frage style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
                Ist „{matrixAufgaben.find((x) => x.id === erledigtFrage)?.titel}“ erledigt?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <PrimaryButton variant="ghost" onClick={() => setErledigtFrage(null)}>Noch nicht</PrimaryButton>
                </div>
                <div style={{ flex: 1 }}>
                  <PrimaryButton
                    variant="success"
                    onClick={async () => {
                      const x = matrixAufgaben.find((m) => m.id === erledigtFrage);
                      if (x) {
                        await matrixAufgabeSpeichern?.({ ...x, erledigtAm: new Date().toISOString() });
                        aenderungVermerken?.({ kategorie: "workflow", itemName: x.titel, aktion: "erledigt", detail: "Aufgabe aus der Matrix" });
                      }
                      setErledigtFrage(null);
                      setMatrixAufgabeId(null);
                    }}
                  >
                    ✓ Ja, erledigt
                  </PrimaryButton>
                </div>
              </div>
            </Card>
          )}
          <div ref={spontanRef} data-spontan-workflow>
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>⚡ Spontan-Workflow</div>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>Einstellen und los – ohne vorher etwas anzulegen.</div>
              <MatrixWahl gewaehlt={matrixAufgabeId} onWahl={(x) => setMatrixAufgabeId((id) => (id === x.id ? null : x.id))} max={6} />
              <Label>Arbeiten</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {[15, 25, 45, 50].map((m) => (
                  <Pill key={m} label={`${m} Min.`} selected={spontan.arbeitMin === m} onClick={() => setSpontan((x) => ({ ...x, arbeitMin: m }))} />
                ))}
              </div>
              <Label>Pause dazwischen</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {[0, 5, 10, 15].map((m) => (
                  <Pill key={m} label={m ? `${m} Min.` : "Keine"} selected={spontan.pauseMin === m} onClick={() => setSpontan((x) => ({ ...x, pauseMin: m }))} />
                ))}
              </div>
              <Label>Wie lange?</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                <Pill label="Offenes Ende" selected={spontan.offen} onClick={() => setSpontan((x) => ({ ...x, offen: true }))} />
                {[60, 90, 120].map((m) => (
                  <Pill key={m} label={`${m} Min.`} selected={!spontan.offen && spontan.gesamtMin === m} onClick={() => setSpontan((x) => ({ ...x, offen: false, gesamtMin: m }))} />
                ))}
              </div>
              <SpotifyAnlassPicker anlass={praesetAnlass("spontan")} label="🎵 Playlist (optional)" />
              <MusikModusToggle modus={spontan.modus} onChange={(v) => setSpontan((x) => ({ ...x, modus: v }))} />
              <div style={{ marginTop: 10 }}>
                <PrimaryButton onClick={() => starten({ id: "spontan", name: matrixAufgabe ? `⚡ ${matrixAufgabe.titel}` : "⚡ Spontan-Workflow", ...spontan, matrixAufgabeId: matrixAufgabe?.id || null })}>
                  {matrixAufgabe ? `▶ „${matrixAufgabe.titel}“ starten` : "▶ Jetzt starten"}
                </PrimaryButton>
              </div>
            </Card>
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
                      onClick={() => {
                        if (!window.confirm(`"${preset.name}" endgültig löschen? Zugeordnete Zeitpläne und Playlist-Zuordnung gehen dabei mit verloren.`)) return;
                        presetLoeschen(preset.id);
                      }}
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
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "color-mix(in srgb, #FAFBFA var(--mp-flaeche), var(--mp-karte))", border: `1px solid ${cardBorder}` }}>
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
          {musikFehler && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "color-mix(in srgb, #FBEAE7 var(--mp-flaeche), var(--mp-karte))", color: danger, borderRadius: 12, padding: "8px 12px", fontSize: 12, marginBottom: 12, textAlign: "left" }}>
              <span>🎵 Playlist konnte nicht gestartet werden: {musikFehler}</span>
              <button
                type="button"
                onClick={() => setMusikFehler(null)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{laufendesPreset.name}</div>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>{laufendesPreset.offen ? `Offenes Ende · ${laufendesPreset.arbeitMin} Min. Arbeit / ${laufendesPreset.pauseMin} Min. Pause` : `${tatsaechlicheGesamtMin} Min. insgesamt`}</div>
          <Timer
            mode="interval"
            arbeitSek={arbeitSekZahl}
            pauseSek={pauseSekZahl}
            runden={rundenZahl}
            rundenOffen={!!laufendesPreset.offen}
            autoStart
            fadeVorlaufSek={FADE_SEK}
            onPhaseStart={musikSync.onPhaseStart}
            onPhaseEndeNaht={musikSync.onPhaseEndeNaht}
            onFertig={beenden}
          />
          <div style={{ marginTop: 14 }}>
            <PrimaryButton variant={laufendesPreset.offen ? "success" : "ghost"} onClick={beenden}>
              {laufendesPreset.offen ? "✓ Fertig für heute" : "Abbrechen"}
            </PrimaryButton>
          </div>
        </Card>
      )}
    </Shell>
  );
}
