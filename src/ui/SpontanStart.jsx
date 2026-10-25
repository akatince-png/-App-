import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { LEERE_UEBUNG } from "./UebungenEditor";
import { toLocalISODate } from "../utils/dates";
import { QUADRANT, fristText, quadrantVon } from "../utils/matrix";
import { AppKacheln } from "./SchnellFenster";
import SchnellIcon from "./SchnellIcon";

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

// Seit 25.10. im eigenen Fenster (SchnellFenster): keine Karte drumherum,
// Abschnitte direkt auf dem Hintergrund.
const box = {};
const titel = { fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", letterSpacing: 0.4, margin: "4px 2px 8px" };
// „Heute geplant – vorziehen?“ als ruhige Karte mit deutlichem ▶-Knopf.
const vorziehen = { width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", borderRadius: 18, padding: "10px 10px 10px 12px", marginBottom: 8, background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)", cursor: "pointer", fontFamily: "inherit", color: "var(--mp-text)" };
const jetztKnopf = (farbe) => ({ flexShrink: 0, borderRadius: 99, padding: "8px 13px", fontSize: 13, fontWeight: 800, background: farbe, color: "#fff" });
const kleinesSymbol = (hell, farbe) => ({ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: `linear-gradient(135deg, ${hell}, ${farbe})`, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" });
const abschnitt = { marginBottom: 20 };
const zeile = (farbe) => ({ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "none", borderRadius: 14, padding: "11px 12px", marginBottom: 6, background: `color-mix(in srgb, ${farbe} var(--mp-flaeche), var(--mp-rand-dunkel))`, cursor: "pointer", fontFamily: "inherit", color: "var(--mp-text)" });
const chip = (an) => ({ border: "none", borderRadius: 99, padding: "9px 14px", boxShadow: an ? "none" : "var(--mp-schatten)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: an ? "var(--mp-accent)" : "var(--mp-karte)", color: an ? "#fff" : "var(--mp-text)" });
const zahl = { width: 64, border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "7px 8px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };

// ---------------------------------------------------------------- Training
const SPONTAN_ARTEN = [
  { id: "wdh", icon: "training", label: "Wiederholungen", sub: "Sätze zählen, z. B. Kettlebell – auch mit Kamera", hell: "#FF8A73", farbe: "#D13A26" },
  { id: "zeit", icon: "stoppuhr", label: "Auf Zeit", sub: "Stoppuhr läuft, du hörst auf, wann du willst", hell: "#FFB85C", farbe: "#D9730D" },
  { id: "intervall", icon: "wiederholen", label: "Intervall", sub: "Belastung / Pause im Wechsel", hell: "#6FB2FF", farbe: "#2D6FD6" },
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
      {/* Kacheln zuerst (25.10., Nutzerin): drei Arten nebeneinander. */}
      <div style={abschnitt}>
        <div style={titel}>SPONTAN – WAS MÖCHTEST DU MACHEN?</div>
        <AppKacheln
          label="Trainingsart"
          gewaehlt={art}
          kacheln={SPONTAN_ARTEN.map((a) => ({ id: a.id, icon: a.icon, titel: a.label, label: a.label, hell: a.hell, farbe: a.farbe, onClick: () => setArt(art === a.id ? null : a.id) }))}
        />
        {art && (
          <div data-spontan-form style={{ padding: 14, borderRadius: 20, background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)" }}>
            <div style={{ fontSize: 13, color: "var(--mp-text-muted)", marginBottom: 10 }}>{SPONTAN_ARTEN.find((a) => a.id === art)?.sub}</div>
            {art !== "intervall" && (
              <input value={uebung} onChange={(e) => setUebung(e.target.value)} aria-label="Was machst du?" placeholder="z. B. Kettlebell-Swings, Liegestütze, Laufen" style={{ ...zahl, width: "100%", boxSizing: "border-box", marginBottom: 10 }} />
            )}
            {art === "wdh" && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 10 }}>
                <input value={saetze} onChange={(e) => setSaetze(e.target.value)} inputMode="numeric" aria-label="Sätze" style={zahl} /> Sätze ×
                <input value={wdh} onChange={(e) => setWdh(e.target.value)} inputMode="numeric" aria-label="Wiederholungen" style={zahl} /> Wdh.
              </div>
            )}
            {art === "intervall" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 10 }}>
                <input value={arbeit} onChange={(e) => setArbeit(e.target.value)} inputMode="numeric" aria-label="Belastung Sekunden" style={zahl} /> s Belastung
                <input value={pause} onChange={(e) => setPause(e.target.value)} inputMode="numeric" aria-label="Pause Sekunden" style={zahl} /> s Pause
                <input value={runden} onChange={(e) => setRunden(e.target.value)} inputMode="numeric" aria-label="Runden" style={zahl} /> Runden
              </div>
            )}
            <button type="button" onClick={spontan} disabled={laeuft} style={{ ...chip(true), width: "100%", padding: "13px", fontSize: 15, background: `linear-gradient(135deg, ${SPONTAN_ARTEN.find((a) => a.id === art)?.hell}, ${SPONTAN_ARTEN.find((a) => a.id === art)?.farbe})` }}>
              ▶ Los geht&apos;s
            </button>
          </div>
        )}
        {fehler && <div style={{ color: "#C0392B", fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      </div>

      {heuteOffen.length > 0 && (
        <div style={abschnitt}>
          <div style={titel}>HEUTE GEPLANT – VORZIEHEN?</div>
          {heuteOffen.map((t) => (
            <button key={t.key} type="button" className="mp-tap" onClick={() => onVorziehen(t)} style={vorziehen}>
              <span aria-hidden="true" style={kleinesSymbol("#FF8A73", "#D13A26")}><SchnellIcon name="training" size={22} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14 }}>{t.name || t.detail || "Training"}</b>
                <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{t.uhrzeit ? `geplant ${t.uhrzeit} Uhr` : "heute geplant"}</span>
              </span>
              <span style={jetztKnopf("#D13A26")}>▶ Jetzt</span>
            </button>
          ))}
        </div>
      )}

      {trainingTemplates.length > 0 && (
        <div style={abschnitt}>
          <div style={titel}>AUS MEINEN TRAININGSPLÄNEN</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {trainingTemplates.slice(0, 8).map((tpl) => (
              <button key={tpl.id} type="button" onClick={() => ausPlan(tpl)} style={chip(false)}>
                ▶ {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onMehr} style={{ border: "none", background: "none", padding: "4px 2px 0", fontSize: 13, fontWeight: 700, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
        Alle Möglichkeiten im Trainingsbereich ›
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Workflow
export function WorkflowStartAuswahl({ heuteGeplant = [], onStart, onFokus }) {
  const { workflowPresets = [] } = useAppData();
  return (
    <div data-workflow-auswahl style={box}>
      <div style={abschnitt}>
        <div style={titel}>SOFORT LOSLEGEN</div>
        <AppKacheln
          label="Workflow starten"
          kacheln={[
            { id: "spontan", icon: "blitz", titel: "Spontan-Workflow", label: "Spontan-Workflow: Intervalle, Playlist und Dauer selbst wählen", hell: "#8FA2FF", farbe: "#4B5FD6", onClick: () => onStart("spontan") },
            // Gemeinsam fokussieren gehört zum Arbeiten, nicht zu den Spielen (24.10., Nutzerin).
            ...(onFokus ? [{ id: "fokus", icon: "ziel", titel: "Gemeinsam fokussieren", label: "Gemeinsam fokussieren (Body Doubling)", hell: "#5FD4C0", farbe: "#178A78", onClick: onFokus }] : []),
          ]}
        />
      </div>
      {heuteGeplant.length > 0 && (
        <div style={abschnitt}>
          <div style={titel}>HEUTE GEPLANT – VORZIEHEN?</div>
          {heuteGeplant.map((w) => (
            <button key={w.key} type="button" className="mp-tap" onClick={() => onStart(w.raw?.preset?.id || w.raw?.presetId)} style={vorziehen}>
              <span aria-hidden="true" style={kleinesSymbol("#F07BC0", "#A12A74")}><SchnellIcon name="workflow" size={22} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14 }}>{w.name}</b>
                <span style={{ fontSize: 12, color: "var(--mp-text-muted)" }}>{w.uhrzeit ? `geplant ${w.uhrzeit} Uhr · ` : ""}{w.detail}</span>
              </span>
              <span style={jetztKnopf("#A12A74")}>▶ Jetzt</span>
            </button>
          ))}
        </div>
      )}
      {workflowPresets.length > 0 && (
        <div style={abschnitt}>
          <div style={titel}>MEINE WORKFLOWS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {workflowPresets.map((p) => (
              <button key={p.id} type="button" onClick={() => onStart(p.id)} style={chip(false)}>
                ▶ {p.name} <span style={{ fontWeight: 500, opacity: 0.8 }}>{p.arbeitMin}/{p.pauseMin}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <MatrixWahl onWahl={(a) => onStart(`matrix:${a.id}`)} max={4} />
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
