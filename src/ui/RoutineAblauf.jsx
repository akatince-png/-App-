import React, { useEffect, useRef, useState } from "react";
import { useLiveNeuladenSperre } from "../data/liveAktualisierung";
import { Shell, Card, PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";
import { routineGeschafftFeier } from "../utils/routineFeier";
import { verspaetungHinweis } from "../utils/routineVerspaetung";
import TagebuchFormular from "./TagebuchFormular";
import { istTagebuchSchritt } from "../utils/tagebuch";
import { toLocalISODate } from "../utils/dates";
import { playBeep } from "../utils/beep";
import AtemFuehrung from "./AtemFuehrung";
import AufgeladenFenster from "./AufgeladenFenster";
import GuteNachtFenster from "./GuteNachtFenster";
import { atemFuerRoutineSchritt, bibliotheksUebung } from "../utils/atemBibliothek";
import { istMessPhase, istNachmessen, messTag } from "../utils/messwoche";

const ROUTINE_ANLASS = { morgen: "morgenroutine", abend: "abendroutine" };

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_EMOJI = { morgen: "🌅", abend: "🌙" };

function fmtDauer(sekunden) {
  const s = Math.max(0, Math.round(sekunden));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Geführter Ablauf-Screen (Phase 1, 13.08.): führt Schritt für Schritt durch
// die konfigurierten Routine-Schritte, mit Countdown + Vorwarnton kurz vor
// Ende je Schritt — gegen das ADHS-typische "sich in der Zeit verlieren".
// "Schritt fertig" geht jederzeit, auch vor Ablauf des Timers (z. B. wenn
// etwas schneller ging als geplant). Tatsächlich gebrauchte Zeit je Schritt
// wird mitgeschrieben und am Ende als ein Durchlauf gespeichert.
export default function RoutineAblauf({ routine, schritte, onAbschluss, onAbbrechen, routineDurchlaufSpeichern }) {
  useLiveNeuladenSperre(); // Coach-Änderungen erst nach der Routine neu laden
  const { spotifyVerbunden, spotifyAnlaesse, spotifyAbspielen, spotifyPausieren, routineEinstellungen, belohnungPufferMin, tagebuchEintraege, kernStand, atemuebungAbschliessen, aenderungVermerken } = useAppData();
  const heute = toLocalISODate(new Date());
  const tagebuchHeute = (tagebuchEintraege || []).find((e) => e.datum === heute);
  const [tagebuchNachher, setTagebuchNachher] = useState(false);
  // Messwoche (26.09.): Woche 1 des AKA-Coachings misst statt vorzugeben –
  // Stoppuhr je Schritt statt Countdown, Hauptuhr ab dem Aufwachen.
  const messmodus = istMessPhase(kernStand);
  const messName = istNachmessen(kernStand) ? "Nachmessen" : "Messwoche";
  const messTagNr = messTag(kernStand, heute);
  const weckzeit = routineEinstellungen?.[routine]?.startZeit || "";
  const weckMs = weckzeit ? new Date(`${heute}T${weckzeit}:00`).getTime() : null;
  // Frage "Seit wann wach?" nur morgens und nur bis 3 h nach der Weckzeit.
  const [wachGefragt, setWachGefragt] = useState(!(messmodus && routine === "morgen" && weckMs && Date.now() > weckMs && Date.now() - weckMs < 3 * 3600000));
  const [index, setIndex] = useState(0);
  const [fertig, setFertig] = useState(false);
  const [musikFehler, setMusikFehler] = useState(null);
  const protokollRef = useRef([]);
  const feierRef = useRef(null);
  const startZeitRef = useRef(Date.now());
  const gestartetUmRef = useRef(new Date().toISOString());
  // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): bei Routinen mit echtem
  // Start/Ende-Verlauf zählt für "rechtzeitig" der START, nicht das Ende —
  // einmal innerhalb des Puffers nach der geplanten Startzeit (Zeitrahmen
  // der Routine) begonnen, darf die Erledigung selbst beliebig lange
  // dauern. Einmalig beim Mounten geprüft, nicht bei jedem Schritt neu.
  const rechtzeitigGestartetRef = useRef(
    istRechtzeitig(routineEinstellungen?.[routine]?.startZeit, belohnungPufferMin, new Date(gestartetUmRef.current))
  );
  // Gesamtzeit der Routine (Nutzerin-Vorgabe 14.08., analog zum
  // Trainings-Gesamtzeit-Timer): läuft unabhängig von den einzelnen
  // Schritt-Countdowns durch, beginnt beim Start der Routine und endet erst
  // beim wirklichen Abschluss — damit sichtbar/auswertbar wird, ob die
  // ganze Routine zu lang oder zu kurz ist, nicht nur einzelne Schritte.
  const gesamtStartRef = useRef(Date.now());
  const [gesamtSek, setGesamtSek] = useState(0);
  useEffect(() => {
    if (fertig) return;
    const id = setInterval(() => setGesamtSek(Math.round((Date.now() - gesamtStartRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [fertig]);

  // Startet automatisch die zugeordnete Playlist (falls unter "Schritte
  // einrichten" → Playlist eine hinterlegt ist), einmalig beim Start dieses
  // Durchlaufs — nicht bei jedem Schrittwechsel.
  useEffect(() => {
    const uri = spotifyAnlaesse[ROUTINE_ANLASS[routine]]?.uri;
    if (uri && spotifyVerbunden) {
      spotifyAbspielen(uri).then((result) => {
        if (!result?.ok) setMusikFehler(result?.error || "Wiedergabe fehlgeschlagen.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aktuell = schritte[index];
  // Atem-Schritt (30.09., Nutzerin: „die Atemübung ploppt auf, aber es
  // findet keine geführte Übung statt“): hier direkt die fest hinterlegte
  // Übung mit Kreis + Stimme (ohne KI, ohne Video). Ist sie durch, geht
  // es automatisch zum nächsten Schritt.
  const atemInfo = atemFuerRoutineSchritt(aktuell, routine);
  const atemUebung = atemInfo ? { ...bibliotheksUebung(atemInfo.key), dauerMinuten: atemInfo.dauerMinuten } : null;

  // Schritt-Uhr (29.09., Nutzerin): jeder Schritt hat eine Soll-Zeit als
  // Rahmen – auch in der Messwoche. Sie läuft rückwärts; ist sie um, gibt es
  // Ton + Vibration und die Uhr zählt sichtbar weiter („+1:20 länger“),
  // statt automatisch weiterzuspringen. Gespeichert wird die echte Dauer,
  // damit kürzer/länger dokumentiert ist und nachjustiert werden kann.
  const sollSek = (Number(aktuell?.dauerMin) || 5) * 60;
  const schrittSek = Math.max(0, Math.round((Date.now() - startZeitRef.current) / 1000));
  const restSek = sollSek - schrittSek;
  const signalRef = useRef({ index: -1, vorwarnung: false, ende: false });
  useEffect(() => {
    if (fertig || !wachGefragt || !aktuell || istTagebuchSchritt(aktuell) || atemUebung) return;
    const sig = signalRef.current;
    if (sig.index !== index) signalRef.current = { index, vorwarnung: false, ende: false };
    const r = signalRef.current;
    if (!r.vorwarnung && sollSek > 60 && restSek <= 30 && restSek > 0) {
      r.vorwarnung = true;
      playBeep(1);
      navigator.vibrate?.(200);
    }
    if (!r.ende && restSek <= 0) {
      r.ende = true;
      playBeep(2);
      navigator.vibrate?.([300, 150, 300]);
    }
  });

  const weiter = () => {
    const tatsaechlichSek = Math.round((Date.now() - startZeitRef.current) / 1000);
    protokollRef.current = [...protokollRef.current, { schrittId: aktuell.id, name: aktuell.name, geplantMin: aktuell.dauerMin, tatsaechlichSek }];
    if (index + 1 < schritte.length) {
      setIndex((i) => i + 1);
      startZeitRef.current = Date.now();
    } else {
      // Musik lief seit dem Start automatisch mit — muss beim Abschluss
      // genauso automatisch aufhören, sonst läuft sie einfach unbemerkt
      // weiter (gleicher Bug wie beim Workflow-/Trainings-Timer).
      spotifyPausieren();
      routineDurchlaufSpeichern?.({ routine, schritte: protokollRef.current, gestartetUm: gestartetUmRef.current });
      // Immer feiern (25.09.), pünktlich oder später — siehe routineFeier.js.
      // „Aufgeladen“ (morgens) bzw. „Gute Nacht“ (abends) übernehmen seit
      // 06.10. die Feier selbst, sonst lägen zwei Fenster übereinander.
      const feier = routineGeschafftFeier(routine, rechtzeitigGestartetRef.current, verspaetungHinweis(routineEinstellungen?.[routine]?.startZeit, gestartetUmRef.current, belohnungPufferMin));
      if (routine === "morgen" || routine === "abend") feierRef.current = feier;
      else feuereBelohnung(feier);
      setFertig(true);
    }
  };

  const abbrechen = () => {
    spotifyPausieren();
    onAbbrechen();
  };

  if (!schritte.length) {
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
            Für die {ROUTINE_LABEL[routine]} sind noch keine Schritte eingerichtet.
          </div>
          <PrimaryButton onClick={abbrechen}>Zurück</PrimaryButton>
        </Card>
      </Shell>
    );
  }

  if (!wachGefragt && schritte.length) {
    const ab = (ms) => {
      gestartetUmRef.current = new Date(ms).toISOString();
      gesamtStartRef.current = ms;
      startZeitRef.current = Date.now();
      setWachGefragt(true);
    };
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>📏</div>
          <div style={{ fontSize: 17, fontWeight: 900, margin: "6px 0 4px" }}>{messName}{messTagNr ? ` · Tag ${messTagNr} von 7` : ""}</div>
          <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.5, marginBottom: 14 }}>Wir messen nur, wie lange deine Morgenroutine wirklich dauert – nichts muss schnell gehen. Ab wann soll die Hauptuhr laufen?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton onClick={() => ab(weckMs)}>⏰ Ab dem Wecker ({weckzeit})</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => ab(Date.now())}>
              Ab jetzt
            </PrimaryButton>
          </div>
        </Card>
      </Shell>
    );
  }

  if (fertig) {
    const protokoll = protokollRef.current;
    return (
      <Shell>
        {routine === "morgen" ? (
          <AufgeladenFenster gesamtZeit={fmtDauer(gesamtSek)} feier={feierRef.current} onWeiter={onAbschluss} />
        ) : (
          <GuteNachtFenster gesamtZeit={fmtDauer(gesamtSek)} feier={feierRef.current} onWeiter={onAbschluss} />
        )}
        {/* "Wie war dein Tag?" (25.09.): gehört an den Abend, nicht auf die
            Startseite – hier, falls die Abendroutine keinen Tagebuch-Schritt hat. */}
        {routine === "abend" && !schritte.some(istTagebuchSchritt) && (!tagebuchHeute || tagebuchNachher) && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📓 Wie war dein Tag?</div>
            {tagebuchNachher ? (
              <div role="status" style={{ fontSize: 13, fontWeight: 700, color: "var(--mp-accent-dark-text)" }}>✓ Festgehalten. Gute Nacht!</div>
            ) : (
              <TagebuchFormular datum={heute} kompakt onGespeichert={() => setTagebuchNachher(true)} />
            )}
          </Card>
        )}
        {protokoll.length > 0 && (
          <Card>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Auswertung — geplant vs. tatsächlich</div>
            {protokoll.map((p, i) => {
              const geplantSek = (Number(p.geplantMin) || 0) * 60;
              const abweichung = p.tatsaechlichSek - geplantSek;
              return (
                <div
                  key={i}
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: i > 0 ? `1px solid ${cardBorder}` : "none", fontSize: 12.5 }}
                >
                  <div>{p.name}</div>
                  <div style={{ color: Math.abs(abweichung) > 60 ? (abweichung > 0 ? danger : "var(--mp-accent-dark-text)") : textMuted, fontWeight: 700 }}>
                    {fmtDauer(p.tatsaechlichSek)} <span style={{ color: textMuted, fontWeight: 400 }}>(geplant {p.geplantMin} Min.)</span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 0.3 }}>GESAMTZEIT {ROUTINE_LABEL[routine].toUpperCase()}</div>
        <div style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtDauer(gesamtSek)}</div>
      </div>
      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginBottom: 8 }}>
        {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]} · Schritt {index + 1} von {schritte.length}
        {messmodus && ` · 📏 ${messName}${messTagNr ? ` Tag ${messTagNr}` : ""}`}
      </div>
      {musikFehler && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "color-mix(in srgb, #FBEAE7 var(--mp-flaeche), var(--mp-karte))", color: danger, borderRadius: 12, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
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
      {istTagebuchSchritt(aktuell) ? (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, textAlign: "center" }}>📓 Wie war dein Tag?</div>
          <TagebuchFormular key={aktuell.id} datum={heute} vorhanden={tagebuchHeute} kompakt onGespeichert={weiter} />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" onClick={weiter} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6 }}>
              Heute überspringen
            </button>
          </div>
        </Card>
      ) : atemUebung ? (
        <div data-routine-atem>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, textAlign: "center" }}>{aktuell.name}</div>
          <AtemFuehrung
            key={aktuell.id}
            uebung={atemUebung}
            onFertig={({ dauerSek, vorher, nachher }) => {
              if (dauerSek > 0) {
                atemuebungAbschliessen?.(atemUebung, dauerSek, { gefuehlVorher: vorher, gefuehlDanach: nachher, sessionId: null });
                aenderungVermerken?.({ kategorie: "atemuebung", itemName: atemUebung.name, aktion: "erledigt", detail: `${Math.round(dauerSek / 60) || 1} Min. · aus der ${ROUTINE_LABEL[routine]}` });
              }
              weiter();
            }}
          />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" onClick={weiter} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6 }}>
              Schon geatmet – weiter
            </button>
          </div>
        </Card>
        </div>
      ) : (
      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{aktuell.name}</div>
        <div aria-label="Uhr Schritt" data-schritt-uhr={restSek > 0 ? "laeuft" : "drueber"} style={{ fontSize: 44, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: restSek > 0 ? "inherit" : "color-mix(in srgb, #D9822B var(--mp-schrift), var(--mp-schrift-hell))" }}>
          {restSek > 0 ? fmtDauer(restSek) : `+${fmtDauer(-restSek)}`}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: textMuted }}>
            {restSek > 0 ? `noch · geplant ${aktuell.dauerMin || 5} Min.` : `länger als geplant (${aktuell.dauerMin || 5} Min.) – kein Problem, wird notiert`}
          </div>
          {messmodus && <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginTop: 2 }}>📏 wird gemessen – in deinem Tempo</div>}
        </div>
        <div style={{ marginTop: 14 }}>
          <PrimaryButton onClick={weiter} variant="success">
            Schritt fertig
          </PrimaryButton>
        </div>
      </Card>
      )}
      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={abbrechen}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer", padding: 8 }}
        >
          Routine abbrechen
        </button>
      </div>
    </Shell>
  );
}
