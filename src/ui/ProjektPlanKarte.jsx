import React, { useState } from "react";
import { Card } from "./primitives";
import { useAppData } from "../context/AppDataContext";
import { WOCHENTAGE } from "../utils/kalender";
import { toLocalISODate } from "../utils/dates";
import { fristText } from "../utils/matrix";
import { istSession, projektStand, sessionAufgaben, sessionTermine } from "../utils/projekt";

// Langzeit-Projekt in der Matrix (24.10.): Ziel, Zeitraum, Rhythmus der
// Work-Sessions, Fortschritt – und „nächste 2 Wochen einplanen“, das die
// Sessions als Matrix-Aufgaben anlegt (→ Tagesplan, Tafel, Kalender, Erinnerung).

const feld = { width: "100%", boxSizing: "border-box", border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };
const chip = (an) => ({ border: "none", borderRadius: 99, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: an ? "var(--mp-accent)" : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: an ? "#fff" : "var(--mp-text)" });
const label = { fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "10px 0 4px" };

export function ProjektBalken({ projekt: roh, onWahl, ohneName = false }) {
  const projekt = { ...roh, sessionTage: roh.sessionTage || [] };
  const { matrixAufgaben = [] } = useAppData();
  const s = projektStand(projekt, matrixAufgaben);
  return (
    <button type="button" data-projekt-balken onClick={onWahl} style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "6px 0", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
        <span>{ohneName ? "Fortschritt" : `🗂️ ${projekt.name}`}</span>
        <span style={{ color: s.imPlan ? "var(--mp-text-muted)" : "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))" }}>
          {s.ziel ? `${s.fertig}/${s.ziel} Sessions` : `${s.fertig} Sessions`}
          {s.restWochen != null ? ` · noch ${s.restWochen} Wo.` : ""}
          {!s.imPlan ? " · etwas hinter dem Plan" : ""}
        </span>
      </div>
      {s.anteil != null && (
        <div style={{ height: 6, borderRadius: 6, background: "var(--mp-rand)", marginTop: 4, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(s.anteil * 100)}%`, height: "100%", background: s.imPlan ? "var(--mp-accent)" : "#E0A21B" }} />
        </div>
      )}
    </button>
  );
}

export default function ProjektPlanKarte({ projekt: roh }) {
  const projekt = { ...roh, sessionTage: roh.sessionTage || [] };
  const { matrixAufgaben = [], matrixAufgabeSpeichern, projektPlanSpeichern } = useAppData();
  const [bearbeiten, setBearbeiten] = useState(!projekt.deadline && !projekt.sessionTage.length);
  const [plan, setPlan] = useState(() => ({ ziel: projekt.ziel, start: projekt.start || toLocalISODate(new Date()), deadline: projekt.deadline || "", sessionTage: projekt.sessionTage, sessionUhrzeit: projekt.sessionUhrzeit, sessionDauerMin: projekt.sessionDauerMin || 45, sessionsZiel: projekt.sessionsZiel || "" }));
  const [meldung, setMeldung] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const s = projektStand(projekt, matrixAufgaben);
  const termine = sessionTermine(projekt, matrixAufgaben);
  const naechste = matrixAufgaben.filter((a) => istSession(a, projekt.id) && !a.erledigtAm && a.geplantAm).sort((x, y) => x.geplantAm.localeCompare(y.geplantAm)).slice(0, 4);
  const setze = (teil) => setPlan((p) => ({ ...p, ...teil }));

  // Vorschlag für die Zahl der Sessions: Wochen × Tage pro Woche.
  const vorschlag = (() => {
    if (!plan.start || !plan.deadline || !plan.sessionTage.length) return null;
    const wochen = Math.max(1, Math.round((new Date(`${plan.deadline}T12:00:00`) - new Date(`${plan.start}T12:00:00`)) / (7 * 864e5)));
    return wochen * plan.sessionTage.length;
  })();

  const speichern = async () => {
    setMeldung(null);
    const r = await projektPlanSpeichern?.(projekt.id, { ...plan, sessionsZiel: plan.sessionsZiel || vorschlag });
    if (r?.ok === false) return setMeldung(r.error);
    setBearbeiten(false);
    setMeldung("Plan gespeichert.");
  };
  const einplanen = async () => {
    setLaeuft(true);
    setMeldung(null);
    let n = 0;
    for (const a of sessionAufgaben(projekt, termine)) {
      const r = await matrixAufgabeSpeichern?.(a);
      if (r?.ok !== false) n++;
    }
    setLaeuft(false);
    setMeldung(n ? `${n} ${n === 1 ? "Session" : "Sessions"} eingeplant – sie stehen jetzt im Tagesplan, auf der Tafel und im Kalender.` : "Nichts eingeplant.");
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <div data-projekt-plan style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>🗂️ {projekt.name}</div>
        <button type="button" onClick={() => setBearbeiten(!bearbeiten)} style={{ ...chip(bearbeiten), padding: "5px 10px" }}>
          ⚙️ Plan
        </button>
      </div>
      {projekt.ziel && <div style={{ fontSize: 13, color: "var(--mp-text-muted)", marginTop: 2 }}>🎯 {projekt.ziel}</div>}
      <div style={{ marginTop: 6 }}>
        <ProjektBalken projekt={projekt} onWahl={() => {}} ohneName />
      </div>
      {!s.imPlan && <div style={{ fontSize: 12.5, marginTop: 2, color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))" }}>Du liegst etwas hinter deinem Plan – vielleicht eine Extra-Session einplanen? Kein Drama, einfach weiter.</div>}

      {bearbeiten && (
        <div data-projekt-editor>
          <div style={label}>🎯 ZIEL</div>
          <input value={plan.ziel} onChange={(e) => setze({ ziel: e.target.value })} placeholder="z. B. Webseite fertig und online" aria-label="Projektziel" style={feld} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={label}>START</div>
              <input type="date" value={plan.start || ""} onChange={(e) => setze({ start: e.target.value })} aria-label="Projektstart" style={feld} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={label}>⏰ DEADLINE</div>
              <input type="date" value={plan.deadline || ""} onChange={(e) => setze({ deadline: e.target.value })} aria-label="Projekt-Deadline" style={feld} />
            </div>
          </div>
          <div style={label}>WORK-SESSIONS AN DIESEN TAGEN</div>
          <div role="group" aria-label="Session-Tage" style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {WOCHENTAGE.map((t) => (
              <button key={t} type="button" aria-pressed={plan.sessionTage.includes(t)} onClick={() => setze({ sessionTage: plan.sessionTage.includes(t) ? plan.sessionTage.filter((x) => x !== t) : [...plan.sessionTage, t] })} style={chip(plan.sessionTage.includes(t))}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={label}>🕐 UHRZEIT</div>
              <input type="time" value={plan.sessionUhrzeit || ""} onChange={(e) => setze({ sessionUhrzeit: e.target.value })} aria-label="Session-Uhrzeit" style={{ ...feld, width: 120 }} />
            </div>
            <div>
              <div style={label}>DAUER</div>
              <div style={{ display: "flex", gap: 5 }}>
                {[30, 45, 60, 90].map((m) => (
                  <button key={m} type="button" aria-pressed={Number(plan.sessionDauerMin) === m} onClick={() => setze({ sessionDauerMin: m })} style={chip(Number(plan.sessionDauerMin) === m)}>
                    {m} Min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={label}>SESSIONS INSGESAMT</div>
          <input type="number" min={1} value={plan.sessionsZiel} onChange={(e) => setze({ sessionsZiel: e.target.value })} placeholder={vorschlag ? `Vorschlag: ${vorschlag}` : "z. B. 12"} aria-label="Sessions insgesamt" style={{ ...feld, width: 160 }} />
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={speichern} style={{ ...chip(true), padding: "9px 16px" }}>
              Plan speichern
            </button>
          </div>
        </div>
      )}

      {!bearbeiten && projekt.sessionTage.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button type="button" data-projekt-einplanen disabled={!termine.length || laeuft} onClick={einplanen} style={{ ...chip(true), padding: "9px 14px", opacity: termine.length && !laeuft ? 1 : 0.5 }}>
            🗓️ Nächste 2 Wochen einplanen{termine.length ? ` (${termine.length})` : ""}
          </button>
          {!termine.length && <span style={{ fontSize: 12, color: "var(--mp-text-muted)", marginLeft: 8 }}>Die nächsten 2 Wochen sind schon eingeplant.</span>}
          <div style={{ fontSize: 12, color: "var(--mp-text-muted)", marginTop: 6 }}>
            {projekt.sessionTage.join(", ")}
            {projekt.sessionUhrzeit ? ` · ${projekt.sessionUhrzeit} Uhr` : ""}
            {projekt.sessionDauerMin ? ` · ${projekt.sessionDauerMin} Min.` : ""}
            {projekt.deadline ? ` · Deadline ${fristText(projekt.deadline)}` : ""}
          </div>
          {naechste.length > 0 && (
            <div style={{ fontSize: 12.5, marginTop: 6 }}>
              Nächste: {naechste.map((a) => `${fristText(a.geplantAm)}${a.uhrzeit ? ` ${a.uhrzeit}` : ""}`).join(" · ")}
            </div>
          )}
        </div>
      )}
      {meldung && <div role="status" style={{ fontSize: 12.5, marginTop: 8, color: "var(--mp-accent-dark-text)" }}>{meldung}</div>}
    </Card>
  );
}
