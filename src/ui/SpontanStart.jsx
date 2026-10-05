import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { LEERE_UEBUNG } from "./UebungenEditor";
import { toLocalISODate } from "../utils/dates";
import { QUADRANT, fristText, quadrantVon } from "../utils/matrix";

// Spontan starten (30.09., Nutzerin: „wenn man gerade Fokus, Inspiration
// oder Power hat“): Knöpfe „Training“ und „Workflow“ auf der Startseite.
// Steht heute noch etwas davon an, wird zuerst „Jetzt vorziehen?“
// angeboten; sonst ein gespeicherter Plan oder etwas ganz Spontanes.
// Alles Weitere (Stoppuhr, Intervall, Kamera-Zählung, Playlist) läuft in
// den vorhandenen Live-Ansichten – hier wird nur schnell gestartet.

const jetztUhrzeit = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const box = { gridColumn: "1 / -1", padding: 12, borderRadius: 20, background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)" };
const titel = { fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", letterSpacing: 0.3, margin: "4px 2px 6px" };
const zeile = (farbe) => ({ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "none", borderRadius: 14, padding: "11px 12px", marginBottom: 6, background: `color-mix(in srgb, ${farbe} var(--mp-flaeche), var(--mp-rand-dunkel))`, cursor: "pointer", fontFamily: "inherit", color: "var(--mp-text)" });
const chip = (an) => ({ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: an ? "var(--mp-accent)" : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: an ? "#fff" : "var(--mp-text)" });
const zahl = { width: 64, border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "7px 8px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };

// ---------------------------------------------------------------- Training
const SPONTAN_ARTEN = [
  { id: "wdh", icon: "🏋️", label: "Wiederholungen", sub: "Sätze zählen, z. B. Kettlebell – auch mit Kamera" },
  { id: "zeit", icon: "⏱️", label: "Auf Zeit", sub: "Stoppuhr läuft, du hörst auf, wann du willst" },
  { id: "intervall", icon: "🔁", label: "Intervall", sub: "Belastung / Pause im Wechsel" },
];

export function TrainingStartAuswahl({ heuteOffen = [], onVorziehen, onGestartet, onMehr }) {
  const { trainingTemplates = [], trainingHinzufuegen } = useAppData();
  const [art, setArt] = useState(null);
  const [uebung, setUebung] = useState("Kettlebell-Swings");
  const [saetze, setSaetze] = useState("3");
  const [wdh, setWdh] = useState("15");
  const [arbeit, setArbeit] = useState("40");
  const [pause, setPause] = useState("20");
  const [runden, setRunden] = useState("8");
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  const anlegen = async (eintrag) => {
    if (laeuft) return;
    setLaeuft(true);
    setFehler(null);
    const r = await trainingHinzufuegen({ datum: toLocalISODate(new Date()), uhrzeit: jetztUhrzeit(), erledigt: false, ...eintrag });
    setLaeuft(false);
    if (!r?.ok) return setFehler(r?.error || "Training konnte nicht gestartet werden.");
    onGestartet?.(r.eintrag.id);
  };

  const ausPlan = (tpl) =>
    anlegen({
      art: tpl.art,
      name: tpl.name,
      uebungen: tpl.uebungen?.length ? tpl.uebungen.map((u) => ({ ...u, pauseSekunden: String(u.pauseSekunden || 180) })) : [],
      dauerMin: tpl.dauerMin ? String(tpl.dauerMin) : "",
      runden: tpl.runden ? String(tpl.runden) : "5",
      cardioArt: tpl.cardioArt || "",
      cardioModus: tpl.cardioModus || "",
      intervallArbeitSek: tpl.intervallArbeitSek ? String(tpl.intervallArbeitSek) : "",
      intervallPauseSek: tpl.intervallPauseSek ? String(tpl.intervallPauseSek) : "",
      templateId: tpl.id,
    });

  const spontan = () => {
    if (art === "wdh")
      return anlegen({ art: "Krafttraining", name: `Spontan: ${uebung.trim() || "Kraft"}`, uebungen: [{ ...LEERE_UEBUNG, name: uebung.trim() || "Übung", saetze, wiederholungen: wdh, pauseSekunden: "90" }] });
    if (art === "zeit") return anlegen({ art: "Sonstiges", name: `Spontan: ${uebung.trim() || "Training"}`, uebungen: [] });
    return anlegen({ art: "Bodyweight", bodyweightModus: "Intervall", name: "Spontan: Intervall", uebungen: [], intervallArbeitSek: arbeit, intervallPauseSek: pause, runden });
  };

  return (
    <div data-training-auswahl style={box}>
      {heuteOffen.length > 0 && (
        <>
          <div style={titel}>HEUTE STEHT NOCH AN – VORZIEHEN?</div>
          {heuteOffen.map((t) => (
            <button key={t.key} type="button" className="mp-tap" onClick={() => onVorziehen(t)} style={zeile("#FDE3DF")}>
              <span style={{ fontSize: 22 }}>🏋️</span>
              <span style={{ flex: 1 }}>
                <b style={{ display: "block", fontSize: 14 }}>{t.name || t.detail || "Training"}</b>
                <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{t.uhrzeit ? `geplant ${t.uhrzeit} Uhr` : "heute geplant"}</span>
              </span>
              <b style={{ fontSize: 13, color: "#B42318" }}>▶ Jetzt</b>
            </button>
          ))}
        </>
      )}

      {trainingTemplates.length > 0 && (
        <>
          <div style={titel}>{heuteOffen.length ? "ODER EIN GESPEICHERTER PLAN" : "AUS MEINEN TRAININGSPLÄNEN"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {trainingTemplates.slice(0, 8).map((tpl) => (
              <button key={tpl.id} type="button" onClick={() => ausPlan(tpl)} style={chip(false)}>
                ▶ {tpl.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={titel}>SPONTAN – WAS MÖCHTEST DU MACHEN?</div>
      {SPONTAN_ARTEN.map((a) => (
        <button key={a.id} type="button" className="mp-tap" aria-pressed={art === a.id} onClick={() => setArt(art === a.id ? null : a.id)} style={{ ...zeile(art === a.id ? "#E3E8FF" : "#F4F6FA"), outline: art === a.id ? "2px solid var(--mp-accent)" : "none" }}>
          <span style={{ fontSize: 22 }}>{a.icon}</span>
          <span style={{ flex: 1 }}>
            <b style={{ display: "block", fontSize: 14 }}>{a.label}</b>
            <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{a.sub}</span>
          </span>
        </button>
      ))}
      {art && (
        <div data-spontan-form style={{ padding: "6px 2px 2px" }}>
          {art !== "intervall" && (
            <input value={uebung} onChange={(e) => setUebung(e.target.value)} aria-label="Was machst du?" placeholder="z. B. Kettlebell-Swings, Liegestütze, Laufen" style={{ ...zahl, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />
          )}
          {art === "wdh" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 8 }}>
              <input value={saetze} onChange={(e) => setSaetze(e.target.value)} inputMode="numeric" aria-label="Sätze" style={zahl} /> Sätze ×
              <input value={wdh} onChange={(e) => setWdh(e.target.value)} inputMode="numeric" aria-label="Wiederholungen" style={zahl} /> Wdh.
            </div>
          )}
          {art === "intervall" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 8 }}>
              <input value={arbeit} onChange={(e) => setArbeit(e.target.value)} inputMode="numeric" aria-label="Belastung Sekunden" style={zahl} /> s Belastung
              <input value={pause} onChange={(e) => setPause(e.target.value)} inputMode="numeric" aria-label="Pause Sekunden" style={zahl} /> s Pause
              <input value={runden} onChange={(e) => setRunden(e.target.value)} inputMode="numeric" aria-label="Runden" style={zahl} /> Runden
            </div>
          )}
          <button type="button" onClick={spontan} disabled={laeuft} style={{ ...chip(true), width: "100%", padding: "12px", fontSize: 15 }}>
            ▶ Los geht&apos;s
          </button>
        </div>
      )}
      {fehler && <div style={{ color: "#C0392B", fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      <button type="button" onClick={onMehr} style={{ border: "none", background: "none", padding: "8px 2px 0", fontSize: 12.5, fontWeight: 700, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
        Alle Möglichkeiten im Trainingsbereich ›
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Workflow
export function WorkflowStartAuswahl({ heuteGeplant = [], onStart }) {
  const { workflowPresets = [] } = useAppData();
  return (
    <div data-workflow-auswahl style={box}>
      {heuteGeplant.length > 0 && (
        <>
          <div style={titel}>HEUTE GEPLANT – VORZIEHEN?</div>
          {heuteGeplant.map((w) => (
            <button key={w.key} type="button" className="mp-tap" onClick={() => onStart(w.raw?.preset?.id || w.raw?.presetId)} style={zeile("#F8E0EE")}>
              <span style={{ fontSize: 22 }}>⏱️</span>
              <span style={{ flex: 1 }}>
                <b style={{ display: "block", fontSize: 14 }}>{w.name}</b>
                <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{w.uhrzeit ? `geplant ${w.uhrzeit} Uhr · ` : ""}{w.detail}</span>
              </span>
              <b style={{ fontSize: 13, color: "#86285F" }}>▶ Jetzt</b>
            </button>
          ))}
        </>
      )}
      {workflowPresets.length > 0 && (
        <>
          <div style={titel}>MEINE WORKFLOWS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {workflowPresets.map((p) => (
              <button key={p.id} type="button" onClick={() => onStart(p.id)} style={chip(false)}>
                ▶ {p.name} <span style={{ fontWeight: 500, opacity: 0.8 }}>{p.arbeitMin}/{p.pauseMin}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <MatrixWahl onWahl={(a) => onStart(`matrix:${a.id}`)} max={4} />
      <button type="button" className="mp-tap" onClick={() => onStart("spontan")} style={zeile("#E3E8FF")}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ flex: 1 }}>
          <b style={{ display: "block", fontSize: 14 }}>Spontan-Workflow</b>
          <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>Intervalle, Playlist und Dauer selbst wählen – auch offenes Ende</span>
        </span>
        <b style={{ fontSize: 13, color: "var(--mp-accent-dark-text)" }}>›</b>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Matrix
// Aufgaben aus der Matrix für einen Workflow wählen (05.10., Nutzerin: „wenn
// ich Spontan-Workflow starte, Zugriff auf meine Matrix, um eine Aufgabe zu
// wählen – damit ich die auch abgearbeitet habe“). Offene Aufgaben, rot zuerst.
const REIHENFOLGE = { jetzt: 0, planen: 1, kurz: 2, spaeter: 3 };

export function MatrixWahl({ gewaehlt = null, onWahl, max = 8 }) {
  const { matrixAufgaben = [], projekte = [] } = useAppData();
  const offen = matrixAufgaben
    .filter((a) => !a.erledigtAm)
    .sort((a, b) => REIHENFOLGE[quadrantVon(a)] - REIHENFOLGE[quadrantVon(b)] || (a.frist || "9").localeCompare(b.frist || "9"));
  const projektName = (id) => projekte.find((p) => p.id === id)?.name;
  return (
    <div data-matrix-wahl>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 2px 6px" }}>
        <span style={titel}>AUS DEINER MATRIX</span>
        <button type="button" onClick={() => (window.location.hash = "#/matrix")} style={{ border: "none", background: "none", padding: 0, fontSize: 12, fontWeight: 800, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
          Matrix öffnen ›
        </button>
      </div>
      {!offen.length && <div style={{ fontSize: 12.5, color: "var(--mp-text-muted)", margin: "0 2px 8px" }}>Noch keine offenen Aufgaben in deiner Matrix.</div>}
      {offen.slice(0, max).map((a) => {
        const q = QUADRANT[quadrantVon(a)];
        const an = gewaehlt === a.id;
        return (
          <button
            key={a.id}
            type="button"
            className="mp-tap"
            aria-pressed={an}
            data-matrix-aufgabe={a.id}
            onClick={() => onWahl(a)}
            style={{ ...zeile(q.bg), outline: an ? `2px solid ${q.farbe}` : "none", outlineOffset: -2 }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 99, background: q.farbe, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 14 }}>{a.titel}</b>
              <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>
                {[q.titel, a.naechsterSchritt && `Nächster Schritt: ${a.naechsterSchritt}`, a.frist && fristText(a.frist), projektName(a.projektId)].filter(Boolean).join(" · ")}
              </span>
            </span>
            <b style={{ fontSize: 13, color: q.schrift }}>{an ? "✓" : "▶"}</b>
          </button>
        );
      })}
      {offen.length > max && <div style={{ fontSize: 12, color: "var(--mp-text-muted)", margin: "0 2px 6px" }}>+ {offen.length - max} weitere in der Matrix</div>}
    </div>
  );
}
