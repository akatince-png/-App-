import React, { useEffect, useMemo, useRef, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import Timer from "../ui/Timer";
import NumberWheelField from "../ui/NumberWheelField";
import TimeWheelField from "../ui/TimeWheelField";
import UebungenEditor, { LEERE_UEBUNG } from "../ui/UebungenEditor";
import WochenplanEditor, { WOCHENTAGE_VOLL } from "../ui/WochenplanEditor";
import TrainingsplaeneVerwaltung from "../ui/TrainingsplaeneVerwaltung";
import SpotifyAnlassPicker from "../ui/SpotifyAnlassPicker";
import MusikModusToggle from "../ui/MusikModusToggle";
import { cardBorder, danger, textMain, textMuted } from "../ui/theme";
import TrainingVorschau from "../ui/TrainingVorschau";
import LiveWorkout from "../ui/LiveWorkout";
import TrainingFeedbackPanel from "../ui/TrainingFeedbackPanel";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import { getIntervallMusikEinstellung, saveIntervallMusikEinstellung, INTERVALL_FADE_SEK } from "../utils/intervallMusikStorage";
import { useIntervallMusikSync } from "../data/useIntervallMusikSync";
import KiChat from "../ui/KiChat";
import {
  TRAININGSARTEN,
  KRAFTUEBUNGEN,
  BODYWEIGHT_UEBUNGEN,
  CARDIO_ARTEN,
  CARDIO_MODI_STRECKE,
  CARDIO_MODI_SPRUNGSEIL,
} from "../constants";
import { KATEGORIE_META, buildDayItems } from "../utils/dayItems";
import { toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe (siehe
// KATEGORIE_META in dayItems.js) — Training ist Rot, passend zu den bunten
// Home-Mini-Widgets.
const { text: accentDark, bg: accentSoft } = KATEGORIE_META.training;

function leererEintrag() {
  return {
    datum: toLocalISODate(new Date()),
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
    bodyweightModus: "",
    rpe: "",
    kalorien: "",
    energielevel: "",
    schmerzen: "",
    bemerkungen: "",
    intervallArbeitSek: "40",
    intervallPauseSek: "20",
    // Nur für Isometrisches Training: Gesamtdauer als Eingabehilfe, um daraus
    // die Rundenzahl zu errechnen (15.08., Nutzerin-Vorgabe) — wird nicht
    // mitgespeichert, nur für die Berechnung im Formular verwendet.
    isoGesamtDauerMin: "",
    // Welche Vorlage dieser Eintrag geladen hat (15.08., Nutzerin-Vorgabe) —
    // für die vorlagen-eigene Spotify-Playlist beim Live-Start, siehe
    // TrainingsplaeneVerwaltung.jsx.
    templateId: null,
  };
}

// Kompakte Verlauf-Zeile (14.08., Nutzerin-Vorgabe): getrackte Dauer statt
// der vollen Übungsliste als Fließtext — Details gibt's stattdessen per Tap
// über dieselbe TrainingVorschau-Tabelle wie auf Home/Tagesplan.
function verlaufKompakt(e) {
  const teile = [];
  if (e.dauerMin) teile.push(`${e.dauerMin} Min.`);
  if (e.puls) teile.push(`Ø ${e.puls} bpm`);
  if (e.rpe) teile.push(`RPE ${e.rpe}`);
  return teile.join(" · ") || "—";
}

// ---------------------------------------------------------------------------
// Formular zum Planen/Eintragen + Verlauf + Kurz-Timer.
// ---------------------------------------------------------------------------
export default function TrainingView({ onHome, initialSessionId, onConsumedInitialSession, embedded = false }) {
  const {
    trainingEintraege,
    trainingNachDatum,
    trainingHinzufuegen,
    trainingEntfernen,
    trainingAbschliessen,
    trainingTemplates,
    templateSpeichern,
    templateBearbeiten,
    templateEntfernen,
    trainingProgramme,
    programmHinzufuegen,
    programmEntfernen,
    trainingWochenplan,
    wochenplanHinzufuegen,
    wochenplanBearbeiten,
    wochenplanEntfernen,
    wochenplanErinnerungUmschalten,
    wochenplanErinnerungenAlleSetzen,
    erinnerungen,
    setErinnerung,
    aenderungVermerken,
    spotifyAnlaesse,
    spotifyAbspielen,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
    belohnungPufferMin,
  } = useAppData();
  const [eintrag, setEintrag] = useState(leererEintrag());
  // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): bei Training zählt für
  // "rechtzeitig" der Moment des Live-Starts gegen die geplante Uhrzeit,
  // nicht das Ende — einmal rechtzeitig gestartet, ist die tatsächliche
  // Trainingsdauer irrelevant. Nur "Jetzt live starten" ist ein echter
  // Start-Moment, "Nur eintragen" protokolliert nur nachträglich, ohne
  // Belohnung. Als Map (session-id -> boolean) statt einzelnem Ref, weil
  // theoretisch mehrere Sessions nacheinander gestartet werden können.
  const rechtzeitigGestartetRef = useRef({});
  // Ansehen (reine Tabelle) und Erstellen (Formular + KI-Chat) getrennt
  // statt eines gemeinsamen "Wochenplan bearbeiten"-Umschalters (14.08.,
  // Nutzerin-Vorgabe): vorher verdeckte das Erstell-Formular immer zuerst
  // den eigentlich wichtigeren Überblick über den bestehenden Wochenplan.
  const [wochenplanAnsehenOffen, setWochenplanAnsehenOffen] = useState(false);
  const [trainingsplanErstellenOffen, setTrainingsplanErstellenOffen] = useState(false);
  // Einzeltraining (14.08., Nutzerin-Vorgabe): abgesetzt von "Trainingsplan
  // erstellen" (das ist der WIEDERKEHRENDE Wochenplan) — hier geht's um ein
  // EINMALIGES Training für ein bestimmtes Datum, das auch alle Trainingsarten
  // inkl. Cardio/Bodyweight-Intervall mit ihren Spezialfeldern abdeckt (Distanz,
  // Puls, Intervalle) und sich auch nachträglich als "schon erledigt" eintragen
  // lässt — beides kann der Wochenplan-Formular nicht. Bisher stand das
  // Formular immer offen und wirkte dadurch wie eine verwirrende Dopplung.
  const [einzeltrainingOffen, setEinzeltrainingOffen] = useState(false);
  const [verlaufVorschau, setVerlaufVorschau] = useState(null);
  const [wochenplanVorschau, setWochenplanVorschau] = useState(null);
  const [vorlageSpeichernOffen, setVorlageSpeichernOffen] = useState(false);
  const [vorlageName, setVorlageName] = useState("");
  const [vorlageFehler, setVorlageFehler] = useState(null);
  const [trainingsplaeneVerwaltungOffen, setTrainingsplaeneVerwaltungOffen] = useState(false);
  const [fehler, setFehler] = useState(null);
  // Bug-Fix (13.09.): ohne Sperre erzeugte ein schneller Doppel-Tap auf
  // "Jetzt live starten"/"Nur eintragen" zwei parallele
  // trainingHinzufuegen()-Aufrufe, bevor das Formular zurückgesetzt war —
  // der erste, nie geöffnete Eintrag blieb als unsichtbarer "Geister-
  // Eintrag" zurück und hielt (siehe HomeView.jsx) die Trainings-Kachel
  // dauerhaft aktiv.
  const [speichertGerade, setSpeichertGerade] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState(null);
  const [kurzTimer, setKurzTimer] = useState(null); // 'stoppuhr' | 'pause' | 'intervall' | null
  const [feedbackFuerId, setFeedbackFuerId] = useState(null);
  const [kurzTimerMusikFehler, setKurzTimerMusikFehler] = useState(null);
  // Musik-Sync für den Kurz-Intervalltimer (14.08., Nutzerin-Vorgabe: Musik
  // an Intervallgrenzen leiser/lauter werden lassen, wie beim Workflow-
  // Timer) — Modus wird geräteweit gemerkt (intervallMusikStorage.js).
  const [intervallModus, setIntervallModus] = useState(() => getIntervallMusikEinstellung("training").modus);
  const intervallMusikSync = useIntervallMusikSync({
    modus: intervallModus,
    fadeSek: INTERVALL_FADE_SEK,
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
    onErsterStart: () => {
      const uri = spotifyAnlaesse.training?.uri;
      if (uri) {
        spotifyAbspielen(uri).then((result) => {
          if (!result?.ok) setKurzTimerMusikFehler(result?.error || "Wiedergabe fehlgeschlagen.");
        });
      }
    },
  });


  useEffect(() => {
    if (initialSessionId) {
      setLiveSessionId(initialSessionId);
      onConsumedInitialSession?.();
    }
  }, [initialSessionId, onConsumedInitialSession]);

  // Heute-Checkliste (17.09., Konsistenz-Check): Medikamente/Supplemente/
  // Ernährung/Gewohnheiten/Routine zeigen alle "das steht heute laut Plan
  // an, bitte bestätigen" direkt auf ihrer eigenen Seite — Training bisher
  // nicht, nur Verlauf (schon erledigt) oder der Umweg über Tagesplan/Home.
  // Gleiche Ableitung wie in TagesplanView.jsx (buildDayItems, kategorie
  // "training"), nur auf "heute" statt ein wählbares Datum beschränkt. Vor
  // dem frühen `if (liveSession) return` unten, da Hooks nicht bedingt
  // aufgerufen werden dürfen (Rules of Hooks).
  const heutigeTrainingsItems = useMemo(
    () => buildDayItems(new Date(), { trainingEintraege, trainingNachDatum, trainingWochenplan }).filter((i) => i.kategorie === "training"),
    [trainingEintraege, trainingNachDatum, trainingWochenplan]
  );

  const liveSession = trainingEintraege.find((e) => e.id === liveSessionId);
  if (liveSession) {
    return (
      <LiveWorkout
        session={liveSession}
        onFertig={(id, felder) => {
          trainingAbschliessen(id, felder);
          if (rechtzeitigGestartetRef.current[id]) {
            feuereBelohnung({ text: "Training abgeschlossen", icon: "dumbbell", punkte: 1 });
          }
          delete rechtzeitigGestartetRef.current[id];
        }}
        onSchliessen={() => setLiveSessionId(null)}
      />
    );
  }

  // Gegenstück zu starteTraining() in TagesplanView.jsx — hier ohne
  // Navigation, da schon auf der Trainings-Seite: ein virtueller (nur aus
  // dem Wochenplan abgeleiteter) Punkt wird erst zu einer echten Zeile,
  // bevor das Live-Workout dafür öffnet.
  const starteHeutigesTraining = async (item) => {
    if (!item.raw.virtuell) {
      setLiveSessionId(item.raw.id);
      return;
    }
    setFehler(null);
    const arten = item.raw.arten || [];
    const art = arten.find((a) => a === "Krafttraining") || arten.find((a) => a === "Bodyweight") || arten[0] || "";
    const warmupCooldown = [
      item.raw.warmup?.aktiv ? `Warm-up${item.raw.warmup.dauerMin ? ` ${item.raw.warmup.dauerMin} Min.` : ""}` : "",
      item.raw.cooldown?.aktiv ? `Cool-down${item.raw.cooldown.dauerMin ? ` ${item.raw.cooldown.dauerMin} Min.` : ""}` : "",
    ].filter(Boolean);
    const result = await trainingHinzufuegen({
      datum: item.raw.datum,
      uhrzeit: item.raw.uhrzeit || "",
      art,
      name: item.raw.name || "",
      uebungen: item.raw.uebungenListe || [],
      bemerkungen: warmupCooldown.join(" · "),
      erledigt: false,
      intervallArbeitSek: item.raw.intervallArbeitSek || "",
      intervallPauseSek: item.raw.intervallPauseSek || "",
      runden: item.raw.runden || "",
    });
    if (result?.ok) {
      rechtzeitigGestartetRef.current[result.eintrag.id] = istRechtzeitig(item.raw.uhrzeit, belohnungPufferMin);
      setLiveSessionId(result.eintrag.id);
      return;
    }
    setFehler(result?.error || "Training konnte nicht gestartet werden.");
  };

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
    const bodyweightMitUebungen = payload.art === "Bodyweight" && payload.bodyweightModus === "Übungen";
    const bodyweightMitIntervall = payload.art === "Bodyweight" && payload.bodyweightModus === "Intervall";
    if (payload.art === "Krafttraining" || bodyweightMitUebungen) {
      payload.uebungen = payload.uebungen.filter((u) => u.name.trim());
    } else {
      payload.uebungen = [];
    }
    if (payload.art !== "Cardio" && payload.art !== "Isometrisches Training" && !bodyweightMitIntervall) {
      payload.intervallArbeitSek = "";
      payload.intervallPauseSek = "";
    }
    if (payload.art !== "Cardio") {
      payload.cardioArt = "";
      payload.cardioModus = "";
    }
    if (payload.art !== "Bodyweight") {
      payload.bodyweightModus = "";
    }
    return payload;
  };

  const submit = async (erledigt) => {
    if (speichertGerade) return;
    setSpeichertGerade(true);
    setFehler(null);
    try {
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
      if (!erledigt && result.eintrag) {
        rechtzeitigGestartetRef.current[result.eintrag.id] = istRechtzeitig(payload.uhrzeit, belohnungPufferMin);
        setLiveSessionId(result.eintrag.id);
      } else if (erledigt && result.eintrag) setFeedbackFuerId(result.eintrag.id);
    } finally {
      setSpeichertGerade(false);
    }
  };

  const handleWochenplanHinzufuegen = async (einheit) => {
    const detail = [einheit.uhrzeit, einheit.arten.join(" + ")].filter(Boolean).join(" · ");
    aenderungVermerken({ kategorie: "training", itemName: WOCHENTAGE_VOLL[einheit.wochentag], aktion: "hinzugefügt", detail });
    return wochenplanHinzufuegen(einheit);
  };

  const handleWochenplanBearbeiten = async (id, einheit) => {
    const detail = [einheit.uhrzeit, einheit.arten.join(" + ")].filter(Boolean).join(" · ");
    aenderungVermerken({ kategorie: "training", itemName: WOCHENTAGE_VOLL[einheit.wochentag], aktion: "geändert", detail });
    return wochenplanBearbeiten(id, einheit);
  };

  const handleWochenplanEntfernen = (id) => {
    const vorher = trainingWochenplan.find((w) => w.id === id);
    if (vorher) {
      const detail = [vorher.uhrzeit, vorher.arten.join(" + ")].filter(Boolean).join(" · ");
      aenderungVermerken({ kategorie: "training", itemName: WOCHENTAGE_VOLL[vorher.wochentag], aktion: "entfernt", detail });
    }
    wochenplanEntfernen(id);
  };

  // Übergabe an <KiChat onUebernehmen>: nimmt den kompletten Gesprächsstand,
  // lässt die KI daraus den finalen Plan als JSON zusammenfassen und trägt
  // jede Einheit über denselben Weg ein wie eine manuell im
  // WochenplanEditor hinzugefügte Einheit.
  const handleTrainingsplanUebernehmen = async (verlauf) => {
    const einheiten = await AIService.trainingsplanAusChat({ verlauf, coachName: getCoachName() });
    // Nacheinander statt Promise.all, damit die Änderungsprotokoll-Einträge
    // (aenderungVermerken in handleWochenplanHinzufuegen) in derselben
    // Reihenfolge wie die KI-Antwort entstehen.
    for (const einheit of einheiten) {
      const result = await handleWochenplanHinzufuegen(einheit);
      if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    }
    return einheiten;
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
      bodyweightModus: tpl.art === "Bodyweight" ? (tpl.uebungen.length ? "Übungen" : "Intervall") : "",
      intervallArbeitSek: tpl.intervallArbeitSek ? String(tpl.intervallArbeitSek) : p.intervallArbeitSek,
      intervallPauseSek: tpl.intervallPauseSek ? String(tpl.intervallPauseSek) : p.intervallPauseSek,
      templateId: tpl.id,
    }));
  };

  // Direkt aus der Vorlagen-Verwaltung heraus live starten (15.08.,
  // Nutzerin-Vorgabe), ohne den Umweg über "laden ins Formular → Jetzt live
  // starten tippen" — baut den Payload direkt aus der Vorlage statt aus dem
  // (evtl. gerade anders befüllten) Formular-State.
  const templateDirektStarten = async (tpl) => {
    // Bug-Fix (13.09., Teil 60): dieselbe Doppeltipp-Lücke wie beim
    // Haupt-Formular-Submit oben (submit()) — gleiche speichertGerade-Sperre.
    if (speichertGerade) return;
    setSpeichertGerade(true);
    setFehler(null);
    try {
      await templateDirektStartenInner(tpl);
    } finally {
      setSpeichertGerade(false);
    }
  };

  const templateDirektStartenInner = async (tpl) => {
    const result = await trainingHinzufuegen({
      datum: toLocalISODate(new Date()),
      uhrzeit: tpl.uhrzeit || "",
      art: tpl.art,
      name: tpl.name,
      uebungen: tpl.uebungen?.length ? tpl.uebungen.map((u) => ({ ...u, pauseSekunden: String(u.pauseSekunden || 180) })) : [],
      dauerMin: tpl.dauerMin ? String(tpl.dauerMin) : "",
      distanzKm: tpl.distanzKm ? String(tpl.distanzKm) : "",
      puls: tpl.puls ? String(tpl.puls) : "",
      runden: tpl.runden ? String(tpl.runden) : "5",
      cardioArt: tpl.cardioArt || "",
      cardioModus: tpl.cardioModus || "",
      intervallArbeitSek: tpl.intervallArbeitSek ? String(tpl.intervallArbeitSek) : "",
      intervallPauseSek: tpl.intervallPauseSek ? String(tpl.intervallPauseSek) : "",
      templateId: tpl.id,
      erledigt: false,
    });
    if (!result?.ok) {
      setFehler(result?.error || "Training konnte nicht gestartet werden.");
      return;
    }
    setTrainingsplaeneVerwaltungOffen(false);
    rechtzeitigGestartetRef.current[result.eintrag.id] = istRechtzeitig(tpl.uhrzeit, belohnungPufferMin);
    setLiveSessionId(result.eintrag.id);
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
        <ViewHeader title="🏋️ Training" onHome={onHome} />
      )}

      {feedbackFuerId && <TrainingFeedbackPanel trainingId={feedbackFuerId} onDone={() => setFeedbackFuerId(null)} />}

      {heutigeTrainingsItems.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Heute</div>
          <Card style={{ marginBottom: 14 }}>
            {heutigeTrainingsItems.map((item, i) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < heutigeTrainingsItems.length - 1 ? `1px solid ${cardBorder}` : "none",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {item.uhrzeit ? `${item.uhrzeit} · ` : ""}
                    {item.name}
                  </div>
                  {item.detail && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                </div>
                {item.done ? (
                  <StatusBadge status="erledigt" />
                ) : (
                  <button
                    type="button"
                    onClick={() => starteHeutigesTraining(item)}
                    style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 10, border: "none", background: accentDark, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Training starten
                  </button>
                )}
              </div>
            ))}
          </Card>
        </>
      )}

      <Card style={{ marginBottom: 14 }}>
        <SpotifyAnlassPicker anlass="training" label="🎵 Playlist fürs Training" />
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={() => setWochenplanAnsehenOffen((o) => !o)}>
            {wochenplanAnsehenOffen ? "Wochenplan schließen" : "🗓️ Wochenplan ansehen"}
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={() => setTrainingsplanErstellenOffen((o) => !o)}>
            {trainingsplanErstellenOffen ? "Schließen" : "➕ Trainingsplan erstellen"}
          </PrimaryButton>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setTrainingsplaeneVerwaltungOffen((o) => !o)}>
          {trainingsplaeneVerwaltungOffen ? "Schließen" : "📋 Trainingspläne verwalten (Vorlagen & Ordner)"}
        </PrimaryButton>
      </div>

      {trainingsplaeneVerwaltungOffen && (
        <>
          {fehler && <div style={{ fontSize: 12, color: danger, marginBottom: 12 }}>{fehler}</div>}
          <TrainingsplaeneVerwaltung
            trainingTemplates={trainingTemplates}
            trainingProgramme={trainingProgramme}
            programmHinzufuegen={programmHinzufuegen}
            programmEntfernen={programmEntfernen}
            templateBearbeiten={templateBearbeiten}
            templateEntfernen={templateEntfernen}
            onDirektStarten={templateDirektStarten}
            onSchliessen={() => setTrainingsplaeneVerwaltungOffen(false)}
          />
        </>
      )}

      {wochenplanAnsehenOffen && (
        <>
          {fehler && <div style={{ fontSize: 12, color: danger, marginBottom: 12 }}>{fehler}</div>}
          <WochenplanEditor
            trainingWochenplan={trainingWochenplan}
            wochenplanHinzufuegen={handleWochenplanHinzufuegen}
            wochenplanBearbeiten={handleWochenplanBearbeiten}
            wochenplanEntfernen={handleWochenplanEntfernen}
            wochenplanErinnerungUmschalten={wochenplanErinnerungUmschalten}
            wochenplanErinnerungenAlleSetzen={wochenplanErinnerungenAlleSetzen}
            erinnerungenTrainingAktiv={!!erinnerungen.training}
            onErinnerungenTrainingUmschalten={async (v) => {
              setFehler(null);
              const result = await setErinnerung("training", v);
              if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
            }}
            trainingsVorlaufMinuten={erinnerungen.training && typeof erinnerungen.training === "object" ? erinnerungen.training.vorlaufMinuten : undefined}
            onTrainingsVorlaufAendern={async (minuten) => {
              const bestehend = erinnerungen.training && typeof erinnerungen.training === "object" ? erinnerungen.training : {};
              setFehler(null);
              const result = await setErinnerung("training", { ...bestehend, aktiv: true, vorlaufMinuten: minuten });
              if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
            }}
            titel={null}
            zeigeFormular={false}
            onZeileAntippen={setWochenplanVorschau}
          />
        </>
      )}

      {wochenplanVorschau && (
        <TrainingVorschau
          art={wochenplanVorschau.arten?.length ? wochenplanVorschau.arten.join(" + ") : "Training"}
          tag={WOCHENTAGE_VOLL[wochenplanVorschau.tag]}
          uhrzeit={wochenplanVorschau.uhrzeit}
          uebungen={wochenplanVorschau.uebungenListe}
          warmup={wochenplanVorschau.warmup}
          cooldown={wochenplanVorschau.cooldown}
          onSchliessen={() => setWochenplanVorschau(null)}
        />
      )}

      {trainingsplanErstellenOffen && (
        <>
          <WochenplanEditor
            trainingWochenplan={trainingWochenplan}
            wochenplanHinzufuegen={handleWochenplanHinzufuegen}
            wochenplanBearbeiten={handleWochenplanBearbeiten}
            wochenplanEntfernen={handleWochenplanEntfernen}
            titel={null}
            zeigeListe={false}
          />

          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10, marginTop: 14 }}>
            Erzähl frei, was du trainieren willst, frag nach, lass Vorschläge anpassen — dein Assistent merkt sich das Gespräch. Wenn ihr euch einig seid, auf „Plan übernehmen" tippen.
          </div>
          <KiChat
            bereich="training"
            systemPrompt="Du bist ein erfahrener, geduldiger Trainingscoach für eine bestehende App. Hilf der Person, einen zu ihr passenden Trainingsplan zu entwickeln — frag nach, wenn wichtige Angaben fehlen (z. B. Erfahrung, verfügbare Tage, Ziele), mach konkrete Vorschläge, geh auf Wünsche und Korrekturen ein. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
            einleitung={`Hi, ich bin ${getCoachName()}! Erzähl mir, wie dein Training aussehen soll — z. B. Erfahrungslevel, wie viele Tage pro Woche du Zeit hast, und worauf du Lust hast (Kraft, Cardio, Bodyweight, ...).`}
            onUebernehmen={handleTrainingsplanUebernehmen}
            uebernehmenLabel="Plan übernehmen"
            renderErgebnis={(einheiten) => (
              <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                {einheiten.length} Einheit{einheiten.length === 1 ? "" : "en"} in den Wochenplan übernommen:
                {einheiten.map((e, i) => (
                  <div key={i}>
                    · {e.wochentag}: {e.name ? `${e.name} · ` : ""}
                    {(e.arten || []).join(" + ")}
                    {e.uebungenListe?.length ? ` (${e.uebungenListe.map((u) => u.name).join(", ")})` : ""}
                  </div>
                ))}
              </div>
            )}
          />
        </>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Nur ein Timer? (ohne Eintrag)</div>
      {kurzTimerMusikFehler && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#FBEAE7", color: danger, borderRadius: 12, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
          <span>🎵 Playlist konnte nicht gestartet werden: {kurzTimerMusikFehler}</span>
          <button
            type="button"
            onClick={() => setKurzTimerMusikFehler(null)}
            style={{ border: "none", background: "transparent", color: danger, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}
      <Card style={{ marginBottom: 14 }}>
        {!kurzTimer ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { id: "stoppuhr", icon: "⏱️", label: "Stoppuhr" },
              { id: "pause", icon: "⏳", label: "Pausentimer" },
              { id: "intervall", icon: "🔁", label: "Intervalltimer" },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                className="mp-tap"
                onClick={() => setKurzTimer(o.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "16px 6px",
                  borderRadius: 14,
                  border: `1px solid ${cardBorder}`,
                  background: "#FAFBFA",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 30, lineHeight: 1 }}>{o.icon}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: textMain }}>{o.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {kurzTimer === "stoppuhr" && <Timer mode="stopwatch" onFertig={() => setKurzTimer(null)} />}
            {kurzTimer === "pause" && <Timer mode="countdown" initialSeconds={180} onFertig={() => {}} />}
            {kurzTimer === "intervall" && (
              <>
                <Timer
                  mode="interval"
                  arbeitSek={40}
                  pauseSek={20}
                  runden={8}
                  fadeVorlaufSek={INTERVALL_FADE_SEK}
                  onPhaseStart={intervallMusikSync.onPhaseStart}
                  onPhaseEndeNaht={intervallMusikSync.onPhaseEndeNaht}
                  onReset={intervallMusikSync.reset}
                  onFertig={() => {}}
                />
                <MusikModusToggle
                  modus={intervallModus}
                  onChange={(v) => {
                    setIntervallModus(v);
                    saveIntervallMusikEinstellung("training", { modus: v });
                  }}
                />
              </>
            )}
            <div style={{ marginTop: 10 }}>
              <PrimaryButton
                variant="ghost"
                onClick={() => {
                  intervallMusikSync.reset();
                  spotifyPausieren();
                  setKurzTimer(null);
                }}
              >
                Schließen
              </PrimaryButton>
            </div>
          </>
        )}
      </Card>

      <div style={{ marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setEinzeltrainingOffen((o) => !o)}>
          {einzeltrainingOffen ? "Schließen" : "▶️ Einzeltraining eintragen"}
        </PrimaryButton>
      </div>

      {einzeltrainingOffen && (
      <>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Für ein einmaliges Training an einem bestimmten Tag — anders als der Wochenplan wiederholt sich das nicht. Auch zum nachträglichen Eintragen, was du schon gemacht hast.
      </div>
      <Card akzent style={{ marginBottom: 14 }}>
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
          <UebungenEditor
            uebungen={eintrag.uebungen}
            optionen={KRAFTUEBUNGEN}
            gewichtPlatzhalter="Gewicht"
            onAendern={uebungAendern}
            onEntfernen={uebungEntfernen}
            onHinzufuegen={uebungHinzufuegen}
            akzent={accentDark}
          />
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

        {eintrag.art === "Bodyweight" && (
          <>
            <Label>Wie trackst du das?</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <Pill label="Übungen eintragen" selected={eintrag.bodyweightModus === "Übungen"} onClick={() => setFeld("bodyweightModus", "Übungen")} />
              <Pill label="Intervall-Timer" selected={eintrag.bodyweightModus === "Intervall"} onClick={() => setFeld("bodyweightModus", "Intervall")} />
            </div>

            {eintrag.bodyweightModus === "Übungen" && (
              <UebungenEditor
                uebungen={eintrag.uebungen}
                optionen={BODYWEIGHT_UEBUNGEN}
                gewichtPlatzhalter="Zusatzgewicht (optional)"
                onAendern={uebungAendern}
                onEntfernen={uebungEntfernen}
                onHinzufuegen={uebungHinzufuegen}
                akzent={accentDark}
              />
            )}

            {eintrag.bodyweightModus === "Intervall" && (
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
          </>
        )}

        {eintrag.art === "Isometrisches Training" && (
          <>
            <Label>Halten & Pause</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallArbeitSek} onChange={(v) => setFeld("intervallArbeitSek", v)} placeholder="Halten (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.intervallPauseSek} onChange={(v) => setFeld("intervallPauseSek", v)} placeholder="Pause (Sek.)" />
              </div>
              <div style={{ flex: 1 }}>
                <NumberWheelField value={eintrag.runden} onChange={(v) => setFeld("runden", v)} min={1} max={30} placeholder="Sätze" />
              </div>
            </div>

            <Label>Statt Sätze: Gesamtdauer eingeben (optional)</Label>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <TextInput type="number" value={eintrag.isoGesamtDauerMin} onChange={(v) => setFeld("isoGesamtDauerMin", v)} placeholder="z. B. 5 (Minuten)" />
              </div>
              <div style={{ flex: 1 }}>
                <PrimaryButton
                  variant="ghost"
                  onClick={() => {
                    const satzSek = Number(eintrag.intervallArbeitSek) || 0;
                    const pauseSek = Number(eintrag.intervallPauseSek) || 0;
                    const gesamtSek = (Number(eintrag.isoGesamtDauerMin) || 0) * 60;
                    if (satzSek + pauseSek <= 0 || gesamtSek <= 0) return;
                    const errechneteRunden = Math.max(1, Math.round(gesamtSek / (satzSek + pauseSek)));
                    setFeld("runden", String(errechneteRunden));
                  }}
                >
                  Sätze berechnen
                </PrimaryButton>
              </div>
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
              Nach dem Start läuft erst eine 15-Sekunden-Vorbereitungsphase zum Positionieren, bevor der erste Satz beginnt.
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
                <PrimaryButton onClick={() => submit(false)} disabled={speichertGerade}>
                  Jetzt live starten
                </PrimaryButton>
              </div>
              <div style={{ flex: 1 }}>
                <PrimaryButton onClick={() => submit(true)} variant="ghost" disabled={speichertGerade}>
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
      </>
      )}

      {(() => {
        const erledigteEintraege = trainingEintraege.filter((e) => e.erledigt);
        return (
          erledigteEintraege.length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
              <Card>
                {erledigteEintraege.map((e, i) => (
                  <div
                    key={e.id}
                    className="mp-tap"
                    onClick={() => setVerlaufVorschau(e)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "10px 0",
                      borderBottom: i < erledigteEintraege.length - 1 ? `1px solid ${cardBorder}` : "none",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>
                        {e.art}
                        {e.name && <span style={{ fontWeight: 500 }}> · {e.name}</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>
                        {e.datum}
                        {e.uhrzeit && ` · ${e.uhrzeit}`} · {verlaufKompakt(e)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <StatusBadge status="erledigt" />
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
          )
        );
      })()}

      {verlaufVorschau && (
        <TrainingVorschau
          art={verlaufVorschau.art}
          name={verlaufVorschau.name}
          tag={verlaufVorschau.datum}
          uhrzeit={verlaufVorschau.uhrzeit}
          uebungen={verlaufVorschau.uebungen}
          onSchliessen={() => setVerlaufVorschau(null)}
        />
      )}
    </>
  );
  return embedded ? content : <Shell bereich="training">{content}</Shell>;
}
