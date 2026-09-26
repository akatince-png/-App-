import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, Label, PrimaryButton, TextInput } from "./primitives";
import ViewHeader from "./ViewHeader";
import Timer from "./Timer";
import SatzFrage from "./SatzFrage";
import KameraZaehler from "./KameraZaehler";
import { kameraUebungFuer } from "../utils/wiederholungZaehler";
import { naechstesMalHinweis } from "../utils/trainingSaetze";
import NumberWheelField from "./NumberWheelField";
import TrainingVorschau from "./TrainingVorschau";
import TrainingFeedbackPanel from "./TrainingFeedbackPanel";
import { cardBorder, danger, textMuted } from "./theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";
import { useIntervallMusikSync } from "../data/useIntervallMusikSync";
import { getIntervallMusikEinstellung, INTERVALL_FADE_SEK } from "../utils/intervallMusikStorage";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe — siehe
// TrainingView.jsx.
const { text: accentDark } = KATEGORIE_META.training;

function fmtDauer(sekunden) {
  const s = Math.max(0, Math.round(sekunden));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Live-Workout: Satz-für-Satz-Begleiter für Kraft, Intervall-/Stoppuhr-Timer
// für Cardio/HIIT. Aus TrainingView.jsx herausgelöst (13.09., Teil 60 der
// App-weiten Durchsuchung, ">500 Zeilen"-Fund) — nach demselben Vorbild wie
// TrainingsplaeneVerwaltung.jsx, das bereits vorher aus derselben Datei
// ausgelagert wurde. Reine Verhaltens-neutrale Umstrukturierung.
// ---------------------------------------------------------------------------
export default function LiveWorkout({ session, onFertig, onSchliessen }) {
  const { spotifyVerbunden, spotifyAnlaesse, spotifyAbspielen, spotifyPausieren, spotifyFortsetzen, spotifyLautstaerke, uebungsBilder, trainingAbschliessen } = useAppData();
  const [musikFehler, setMusikFehler] = useState(null);
  // Startet automatisch die dem Training zugeordnete Playlist (Mehr → Musik
  // → Zuordnung, siehe SpotifyAnlassPicker), einmalig beim Öffnen dieser
  // Live-Session — nicht bei jedem Satz-/Übungswechsel. Stammt die Session
  // aus einer Vorlage mit eigener Playlist (siehe TrainingsplaeneVerwaltung.
  // jsx), hat die vorlagen-eigene Zuordnung Vorrang vor der generischen
  // "training"-Playlist (15.08., Nutzerin-Vorgabe).
  useEffect(() => {
    const uri = (session.templateId && spotifyAnlaesse[`training-vorlage:${session.templateId}`]?.uri) || spotifyAnlaesse.training?.uri;
    if (uri && spotifyVerbunden) {
      spotifyAbspielen(uri).then((result) => {
        if (!result?.ok) setMusikFehler(result?.error || "Wiedergabe fehlgeschlagen.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Fade/Pause an Intervallgrenzen bei Bodyweight-/Cardio-Intervalltraining
  // (14.08., Nutzerin-Vorgabe) — Modus wird über den Kurz-Intervalltimer in
  // TrainingView (MusikModusToggle) geräteweit eingestellt, hier nur gelesen.
  const intervallMusikSync = useIntervallMusikSync({
    modus: getIntervallMusikEinstellung("training").modus,
    fadeSek: INTERVALL_FADE_SEK,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
  });
  const [uebungIndex, setUebungIndex] = useState(0);
  const [satzAktuell, setSatzAktuell] = useState(1);
  const [phase, setPhase] = useState("uebung"); // 'uebung' | 'pause' | 'bestaetigen' (Kraft)
  const [fertig, setFertig] = useState(!!session.erledigt);
  const [vorschauOffen, setVorschauOffen] = useState(false);
  // Gesamt-Trainingszeit (Nutzerin-Vorgabe 14.08.): läuft unabhängig vom
  // Pausen-Timer zwischen Sätzen durch, beginnt beim Öffnen dieser
  // Live-Session (= "Training starten") und stoppt erst beim wirklichen
  // Trainingsende (beenden() unten) — nicht beim einzelnen Satz. Echte
  // Timestamps statt Zähl-Ticks, damit nichts wegdriftet (gleiches Prinzip
  // wie Timer.jsx).
  const startZeitRef = useRef(Date.now());
  const [gesamtSek, setGesamtSek] = useState(0);
  useEffect(() => {
    if (fertig) return;
    const id = setInterval(() => setGesamtSek(Math.round((Date.now() - startZeitRef.current) / 1000)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fertig]);
  // Nur direkt nach dem Beenden DIESER Live-Session soll die Nachbereitung
  // erscheinen — beim erneuten Öffnen einer bereits erledigten Session
  // (z. B. aus dem Verlauf) nicht wieder abfragen.
  const [justFinished, setJustFinished] = useState(false);
  const [feedbackErledigt, setFeedbackErledigt] = useState(false);
  // Intervall-Trainings (25.09.): direkt am Ende "Alle 5 Runden
  // durchgezogen?" — ein Tipp, gespeichert als runden_ist.
  const istIntervall =
    (session.art === "Bodyweight" && !(session.uebungen || []).length) || session.art === "Isometrisches Training" || (session.art === "Cardio" && !!session.intervallArbeitSek);
  const rundenSoll = istIntervall ? Number(session.runden) || 5 : null;
  const [rundenBeantwortet, setRundenBeantwortet] = useState(false);
  const rundenAntworten = (n) => {
    trainingAbschliessen?.(session.id, { rundenIst: n });
    setRundenBeantwortet(true);
  };
  // Tatsächlich durchgeführte Werte pro Übung — startet als Kopie des Plans,
  // wird aber pro Übung nach dem letzten Satz bestätigt/angepasst, damit das
  // Protokoll später zeigt, was wirklich gemacht wurde, nicht nur den Plan.
  const [tatsaechlich, setTatsaechlich] = useState(() => (session.uebungen || []).map((u) => ({ ...u })));
  const [entwurf, setEntwurf] = useState(null);
  // Frage nach jedem Satz (25.09.): Ergebnis je Übung und Satz, landet mit
  // in `uebungen` (saetzeIst) der Session. `satzOffen` = Satz, dessen
  // Frage gerade angezeigt wird (während die Pause schon läuft).
  const [satzErgebnisse, setSatzErgebnisse] = useState({});
  const [satzOffen, setSatzOffen] = useState(null);
  // Kamera-Zählung (26.09.): bleibt über die Sätze einer Übung an.
  const [kamera, setKamera] = useState(false);

  const uebungen = session.uebungen || [];
  const aktuelleUebung = uebungen[uebungIndex];

  useEffect(() => {
    if (phase === "bestaetigen" && aktuelleUebung) {
      setEntwurf({ saetze: aktuelleUebung.saetze, wiederholungen: aktuelleUebung.wiederholungen, gewicht: aktuelleUebung.gewicht });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, uebungIndex]);

  // Bug-Fix: Der Home-Knopf (⌂/"Zurück") rief bisher direkt onSchliessen()
  // auf und umging damit den Spotify-Stopp aus beenden() — verließ man ein
  // laufendes Live-Workout über Home statt über "Fertig", lief die Musik
  // unbemerkt weiter (derselbe Bug wie beim Workflow-Timer). beenden()
  // selbst eignet sich hier NICHT als direkter Ersatz für onHome, da es
  // zusätzlich das Training als abgeschlossen protokolliert (onFertig) —
  // das würde ein bewusst abgebrochenes Training fälschlich als erledigt
  // speichern. Deshalb ein eigener, schmaler Wrapper nur für den Musik-Stopp.
  const homeVerlassen = () => {
    spotifyPausieren();
    onSchliessen?.();
  };

  const beenden = (felder = {}) => {
    const dauerMin = felder.dauerMin ?? Math.max(1, Math.round(gesamtSek / 60));
    // Musik lief seit dem Live-Start automatisch mit (siehe oben) — beim
    // Beenden muss sie genauso automatisch wieder aufhören, sonst läuft sie
    // einfach unbemerkt weiter (Nutzerin-Vorgabe, gleicher Bug wie beim
    // Workflow-Timer).
    spotifyPausieren();
    onFertig(session.id, { ...felder, dauerMin });
    setFertig(true);
    setJustFinished(true);
  };

  const satzFertig = () => {
    const gesamtSaetze = Number(aktuelleUebung?.saetze) || 1;
    setSatzOffen(satzAktuell);
    // Letzter Satz: erst die Frage, dann "Tatsächlich durchgeführt".
    if (satzAktuell < gesamtSaetze) setPhase("pause");
    else setPhase("letzteFrage");
  };

  // Satz per Kamera gezählt: Ergebnis gilt als beantwortet (gezaehlt = true,
  // z. B. für Wettbewerbe), die Frage entfällt.
  const kameraSatzFertig = (anzahl) => {
    const gesamtSaetze = Number(aktuelleUebung?.saetze) || 1;
    const satz = satzAktuell;
    setSatzErgebnisse((prev) => {
      const liste = [...(prev[uebungIndex] || [])];
      liste[satz - 1] = { wdh: anzahl, schwere: null, gezaehlt: true };
      return { ...prev, [uebungIndex]: liste };
    });
    if (satz < gesamtSaetze) {
      setSatzOffen(satz);
      setPhase("pause");
    } else {
      setSatzOffen(null);
      setPhase("bestaetigen");
    }
  };

  const satzBeantwortet = (antwort) => {
    const satz = satzOffen;
    setSatzErgebnisse((prev) => {
      const liste = [...(prev[uebungIndex] || [])];
      liste[satz - 1] = antwort;
      return { ...prev, [uebungIndex]: liste };
    });
    if (phase === "letzteFrage") {
      setSatzOffen(null);
      setPhase("bestaetigen");
    }
  };

  const pauseFertig = () => {
    setSatzOffen(null);
    setSatzAktuell((s) => s + 1);
    setPhase("uebung");
  };

  const uebungBestaetigen = () => {
    const ergebnisse = satzErgebnisse[uebungIndex];
    const naechste = tatsaechlich.map((u, i) =>
      i === uebungIndex ? { ...u, ...entwurf, ...(ergebnisse?.length ? { saetzeIst: ergebnisse.map((e) => e?.wdh ?? null), satzSchwere: ergebnisse.map((e) => e?.schwere ?? null), satzGezaehlt: ergebnisse.map((e) => !!e?.gezaehlt) } : {}) } : u
    );
    setTatsaechlich(naechste);
    if (uebungIndex + 1 < uebungen.length) {
      setUebungIndex((i) => i + 1);
      setSatzAktuell(1);
      setKamera(false);
      setPhase("uebung");
    } else {
      beenden({ uebungen: naechste });
    }
  };

  return (
    <Shell bereich="training">
      <ViewHeader title={`🏋️ ${session.art}`} onHome={homeVerlassen} homeTitle="Zurück" />

      {musikFehler && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#FBEAE7", color: danger, borderRadius: 12, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
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

      {!fertig && (
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 0.3 }}>GESAMTZEIT TRAINING</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtDauer(gesamtSek)}</div>
        </div>
      )}

      {fertig ? (
        justFinished && rundenSoll && !rundenBeantwortet ? (
          <Card style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 10 }}>Alle {rundenSoll} Runden durchgezogen?</div>
            <PrimaryButton onClick={() => rundenAntworten(rundenSoll)}>✅ Ja, alle {rundenSoll}</PrimaryButton>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>NEIN – WIE VIELE?</div>
            <div role="group" aria-label="Geschaffte Runden" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {Array.from({ length: rundenSoll }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => rundenAntworten(n)}
                  style={{ border: "none", borderRadius: 99, padding: "8px 13px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: "#EEF4FF", color: "#2D6FD6" }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setRundenBeantwortet(true)} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6, marginTop: 8, fontFamily: "inherit" }}>
              Weiter ohne Angabe
            </button>
          </Card>
        ) : justFinished && !feedbackErledigt ? (
          <TrainingFeedbackPanel trainingId={session.id} onDone={() => setFeedbackErledigt(true)} />
        ) : (
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Training abgeschlossen!</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>Stark gemacht — bis zum nächsten Mal.</div>
            <PrimaryButton onClick={onSchliessen}>Zurück zum Training</PrimaryButton>
          </Card>
        )
      ) : session.art === "Krafttraining" || (session.art === "Bodyweight" && uebungen.length > 0) ? (
        <>
          {!aktuelleUebung ? (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: textMuted }}>Keine Übungen hinterlegt.</div>
            </Card>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: textMuted, textAlign: "center" }}>
                  Übung {uebungIndex + 1} von {uebungen.length}
                </div>
                <button
                  type="button"
                  onClick={() => setVorschauOffen(true)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: accentDark,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  📋 Alle Übungen
                </button>
              </div>
              <Card style={{ textAlign: "center", marginBottom: 14 }}>
                {uebungsBilder[aktuelleUebung.name] && (
                  <img
                    src={uebungsBilder[aktuelleUebung.name]}
                    alt={aktuelleUebung.name}
                    style={{ width: "100%", maxWidth: 280, borderRadius: 16, marginBottom: 14, border: `1px solid ${cardBorder}` }}
                  />
                )}
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
                    {kamera && kameraUebungFuer(aktuelleUebung.name) ? (
                      <KameraZaehler
                        key={`${uebungIndex}-${satzAktuell}`}
                        uebung={kameraUebungFuer(aktuelleUebung.name)}
                        ziel={Number(aktuelleUebung.wiederholungen) || null}
                        onFertig={kameraSatzFertig}
                        onAbbrechen={() => setKamera(false)}
                      />
                    ) : (
                      <>
                        <PrimaryButton onClick={satzFertig}>Satz fertig</PrimaryButton>
                        {kameraUebungFuer(aktuelleUebung.name) && (
                          <button type="button" onClick={() => setKamera(true)} style={{ marginTop: 10, border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
                            📷 Mit Kamera zählen
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : phase === "letzteFrage" ? (
                  <>
                    <SatzFrage key={`${uebungIndex}-${satzOffen}`} soll={aktuelleUebung.wiederholungen} satz={satzOffen} onAntwort={satzBeantwortet} />
                    {/* Die Frage ist ein Angebot, keine Pflicht – nie hier festhängen. */}
                    <button
                      type="button"
                      onClick={() => {
                        setSatzOffen(null);
                        setPhase("bestaetigen");
                      }}
                      style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6, fontFamily: "inherit" }}
                    >
                      Weiter ohne Angabe
                    </button>
                  </>
                ) : phase === "pause" ? (
                  <>
                    {satzOffen && (
                      <SatzFrage
                        key={`${uebungIndex}-${satzOffen}`}
                        soll={aktuelleUebung.wiederholungen}
                        satz={satzOffen}
                        antwort={satzErgebnisse[uebungIndex]?.[satzOffen - 1]}
                        onAntwort={satzBeantwortet}
                      />
                    )}
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
                      {naechstesMalHinweis(satzErgebnisse[uebungIndex], aktuelleUebung.wiederholungen) && (
                        <div style={{ fontSize: 12.5, background: "#E8F7F2", borderRadius: 12, padding: "8px 10px", marginBottom: 10 }}>
                          {(satzErgebnisse[uebungIndex] || []).map((e, i) => (e ? `Satz ${i + 1}: ${e.wdh}` : null)).filter(Boolean).join(" · ")}
                          <br />
                          {naechstesMalHinweis(satzErgebnisse[uebungIndex], aktuelleUebung.wiederholungen)}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
                        Tatsächlich durchgeführt:
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Label>Sätze</Label>
                          <NumberWheelField value={entwurf.saetze} onChange={(v) => setEntwurf((p) => ({ ...p, saetze: v }))} min={1} max={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Label>Wdh.</Label>
                          <NumberWheelField
                            value={entwurf.wiederholungen}
                            onChange={(v) => setEntwurf((p) => ({ ...p, wiederholungen: v }))}
                            min={1}
                            max={50}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Label>{session.art === "Bodyweight" ? "Zusatzgewicht" : "Gewicht"}</Label>
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
      ) : session.art === "Bodyweight" ? (
        <Card style={{ textAlign: "center" }}>
          <Timer
            mode="interval"
            arbeitSek={Number(session.intervallArbeitSek) || 40}
            pauseSek={Number(session.intervallPauseSek) || 20}
            runden={Number(session.runden) || 5}
            fadeVorlaufSek={INTERVALL_FADE_SEK}
            onPhaseStart={intervallMusikSync.onPhaseStart}
            onPhaseEndeNaht={intervallMusikSync.onPhaseEndeNaht}
            onReset={intervallMusikSync.reset}
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
            fadeVorlaufSek={INTERVALL_FADE_SEK}
            onPhaseStart={intervallMusikSync.onPhaseStart}
            onPhaseEndeNaht={intervallMusikSync.onPhaseEndeNaht}
            onReset={intervallMusikSync.reset}
            onFertig={() => beenden()}
          />
        </Card>
      ) : session.art === "Isometrisches Training" ? (
        <Card style={{ textAlign: "center" }}>
          <Timer
            mode="interval"
            arbeitSek={Number(session.intervallArbeitSek) || 5}
            pauseSek={Number(session.intervallPauseSek) || 10}
            runden={Number(session.runden) || 5}
            arbeitLabel="HALTEN"
            vorbereitungSek={15}
            fadeVorlaufSek={INTERVALL_FADE_SEK}
            tickJedeSekunde
            onPhaseStart={intervallMusikSync.onPhaseStart}
            onPhaseEndeNaht={intervallMusikSync.onPhaseEndeNaht}
            onReset={intervallMusikSync.reset}
            onFertig={() => beenden()}
          />
        </Card>
      ) : (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>Stoppuhr</div>
          <Timer mode="stopwatch" onFertig={(sek) => beenden({ dauerMin: Math.round(sek / 60) })} />
        </Card>
      )}

      {vorschauOffen && (
        <TrainingVorschau
          art={session.art}
          name={session.name}
          uhrzeit={session.uhrzeit}
          uebungen={uebungen}
          onSchliessen={() => setVorschauOffen(false)}
        />
      )}
    </Shell>
  );
}
