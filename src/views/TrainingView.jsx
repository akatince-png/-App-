import React, { useEffect, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../ui/primitives";
import Timer from "../ui/Timer";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { TRAININGSARTEN, TRAINING_ENERGIELEVEL_OPTIONEN, SCHMERZEN_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

const LEERE_UEBUNG = { name: "", saetze: "", wiederholungen: "", gewicht: "", pauseSekunden: "180" };

function leererEintrag() {
  return {
    datum: new Date().toISOString().slice(0, 10),
    art: "",
    name: "",
    dauerMin: "",
    uebungen: [{ ...LEERE_UEBUNG }],
    distanzKm: "",
    puls: "",
    runden: "5",
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
  const teile = [];
  if (e.art === "Krafttraining") {
    const anzahl = (e.uebungen || []).filter((u) => u.name).length;
    if (anzahl) teile.push(`${anzahl} Übung${anzahl === 1 ? "" : "en"}`);
  }
  if (e.dauerMin) teile.push(`${e.dauerMin} min`);
  if (e.distanzKm) teile.push(`${e.distanzKm} km`);
  if (e.puls) teile.push(`Ø ${e.puls} bpm`);
  if (e.runden && e.art !== "Krafttraining") teile.push(`${e.runden} Runden`);
  if (e.rpe) teile.push(`RPE ${e.rpe}`);
  return teile.join(" · ") || "—";
}

// ---------------------------------------------------------------------------
// Live-Workout: Satz-für-Satz-Begleiter für Kraft, Intervall-/Stoppuhr-Timer
// für Cardio/HIIT.
// ---------------------------------------------------------------------------
function LiveWorkout({ session, onFertig, onSchliessen }) {
  const [uebungIndex, setUebungIndex] = useState(0);
  const [satzAktuell, setSatzAktuell] = useState(1);
  const [phase, setPhase] = useState("uebung"); // 'uebung' | 'pause' (Kraft)
  const [fertig, setFertig] = useState(!!session.erledigt);

  const uebungen = session.uebungen || [];
  const aktuelleUebung = uebungen[uebungIndex];

  const beenden = (dauerMin) => {
    onFertig(session.id, dauerMin != null ? { dauerMin } : {});
    setFertig(true);
  };

  const satzFertig = () => {
    const gesamtSaetze = Number(aktuelleUebung?.saetze) || 1;
    if (satzAktuell >= gesamtSaetze) {
      if (uebungIndex + 1 < uebungen.length) {
        setUebungIndex((i) => i + 1);
        setSatzAktuell(1);
        setPhase("uebung");
      } else {
        beenden();
      }
    } else {
      setPhase("pause");
    }
  };

  const pauseFertig = () => {
    setSatzAktuell((s) => s + 1);
    setPhase("uebung");
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
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Training abgeschlossen!</div>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>Stark gemacht — bis zum nächsten Mal.</div>
          <PrimaryButton onClick={onSchliessen}>Zurück zum Training</PrimaryButton>
        </Card>
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
                ) : (
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
          <Timer mode="stopwatch" onFertig={(sek) => beenden(Math.round(sek / 60))} />
        </Card>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Formular zum Planen/Eintragen + Verlauf + Kurz-Timer.
// ---------------------------------------------------------------------------
export default function TrainingView({ onHome, initialSessionId, onConsumedInitialSession }) {
  const { trainingEintraege, trainingHinzufuegen, trainingEntfernen, trainingAbschliessen } = useAppData();
  const [eintrag, setEintrag] = useState(leererEintrag());
  const [fehler, setFehler] = useState(null);
  const [liveSessionId, setLiveSessionId] = useState(null);
  const [kurzTimer, setKurzTimer] = useState(null); // 'stoppuhr' | 'pause' | 'intervall' | null

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
    return payload;
  };

  const submit = async (erledigt) => {
    setFehler(null);
    const result = await trainingHinzufuegen(bauePayload(erledigt));
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setEintrag(leererEintrag());
    if (!erledigt && result.eintrag) setLiveSessionId(result.eintrag.id);
  };

  return (
    <Shell>
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
        <Label>Datum</Label>
        <TextInput type="date" value={eintrag.datum} onChange={(v) => setFeld("datum", v)} />

        <Label>Art</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TRAININGSARTEN.map((a) => (
            <Pill key={a} label={a} selected={eintrag.art === a} onClick={() => setFeld("art", a)} />
          ))}
        </div>

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
                    <TextInput value={u.name} onChange={(v) => uebungAendern(i, "name", v)} placeholder="Übung, z. B. Bankdrücken" />
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
                    <TextInput type="number" value={u.saetze} onChange={(v) => uebungAendern(i, "saetze", v)} placeholder="Sätze" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput type="number" value={u.wiederholungen} onChange={(v) => uebungAendern(i, "wiederholungen", v)} placeholder="Wdh." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput value={u.gewicht} onChange={(v) => uebungAendern(i, "gewicht", v)} placeholder="Gewicht" />
                  </div>
                </div>
                <Label>Pause zwischen Sätzen (Sek.)</Label>
                <TextInput type="number" value={u.pauseSekunden} onChange={(v) => uebungAendern(i, "pauseSekunden", v)} placeholder="180" />
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
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Label>Dauer (min)</Label>
                <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="30" />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Distanz (km)</Label>
                <TextInput type="number" value={eintrag.distanzKm} onChange={(v) => setFeld("distanzKm", v)} placeholder="5" />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Ø Puls</Label>
                <TextInput type="number" value={eintrag.puls} onChange={(v) => setFeld("puls", v)} placeholder="140" />
              </div>
            </div>
            <Label>Intervalle laufen? (optional — z. B. Sprints)</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallArbeitSek} onChange={(v) => setFeld("intervallArbeitSek", v)} placeholder="Arbeit (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallPauseSek} onChange={(v) => setFeld("intervallPauseSek", v)} placeholder="Pause (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.runden} onChange={(v) => setFeld("runden", v)} placeholder="Runden" />
              </div>
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>Leer lassen = beim Live-Start läuft stattdessen eine einfache Stoppuhr.</div>
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
                <TextInput type="number" value={eintrag.runden} onChange={(v) => setFeld("runden", v)} placeholder="Runden" />
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
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Label>RPE (1–10, optional)</Label>
                <TextInput type="number" value={eintrag.rpe} onChange={(v) => setFeld("rpe", v)} placeholder="7" />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Kalorien (optional)</Label>
                <TextInput type="number" value={eintrag.kalorien} onChange={(v) => setFeld("kalorien", v)} placeholder="300" />
              </div>
            </div>

            <Label>Energielevel</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {TRAINING_ENERGIELEVEL_OPTIONEN.map((o) => (
                <Pill key={o} label={o} selected={eintrag.energielevel === o} onClick={() => setFeld("energielevel", o)} />
              ))}
            </div>

            <Label>Schmerzen</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {SCHMERZEN_OPTIONEN.map((o) => (
                <Pill key={o} label={o} selected={eintrag.schmerzen === o} onClick={() => setFeld("schmerzen", o)} />
              ))}
            </div>

            <Label>Bemerkungen (optional)</Label>
            <TextArea value={eintrag.bemerkungen} onChange={(v) => setFeld("bemerkungen", v)} placeholder="Wie ist es gelaufen?" />

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
                    {e.datum} · {zusammenfassung(e)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {e.erledigt ? <StatusBadge status="erledigt" /> : <StatusBadge status="geplant" />}
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      trainingEntfernen(e.id);
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
    </Shell>
  );
}
