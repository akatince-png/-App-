import React, { useEffect, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../ui/primitives";
import Timer from "../ui/Timer";
import NumberWheelField from "../ui/NumberWheelField";
import TimeWheelField from "../ui/TimeWheelField";
import AutocompleteInput from "../ui/AutocompleteInput";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../ui/theme";
import {
  TRAININGSARTEN,
  TRAINING_ENERGIELEVEL_OPTIONEN,
  SCHMERZEN_OPTIONEN,
  WOCHENTAGE,
  KRAFTUEBUNGEN,
  CARDIO_ARTEN,
  CARDIO_MODI_STRECKE,
  CARDIO_MODI_SPRUNGSEIL,
} from "../constants";
import { trainingDetail } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";

const WOCHENTAGE_VOLL = { Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag", Fr: "Freitag", Sa: "Samstag", So: "Sonntag" };

const LEERE_UEBUNG = { name: "", saetze: "", wiederholungen: "", gewicht: "", pauseSekunden: "180" };

function leererEintrag() {
  return {
    datum: new Date().toISOString().slice(0, 10),
    uhrzeit: "08:00",
    art: "",
    name: "",
    dauerMin: "",
    uebungen: [{ ...LEERE_UEBUNG }],
    distanzKm: "",
    puls: "",
    runden: "5",
    cardioArt: "",
    cardioModus: "",
    rpe: "",
    kalorien: "",
    energielevel: "",
    schmerzen: "",
    bemerkungen: "",
    intervallArbeitSek: "40",
    intervallPauseSek: "20",
  };
}

function zusammenfassung(e) {
  const teile = [trainingDetail(e)].filter(Boolean);
  if (e.puls) teile.push(`Ø ${e.puls} bpm`);
  if (e.runden && e.art !== "Krafttraining") teile.push(`${e.runden} Runden`);
  if (e.rpe) teile.push(`RPE ${e.rpe}`);
  return teile.join(" · ") || "—";
}

// ---------------------------------------------------------------------------
// Nachbereitung: RPE/Kalorien/Energielevel/Schmerzen/Bemerkungen lassen sich
// erst NACH dem Training sinnvoll einschätzen — deshalb ein eigener, rein
// optionaler Schritt nach dem Speichern statt Pflichtfelder vorab.
// ---------------------------------------------------------------------------
function TrainingFeedbackPanel({ trainingId, onDone }) {
  const { trainingFeedbackSpeichern } = useAppData();
  const [rpe, setRpe] = useState("");
  const [kalorien, setKalorien] = useState("");
  const [energielevel, setEnergielevel] = useState("");
  const [schmerzen, setSchmerzen] = useState("");
  const [bemerkungen, setBemerkungen] = useState("");
  const [fehler, setFehler] = useState(null);
  const [speichertGerade, setSpeichertGerade] = useState(false);

  const speichern = async () => {
    setFehler(null);
    setSpeichertGerade(true);
    const result = await trainingFeedbackSpeichern(trainingId, { rpe, kalorien, energielevel, schmerzen, bemerkungen });
    setSpeichertGerade(false);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    onDone();
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, textAlign: "center" }}>Wie ist es gelaufen?</div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 12, textAlign: "center" }}>
        Optional — hilft dir, deinen Fortschritt nachzuvollziehen.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>RPE (1–10)</Label>
          <TextInput type="number" value={rpe} onChange={setRpe} placeholder="7" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Kalorien</Label>
          <TextInput type="number" value={kalorien} onChange={setKalorien} placeholder="300" />
        </div>
      </div>
      <Label>Energielevel</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {TRAINING_ENERGIELEVEL_OPTIONEN.map((o) => (
          <Pill key={o} label={o} selected={energielevel === o} onClick={() => setEnergielevel(o)} />
        ))}
      </div>
      <Label>Schmerzen</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {SCHMERZEN_OPTIONEN.map((o) => (
          <Pill key={o} label={o} selected={schmerzen === o} onClick={() => setSchmerzen(o)} />
        ))}
      </div>
      <Label>Bemerkungen</Label>
      <TextArea value={bemerkungen} onChange={setBemerkungen} placeholder="Wie hat es sich angefühlt?" />
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={speichern} disabled={speichertGerade}>
            Speichern
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onDone} variant="ghost">
            Überspringen
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Live-Workout: Satz-für-Satz-Begleiter für Kraft, Intervall-/Stoppuhr-Timer
// für Cardio/HIIT.
// ---------------------------------------------------------------------------
function LiveWorkout({ session, onFertig, onSchliessen }) {
  const [uebungIndex, setUebungIndex] = useState(0);
  const [satzAktuell, setSatzAktuell] = useState(1);
  const [phase, setPhase] = useState("uebung"); // 'uebung' | 'pause' | 'bestaetigen' (Kraft)
  const [fertig, setFertig] = useState(!!session.erledigt);
  // Nur direkt nach dem Beenden DIESER Live-Session soll die Nachbereitung
  // erscheinen — beim erneuten Öffnen einer bereits erledigten Session
  // (z. B. aus dem Verlauf) nicht wieder abfragen.
  const [justFinished, setJustFinished] = useState(false);
  const [feedbackErledigt, setFeedbackErledigt] = useState(false);
  // Tatsächlich durchgeführte Werte pro Übung — startet als Kopie des Plans,
  // wird aber pro Übung nach dem letzten Satz bestätigt/angepasst, damit das
  // Protokoll später zeigt, was wirklich gemacht wurde, nicht nur den Plan.
  const [tatsaechlich, setTatsaechlich] = useState(() => (session.uebungen || []).map((u) => ({ ...u })));
  const [entwurf, setEntwurf] = useState(null);

  const uebungen = session.uebungen || [];
  const aktuelleUebung = uebungen[uebungIndex];

  useEffect(() => {
    if (phase === "bestaetigen" && aktuelleUebung) {
      setEntwurf({ saetze: aktuelleUebung.saetze, wiederholungen: aktuelleUebung.wiederholungen, gewicht: aktuelleUebung.gewicht });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, uebungIndex]);

  const beenden = (felder = {}) => {
    onFertig(session.id, felder);
    setFertig(true);
    setJustFinished(true);
  };

  const satzFertig = () => {
    const gesamtSaetze = Number(aktuelleUebung?.saetze) || 1;
    if (satzAktuell >= gesamtSaetze) {
      setPhase("bestaetigen");
    } else {
      setPhase("pause");
    }
  };

  const pauseFertig = () => {
    setSatzAktuell((s) => s + 1);
    setPhase("uebung");
  };

  const uebungBestaetigen = () => {
    const naechste = tatsaechlich.map((u, i) => (i === uebungIndex ? { ...u, ...entwurf } : u));
    setTatsaechlich(naechste);
    if (uebungIndex + 1 < uebungen.length) {
      setUebungIndex((i) => i + 1);
      setSatzAktuell(1);
      setPhase("uebung");
    } else {
      beenden({ uebungen: naechste });
    }
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🏋️ {session.art}</div>
        <button
          onClick={onSchliessen}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zurück"
        >
          ⌂
        </button>
      </div>

      {fertig ? (
        justFinished && !feedbackErledigt ? (
          <TrainingFeedbackPanel trainingId={session.id} onDone={() => setFeedbackErledigt(true)} />
        ) : (
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Training abgeschlossen!</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>Stark gemacht — bis zum nächsten Mal.</div>
            <PrimaryButton onClick={onSchliessen}>Zurück zum Training</PrimaryButton>
          </Card>
        )
      ) : session.art === "Krafttraining" ? (
        <>
          {!aktuelleUebung ? (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: textMuted }}>Keine Übungen hinterlegt.</div>
            </Card>
          ) : (
            <>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 8, textAlign: "center" }}>
                Übung {uebungIndex + 1} von {uebungen.length}
              </div>
              <Card style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{aktuelleUebung.name}</div>
                <div style={{ fontSize: 13, color: textMuted, marginBottom: 14 }}>
                  {aktuelleUebung.wiederholungen && `${aktuelleUebung.wiederholungen} Wdh.`}
                  {aktuelleUebung.gewicht && ` · ${aktuelleUebung.gewicht}`}
                </div>

                {phase === "uebung" ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 800, color: accentDark, marginBottom: 14 }}>
                      Satz {satzAktuell} von {Number(aktuelleUebung.saetze) || 1}
                    </div>
                    <PrimaryButton onClick={satzFertig}>Satz fertig</PrimaryButton>
                  </>
                ) : phase === "pause" ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>Pause</div>
                    <Timer
                      mode="countdown"
                      initialSeconds={Number(aktuelleUebung.pauseSekunden) || 180}
                      autoStart
                      onFertig={pauseFertig}
                    />
                    <div style={{ marginTop: 10 }}>
                      <PrimaryButton onClick={pauseFertig} variant="ghost">
                        Pause überspringen
                      </PrimaryButton>
                    </div>
                  </>
                ) : (
                  entwurf && (
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
                        Tatsächlich durchgeführt:
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Label>Sätze</Label>
                          <TextInput type="number" value={entwurf.saetze} onChange={(v) => setEntwurf((p) => ({ ...p, saetze: v }))} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Label>Wdh.</Label>
                          <TextInput
                            type="number"
                            value={entwurf.wiederholungen}
                            onChange={(v) => setEntwurf((p) => ({ ...p, wiederholungen: v }))}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Label>Gewicht</Label>
                          <TextInput value={entwurf.gewicht} onChange={(v) => setEntwurf((p) => ({ ...p, gewicht: v }))} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <PrimaryButton onClick={uebungBestaetigen}>
                          {uebungIndex + 1 < uebungen.length ? "Stimmt, weiter" : "Stimmt, Training beenden"}
                        </PrimaryButton>
                      </div>
                    </div>
                  )
                )}
              </Card>
            </>
          )}
        </>
      ) : session.art === "HIIT / Bodyweight" ? (
        <Card style={{ textAlign: "center" }}>
          <Timer
            mode="interval"
            arbeitSek={Number(session.intervallArbeitSek) || 40}
            pauseSek={Number(session.intervallPauseSek) || 20}
            runden={Number(session.runden) || 5}
            onFertig={() => beenden()}
          />
        </Card>
      ) : session.art === "Cardio" && session.intervallArbeitSek ? (
        <Card style={{ textAlign: "center" }}>
          <Timer
            mode="interval"
            arbeitSek={Number(session.intervallArbeitSek) || 40}
            pauseSek={Number(session.intervallPauseSek) || 20}
            runden={Number(session.runden) || 5}
            onFertig={() => beenden()}
          />
        </Card>
      ) : (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>Stoppuhr</div>
          <Timer mode="stopwatch" onFertig={(sek) => beenden({ dauerMin: Math.round(sek / 60) })} />
        </Card>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Wochenplan: welche Trainingsart (optional mit Vorlage) an welchem Wochentag
// ansteht — erscheint danach automatisch im Tagesplan, ohne dass etwas
// vorab manuell für jeden Tag angelegt werden muss.
// ---------------------------------------------------------------------------
function WochenplanEditor({ trainingWochenplan, trainingTemplates, wochenplanSetzen, wochenplanEntfernen }) {
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Wochenplan</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Leg fest, was an welchem Tag ansteht — erscheint danach automatisch in deinem Tagesplan.
        </div>
        {WOCHENTAGE.map((tag) => {
          const zuweisung = trainingWochenplan.find((w) => w.wochentag === tag);
          const passendeVorlagen = trainingTemplates.filter((t) => t.art === zuweisung?.art);
          return (
            <div key={tag} style={{ padding: "10px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{WOCHENTAGE_VOLL[tag]}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <Pill label="Ruhetag" selected={!zuweisung} onClick={() => wochenplanEntfernen(tag)} />
                {TRAININGSARTEN.map((a) => (
                  <Pill
                    key={a}
                    label={a}
                    selected={zuweisung?.art === a}
                    onClick={() => wochenplanSetzen(tag, { art: a, templateId: null, uhrzeit: zuweisung?.uhrzeit || "08:00" })}
                  />
                ))}
              </div>
              {zuweisung && passendeVorlagen.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
                  {passendeVorlagen.map((t) => (
                    <Pill
                      key={t.id}
                      label={`📋 ${t.name}`}
                      selected={zuweisung.templateId === t.id}
                      onClick={() =>
                        wochenplanSetzen(tag, {
                          art: zuweisung.art,
                          templateId: zuweisung.templateId === t.id ? null : t.id,
                          uhrzeit: zuweisung.uhrzeit,
                        })
                      }
                    />
                  ))}
                </div>
              )}
              {zuweisung && (
                <div style={{ marginTop: 8, maxWidth: 160 }}>
                  <TextInput
                    type="time"
                    value={zuweisung.uhrzeit || "08:00"}
                    onChange={(v) => wochenplanSetzen(tag, { art: zuweisung.art, templateId: zuweisung.templateId, uhrzeit: v })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Formular zum Planen/Eintragen + Verlauf + Kurz-Timer.
// ---------------------------------------------------------------------------
export default function TrainingView({ onHome, initialSessionId, onConsumedInitialSession, embedded = false }) {
  const {
    trainingEintraege,
    trainingHinzufuegen,
    trainingEntfernen,
    trainingAbschliessen,
    trainingTemplates,
    templateSpeichern,
    trainingWochenplan,
    wochenplanSetzen,
    wochenplanEntfernen,
    aenderungVermerken,
  } = useAppData();
  const [eintrag, setEintrag] = useState(leererEintrag());
  const [wochenplanOffen, setWochenplanOffen] = useState(false);
  const [vorlageSpeichernOffen, setVorlageSpeichernOffen] = useState(false);
  const [vorlageName, setVorlageName] = useState("");
  const [vorlageFehler, setVorlageFehler] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [liveSessionId, setLiveSessionId] = useState(null);
  const [kurzTimer, setKurzTimer] = useState(null); // 'stoppuhr' | 'pause' | 'intervall' | null
  const [feedbackFuerId, setFeedbackFuerId] = useState(null);

  useEffect(() => {
    if (initialSessionId) {
      setLiveSessionId(initialSessionId);
      onConsumedInitialSession?.();
    }
  }, [initialSessionId, onConsumedInitialSession]);

  const liveSession = trainingEintraege.find((e) => e.id === liveSessionId);
  if (liveSession) {
    return (
      <LiveWorkout
        session={liveSession}
        onFertig={(id, felder) => trainingAbschliessen(id, felder)}
        onSchliessen={() => setLiveSessionId(null)}
      />
    );
  }

  const setFeld = (feld, wert) => setEintrag((p) => ({ ...p, [feld]: wert }));

  const uebungAendern = (index, feld, wert) => {
    setEintrag((p) => ({
      ...p,
      uebungen: p.uebungen.map((u, i) => (i === index ? { ...u, [feld]: wert } : u)),
    }));
  };
  const uebungHinzufuegen = () => setEintrag((p) => ({ ...p, uebungen: [...p.uebungen, { ...LEERE_UEBUNG }] }));
  const uebungEntfernen = (index) => setEintrag((p) => ({ ...p, uebungen: p.uebungen.filter((_, i) => i !== index) }));

  const bauePayload = (erledigt) => {
    const payload = { ...eintrag, erledigt };
    if (payload.art === "Krafttraining") {
      payload.uebungen = payload.uebungen.filter((u) => u.name.trim());
    } else {
      payload.uebungen = [];
    }
    if (payload.art !== "Cardio" && payload.art !== "HIIT / Bodyweight") {
      payload.intervallArbeitSek = "";
      payload.intervallPauseSek = "";
    }
    if (payload.art !== "Cardio") {
      payload.cardioArt = "";
      payload.cardioModus = "";
    }
    return payload;
  };

  const submit = async (erledigt) => {
    setFehler(null);
    const payload = bauePayload(erledigt);
    const result = await trainingHinzufuegen(payload);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    aenderungVermerken({
      kategorie: "training",
      itemName: payload.name ? `${payload.art} · ${payload.name}` : payload.art,
      aktion: "hinzugefügt",
      detail: payload.uhrzeit ? `Uhrzeit: ${payload.uhrzeit}` : "",
    });
    setEintrag(leererEintrag());
    if (!erledigt && result.eintrag) setLiveSessionId(result.eintrag.id);
    else if (erledigt && result.eintrag) setFeedbackFuerId(result.eintrag.id);
  };

  const handleWochenplanSetzen = (tag, zuweisung) => {
    const vorher = trainingWochenplan.find((w) => w.wochentag === tag);
    let detail;
    if (!vorher) detail = `Art: ${zuweisung.art}`;
    else if (vorher.art !== zuweisung.art) detail = `Art: ${vorher.art} → ${zuweisung.art}`;
    else if (vorher.uhrzeit !== zuweisung.uhrzeit) detail = `Uhrzeit: ${vorher.uhrzeit || "–"} → ${zuweisung.uhrzeit || "–"}`;
    else detail = "Vorlage geändert";
    aenderungVermerken({ kategorie: "training", itemName: WOCHENTAGE_VOLL[tag], aktion: "geändert", detail });
    wochenplanSetzen(tag, zuweisung);
  };

  const handleWochenplanEntfernen = (tag) => {
    const vorher = trainingWochenplan.find((w) => w.wochentag === tag);
    if (vorher) {
      aenderungVermerken({ kategorie: "training", itemName: WOCHENTAGE_VOLL[tag], aktion: "entfernt", detail: `Art: ${vorher.art}` });
    }
    wochenplanEntfernen(tag);
  };

  const handleTrainingEntfernen = (e) => {
    aenderungVermerken({
      kategorie: "training",
      itemName: e.name ? `${e.art} · ${e.name}` : e.art,
      aktion: "entfernt",
      detail: e.datum,
    });
    trainingEntfernen(e.id);
  };

  const vorlageLaden = (tpl) => {
    setEintrag((p) => ({
      ...p,
      art: tpl.art,
      name: tpl.name,
      uhrzeit: tpl.uhrzeit || p.uhrzeit,
      uebungen: tpl.uebungen.length ? tpl.uebungen.map((u) => ({ ...u, pauseSekunden: String(u.pauseSekunden || 180) })) : [{ ...LEERE_UEBUNG }],
      dauerMin: tpl.dauerMin ? String(tpl.dauerMin) : "",
      distanzKm: tpl.distanzKm ? String(tpl.distanzKm) : "",
      puls: tpl.puls ? String(tpl.puls) : "",
      runden: tpl.runden ? String(tpl.runden) : p.runden,
      cardioArt: tpl.cardioArt || "",
      cardioModus: tpl.cardioModus || "",
      intervallArbeitSek: tpl.intervallArbeitSek ? String(tpl.intervallArbeitSek) : p.intervallArbeitSek,
      intervallPauseSek: tpl.intervallPauseSek ? String(tpl.intervallPauseSek) : p.intervallPauseSek,
    }));
  };

  const vorlageSpeichern = async () => {
    setVorlageFehler(null);
    const payload = bauePayload(true);
    const result = await templateSpeichern({ ...payload, name: vorlageName });
    if (!result?.ok) {
      setVorlageFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    setVorlageName("");
    setVorlageSpeichernOffen(false);
  };

  const vorlagenFuerArt = trainingTemplates.filter((t) => t.art === eintrag.art);

  const content = (
    <>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>🏋️ Training</div>
          <button
            onClick={onHome}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Zum Dashboard"
          >
            ⌂
          </button>
        </div>
      )}

      {feedbackFuerId && <TrainingFeedbackPanel trainingId={feedbackFuerId} onDone={() => setFeedbackFuerId(null)} />}

      <div style={{ marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setWochenplanOffen((o) => !o)}>
          {wochenplanOffen ? "Wochenplan schließen" : "📅 Wochenplan bearbeiten"}
        </PrimaryButton>
      </div>

      {wochenplanOffen && (
        <WochenplanEditor
          trainingWochenplan={trainingWochenplan}
          trainingTemplates={trainingTemplates}
          wochenplanSetzen={handleWochenplanSetzen}
          wochenplanEntfernen={handleWochenplanEntfernen}
        />
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Nur ein Timer? (ohne Eintrag)</div>
      <Card style={{ marginBottom: 14 }}>
        {!kurzTimer ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label="⏱ Stoppuhr" onClick={() => setKurzTimer("stoppuhr")} />
            <Pill label="⏳ Pausentimer" onClick={() => setKurzTimer("pause")} />
            <Pill label="🔁 Intervalltimer" onClick={() => setKurzTimer("intervall")} />
          </div>
        ) : (
          <>
            {kurzTimer === "stoppuhr" && <Timer mode="stopwatch" onFertig={() => setKurzTimer(null)} />}
            {kurzTimer === "pause" && <Timer mode="countdown" initialSeconds={180} onFertig={() => {}} />}
            {kurzTimer === "intervall" && <Timer mode="interval" arbeitSek={40} pauseSek={20} runden={8} onFertig={() => {}} />}
            <div style={{ marginTop: 10 }}>
              <PrimaryButton variant="ghost" onClick={() => setKurzTimer(null)}>
                Schließen
              </PrimaryButton>
            </div>
          </>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Training eintragen</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label>Datum</Label>
            <TextInput type="date" value={eintrag.datum} onChange={(v) => setFeld("datum", v)} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Uhrzeit</Label>
            <TimeWheelField value={eintrag.uhrzeit} onChange={(v) => setFeld("uhrzeit", v)} />
          </div>
        </div>

        <Label>Art</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TRAININGSARTEN.map((a) => (
            <Pill key={a} label={a} selected={eintrag.art === a} onClick={() => setFeld("art", a)} />
          ))}
        </div>

        {eintrag.art && vorlagenFuerArt.length > 0 && (
          <>
            <Label>Vorlage laden (optional)</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {vorlagenFuerArt.map((t) => (
                <Pill key={t.id} label={`📋 ${t.name}`} onClick={() => vorlageLaden(t)} />
              ))}
            </div>
          </>
        )}

        {eintrag.art && (
          <>
            <Label>Name (optional)</Label>
            <TextInput value={eintrag.name} onChange={(v) => setFeld("name", v)} placeholder="z. B. Push Day, 5km Lauf" />
          </>
        )}

        {eintrag.art === "Krafttraining" && (
          <>
            <Label>Übungen</Label>
            {eintrag.uebungen.map((u, i) => (
              <div key={i} style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <AutocompleteInput value={u.name} onChange={(v) => uebungAendern(i, "name", v)} options={KRAFTUEBUNGEN} placeholder="Übung, z. B. Bankdrücken" />
                  </div>
                  {eintrag.uebungen.length > 1 && (
                    <button
                      onClick={() => uebungEntfernen(i)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <NumberWheelField value={u.saetze} onChange={(v) => uebungAendern(i, "saetze", v)} min={1} max={20} placeholder="Sätze" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NumberWheelField value={u.wiederholungen} onChange={(v) => uebungAendern(i, "wiederholungen", v)} min={1} max={50} placeholder="Wdh." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput value={u.gewicht} onChange={(v) => uebungAendern(i, "gewicht", v)} placeholder="Gewicht" />
                  </div>
                </div>
                <Label>Pause zwischen Sätzen (Sek.)</Label>
                <NumberWheelField value={u.pauseSekunden} onChange={(v) => uebungAendern(i, "pauseSekunden", v)} min={0} max={600} step={15} placeholder="180" />
              </div>
            ))}
            <button
              onClick={uebungHinzufuegen}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                border: `1px dashed ${cardBorder}`,
                background: "transparent",
                color: accentDark,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 6,
              }}
            >
              + weitere Übung
            </button>
          </>
        )}

        {eintrag.art === "Cardio" && (
          <>
            <Label>Welches Cardio?</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {CARDIO_ARTEN.map((a) => (
                <Pill
                  key={a}
                  label={a}
                  selected={eintrag.cardioArt === a}
                  onClick={() => setEintrag((p) => ({ ...p, cardioArt: a, cardioModus: "" }))}
                />
              ))}
            </div>

            {eintrag.cardioArt && (
              <>
                <Label>Modus</Label>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {(eintrag.cardioArt === "Springseilspringen" ? CARDIO_MODI_SPRUNGSEIL : CARDIO_MODI_STRECKE).map((m) => (
                    <Pill key={m} label={m} selected={eintrag.cardioModus === m} onClick={() => setFeld("cardioModus", m)} />
                  ))}
                </div>
              </>
            )}

            {(eintrag.cardioModus === "Strecke" || eintrag.cardioModus === "Dauer") && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Label>Dauer (min)</Label>
                  <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="30" />
                </div>
                {eintrag.cardioModus === "Strecke" && (
                  <div style={{ flex: 1 }}>
                    <Label>Distanz (km)</Label>
                    <TextInput type="number" value={eintrag.distanzKm} onChange={(v) => setFeld("distanzKm", v)} placeholder="5" />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Label>Ø Puls</Label>
                  <TextInput type="number" value={eintrag.puls} onChange={(v) => setFeld("puls", v)} placeholder="140" />
                </div>
              </div>
            )}

            {(eintrag.cardioModus === "Intervall" || eintrag.cardioModus === "Sprints") && (
              <>
                <Label>{eintrag.cardioModus === "Sprints" ? "Sprints" : "Intervall"}</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <TextInput type="number" value={eintrag.intervallArbeitSek} onChange={(v) => setFeld("intervallArbeitSek", v)} placeholder="Arbeit (Sek.)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput type="number" value={eintrag.intervallPauseSek} onChange={(v) => setFeld("intervallPauseSek", v)} placeholder="Pause (Sek.)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NumberWheelField value={eintrag.runden} onChange={(v) => setFeld("runden", v)} min={1} max={30} placeholder="Runden" />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>Leer lassen = beim Live-Start läuft stattdessen eine einfache Stoppuhr.</div>
              </>
            )}
          </>
        )}

        {eintrag.art === "HIIT / Bodyweight" && (
          <>
            <Label>Intervall</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallArbeitSek} onChange={(v) => setFeld("intervallArbeitSek", v)} placeholder="Arbeit (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallPauseSek} onChange={(v) => setFeld("intervallPauseSek", v)} placeholder="Pause (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <NumberWheelField value={eintrag.runden} onChange={(v) => setFeld("runden", v)} min={1} max={30} placeholder="Runden" />
              </div>
            </div>
          </>
        )}

        {eintrag.art === "Sonstiges" && (
          <>
            <Label>Dauer (min)</Label>
            <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="30" />
          </>
        )}

        {eintrag.art && (
          <>
            {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <PrimaryButton onClick={() => submit(false)}>Jetzt live starten</PrimaryButton>
              </div>
              <div style={{ flex: 1 }}>
                <PrimaryButton onClick={() => submit(true)} variant="ghost">
                  Nur eintragen
                </PrimaryButton>
              </div>
            </div>

            {!vorlageSpeichernOffen ? (
              <button
                onClick={() => setVorlageSpeichernOffen(true)}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "9px",
                  borderRadius: 10,
                  border: `1px dashed ${cardBorder}`,
                  background: "transparent",
                  color: textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📋 Als Vorlage speichern (zum Wiederverwenden)
              </button>
            ) : (
              <div style={{ marginTop: 10 }}>
                <Label>Name der Vorlage</Label>
                <TextInput value={vorlageName} onChange={setVorlageName} placeholder="z. B. Brusttraining" />
                {vorlageFehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{vorlageFehler}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <PrimaryButton onClick={vorlageSpeichern} disabled={!vorlageName.trim()}>
                      Speichern
                    </PrimaryButton>
                  </div>
                  <div style={{ flex: 1 }}>
                    <PrimaryButton variant="ghost" onClick={() => setVorlageSpeichernOffen(false)}>
                      Abbrechen
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {trainingEintraege.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
          <Card>
            {trainingEintraege.map((e, i) => (
              <div
                key={e.id}
                className="mp-tap"
                onClick={() => !e.erledigt && setLiveSessionId(e.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "10px 0",
                  borderBottom: i < trainingEintraege.length - 1 ? `1px solid ${cardBorder}` : "none",
                  cursor: e.erledigt ? "default" : "pointer",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>
                    {e.art}
                    {e.name && <span style={{ fontWeight: 500 }}> · {e.name}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>
                    {e.datum}
                    {e.uhrzeit && ` · ${e.uhrzeit}`} · {zusammenfassung(e)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {e.erledigt ? <StatusBadge status="erledigt" /> : <StatusBadge status="geplant" />}
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleTrainingEntfernen(e);
                    }}
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
