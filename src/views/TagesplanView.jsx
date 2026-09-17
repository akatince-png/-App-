import React, { useCallback, useMemo, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextArea } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import ProgressRing from "../ui/ProgressRing";
import { accent, accentDark, accentSoft, cardBorder, danger, hexZuRgba, textMuted, verdunkeln } from "../ui/theme";
import Icon from "../ui/Icon";
import {
  NEBENWIRKUNGEN_OPTIONEN,
  VERTRAEGLICHKEIT_OPTIONEN,
  WIRKUNG_OPTIONEN,
  WOCHENTAGE,
} from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { statusText } from "../utils/motivation";
import { buildDayItems, KATEGORIE_META as KATEGORIE } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import RoutineAblauf from "../ui/RoutineAblauf";
import RoutineSchritteEditor from "../ui/RoutineSchritteEditor";
import RoutineSchritteListe from "../ui/RoutineSchritteListe";
import TrainingVorschau from "../ui/TrainingVorschau";
import { QuestsKarte } from "../ui/QuestsKarte";
import DenkpauseNudge from "../ui/DenkpauseNudge";

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Sonstige Zeiten";
}

// Bug-Fix (13.09., Nutzerin-Vorgabe "Medikamente nicht mehr von Peptiden/
// Hormonen unterscheiden"): eine eigene "peptid"-Feedback-Kategorie
// (inkl. Stärke-Auswahl + Einstichstellen-Foto) existierte hier zwar
// noch im Code, war aber technisch tot — buildDayItems() vergibt seit
// Migration 0042 nur noch die Kategorie "hormon" (siehe deren
// Kommentar), nie "peptid". Komplett entfernt statt weiter mitgeschleppt.
const FEEDBACK_HEADER = {
  hormon: "Wie war die Einnahme?",
  supplement: "Wie war's?",
};

function FeedbackPanel({ kategorie, draftFeedback, setDraftFeedback, toggleDraftNebenwirkung, onSkip, onSave }) {
  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: accentSoft, border: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{FEEDBACK_HEADER[kategorie]}</div>

      {kategorie === "hormon" && (
        <>
          <Label>Verträglichkeit</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {VERTRAEGLICHKEIT_OPTIONEN.map((v) => (
              <Pill key={v} label={v} selected={draftFeedback.vertraeglichkeit === v} onClick={() => setDraftFeedback((p) => ({ ...p, vertraeglichkeit: v }))} />
            ))}
          </div>
        </>
      )}

      {(kategorie === "hormon" || kategorie === "supplement") && (
        <>
          <Label>Wirkung bemerkt?</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {WIRKUNG_OPTIONEN.map((w) => (
              <Pill key={w} label={w} selected={draftFeedback.wirkung === w} onClick={() => setDraftFeedback((p) => ({ ...p, wirkung: w }))} />
            ))}
          </div>
        </>
      )}

      <Label>Welche Nebenwirkungen hattest du?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {NEBENWIRKUNGEN_OPTIONEN.map((n) => (
          <Pill key={n} label={n} selected={draftFeedback.nebenwirkungen.includes(n)} onClick={() => toggleDraftNebenwirkung(n)} />
        ))}
      </div>

      <Label>Notizen (optional)</Label>
      <TextArea value={draftFeedback.notizen} onChange={(v) => setDraftFeedback((p) => ({ ...p, notizen: v }))} placeholder="Hier kannst du alles aufschreiben..." />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onSkip} variant="ghost">
            Überspringen
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onSave} variant="success">
            Speichern
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// Bug-Fix ("Zustände gehen beim View-Wechsel verloren"): `selectedDate`
// und `modus` (Tag/Woche) kommen jetzt als kontrollierte Props von
// AuthenticatedApp.jsx statt aus lokalem State — vorher startete diese
// View bei jedem Verlassen/Wiederbetreten (kompletter Remount, siehe
// AuthenticatedApp.jsx) wieder bei "heute"/"Tag", egal welches Datum
// zuletzt angeschaut wurde. Rest der Datei unverändert, da die Props
// dieselben Namen wie die vorherigen lokalen State-Variablen tragen.
export default function TagesplanView({ onHome, onOpenTraining, onEditItem, selectedDate, onSelectedDateChange: setSelectedDate, modus, onModusChange: setModus }) {
  const { handleBereitschaftPruefen, handleUniverselleUebernahme } = useUniversellerCoach();
  const {
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    saveHormonFeedback,
    skipHormonFeedback,
    supplemente,
    supplementErledigt,
    saveSupplementFeedback,
    skipSupplementFeedback,
    confirmAlleTageszeit,
    mahlzeiten,
    mahlzeitErledigt,
    toggleMahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingNachDatum,
    trainingWochenplan,
    trainingTemplates,
    trainingHinzufuegen,
    gewohnheiten,
    gewohnheitErledigt,
    toggleGewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    projekte,
    zeitbloecke,
    routineSchritte,
    routineSchrittHinzufuegen,
    routineSchrittEntfernen,
    routineSchrittVerschieben,
    routineDurchlaufSpeichern,
    quests,
    questFortschrittSpeichern,
    ausnahmenNachSchluessel,
  } = useAppData();

  // Geführter Ablauf-Screen (Phase 1, 13.08.): null = normale Tagesplan-
  // Ansicht, sonst "morgen"/"abend" — ersetzt dann den kompletten Screen,
  // bis die Routine abgeschlossen oder abgebrochen wird.
  const [ablaufRoutine, setAblaufRoutine] = useState(null);
  const [schritteBearbeiten, setSchritteBearbeiten] = useState({ morgen: false, abend: false });
  // Morgen-/Abendroutine: rein visuelle Gruppierung der ohnehin geplanten
  // Punkte nach Uhrzeit, kein eigenes Datenmodell — zugeklappt nur eine
  // Zusammenfassung, damit ein voller Tag (Tageslicht + Supplemente +
  // Training + ...) nicht als lange Einzelliste wirkt (Nutzerinnen-Vorgabe,
  // 13.08.). Standardmäßig zugeklappt, "Sonstige Zeiten"-Punkte (keine feste
  // Uhrzeit) bleiben bewusst außen vor, da nicht eindeutig morgens/abends.
  const [morgenOffen, setMorgenOffen] = useState(false);
  const [abendOffen, setAbendOffen] = useState(false);
  const [denkpauseVersteckt, setDenkpauseVersteckt] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [feedbackKategorie, setFeedbackKategorie] = useState(null);
  const [trainingFehler, setTrainingFehler] = useState(null);
  const [trainingVorschau, setTrainingVorschau] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({
    nebenwirkungen: [],
    staerke: "Keine",
    vertraeglichkeit: "Gut",
    wirkung: "Ja",
    notizen: "",
    fotoPreview: null,
    fotoFile: null,
  });
  const openFeedback = (dose, key, kategorie) => {
    setFeedbackOpen(key);
    setFeedbackKategorie(kategorie);
    // Positive Standardwerte vorausgewählt statt leer — der häufigste Fall
    // (alles in Ordnung) ist damit mit einem Tap auf "Speichern" erledigt.
    setDraftFeedback({ nebenwirkungen: [], staerke: "Keine", vertraeglichkeit: "Gut", wirkung: "Ja", notizen: "", fotoPreview: null, fotoFile: null });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));
  const handleSaveFeedback = (dose) => {
    if (feedbackKategorie === "hormon") saveHormonFeedback(dose, draftFeedback);
    else if (feedbackKategorie === "supplement") saveSupplementFeedback(dose, draftFeedback);
    setFeedbackOpen(null);
    setFeedbackKategorie(null);
  };
  const handleSkipFeedback = (dose) => {
    if (feedbackKategorie === "hormon") skipHormonFeedback(dose);
    else if (feedbackKategorie === "supplement") skipSupplementFeedback(dose);
    setFeedbackOpen(null);
    setFeedbackKategorie(null);
  };

  const today = new Date();
  // Performance-Fix (12.09., Bug-Report "Tagesplan ruckelt"): ohne
  // Memoisierung bekamen montag/wochentage bei JEDEM Render eine neue
  // Referenz, wodurch die Wochenansicht unten (siehe wochenItemsProTag)
  // buildDayItems() für alle 7 Tage bei jeder Interaktion neu aufrief —
  // gleiches Muster wie schon in WochenuebersichtView.jsx behoben.
  const montag = useMemo(() => addDays(selectedDate, -((selectedDate.getDay() + 6) % 7)), [selectedDate]);
  const wochentage = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(montag, i)), [montag]);

  // Ein Trainings-Tagesplan-Punkt ist entweder schon eine echte Zeile (aus
  // trainingEintraege) oder nur virtuell aus dem Wochenplan abgeleitet. Beim
  // Antippen wird ein virtueller Punkt erst zu einer echten Zeile (aus der
  // Wochenplan-Einheit befüllt) und dann direkt ins Live-Workout geöffnet.
  // Eine Wochenplan-Einheit kennt "arten" (Plural, mehrere Trainingsarten
  // kombinierbar, z. B. Kraft + Cardio, siehe WochenplanEditor) — die
  // Live-Workout-Ansicht kann aber immer nur eine Art gleichzeitig zeigen,
  // deshalb hier eine führende Art bestimmen: bevorzugt Krafttraining/
  // Bodyweight, weil dafür die hinterlegten Übungen greifen, sonst die
  // erste ausgewählte Art. (Bugfix 13.08.: vorher wurde ein nicht
  // existierendes `item.raw.art`/`item.raw.template` gelesen — dadurch
  // schlug das Anlegen mangels Trainingsart immer lautlos fehl.)
  const starteTraining = useCallback(
    async (item) => {
      if (!item.raw.virtuell) {
        onOpenTraining(item.raw.id);
        return;
      }
      setTrainingFehler(null);
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
        onOpenTraining(result.eintrag.id);
        return;
      }
      setTrainingFehler(result?.error || "Training konnte nicht gestartet werden.");
    },
    [onOpenTraining, trainingHinzufuegen]
  );

  const itemsForDate = useCallback(
    (date) => {
      const tagStr = toLocalISODate(date);
      const items = buildDayItems(date, {
        hormonPlan,
        hormonErledigt,
        hormonDosierung,
        supplemente,
        supplementErledigt,
        mahlzeiten,
        mahlzeitErledigt,
        mealWochenplan,
        trainingEintraege,
        trainingNachDatum,
        trainingWochenplan,
        trainingTemplates,
        gewohnheiten,
        gewohnheitErledigt,
        workflowPlaene,
        workflowPresets,
        projekte,
        zeitbloecke,
        ausnahmenNachSchluessel,
      });
      return items.map((item) => {
        if (item.kategorie === "hormon") return { ...item, doseRef: item.raw, onConfirm: () => openFeedback(item.raw, item.key, "hormon") };
        if (item.kategorie === "supplement") {
          const doseRef = { datum: tagStr, id: item.raw.id, zeit: item.uhrzeit };
          return { ...item, doseRef, onConfirm: () => openFeedback(doseRef, item.key, "supplement") };
        }
        if (item.kategorie === "training") return { ...item, onConfirm: () => starteTraining(item) };
        if (item.kategorie === "gewohnheit") return { ...item, onConfirm: () => toggleGewohnheitErledigt(tagStr, item.raw.id) };
        if (item.kategorie === "zeitblock") return item;
        return { ...item, onConfirm: () => toggleMahlzeitErledigt(tagStr, item.raw.id, item.logZeit ?? item.uhrzeit) };
      });
    },
    [
      hormonPlan,
      hormonErledigt,
      hormonDosierung,
      supplemente,
      supplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      toggleMahlzeitErledigt,
      mealWochenplan,
      trainingEintraege,
      trainingNachDatum,
      trainingWochenplan,
      trainingTemplates,
      gewohnheiten,
      gewohnheitErledigt,
      toggleGewohnheitErledigt,
      workflowPlaene,
      workflowPresets,
      projekte,
      zeitbloecke,
      ausnahmenNachSchluessel,
      starteTraining,
    ]
  );

  const tagesItems = useMemo(() => itemsForDate(selectedDate), [selectedDate, itemsForDate]);

  // Performance-Fix (12.09.): itemsForDate(d) lief in der Wochenansicht
  // bisher direkt im Render-Body für alle 7 Tage — bei jedem Render neu,
  // auch wenn sich an der Woche nichts geändert hatte (gleiches Muster wie
  // wochenItemsProTag in WochenuebersichtView.jsx).
  const wochenItemsProTag = useMemo(() => wochentage.map((d) => itemsForDate(d)), [wochentage, itemsForDate]);

  const bucketsFor = useCallback((items) => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, []);

  const buckets = useMemo(() => bucketsFor(tagesItems), [tagesItems, bucketsFor]);

  // Morgens: vor 11 Uhr. Abends: ab 18 Uhr. Ohne feste Uhrzeit ("Sonstige
  // Zeiten") gehört zu keiner Routine, da nicht eindeutig zuordenbar.
  const morgenItems = useMemo(() => tagesItems.filter((i) => i.hour && i.hour < "11"), [tagesItems]);
  const abendItems = useMemo(() => tagesItems.filter((i) => i.hour && i.hour >= "18"), [tagesItems]);
  const restItems = useMemo(() => tagesItems.filter((i) => !i.hour || (i.hour >= "11" && i.hour < "18")), [tagesItems]);
  const restBuckets = useMemo(() => bucketsFor(restItems), [restItems, bucketsFor]);

  function routineZusammenfassung(items) {
    const kategorien = [...new Set(items.map((i) => KATEGORIE[i.kategorie]?.label).filter(Boolean))];
    return `${items.length} Schritt${items.length === 1 ? "" : "e"}${kategorien.length ? ` · ${kategorien.join(", ")}` : ""}`;
  }

  // Zeigt an, welcher Zeitblock gerade "dran" ist — auch müde auf einen Blick
  // erkennbar, ohne die ganze Liste durchgehen zu müssen. Nur relevant, wenn
  // der ausgewählte Tag heute ist; der nächste noch offene Block ab jetzt.
  const jetztHour = useMemo(() => {
    if (!sameDay(selectedDate, today)) return null;
    const nowStr = String(new Date().getHours()).padStart(2, "0");
    const kommend = buckets.map(([hour]) => hour).filter((hour) => hour && hour >= nowStr);
    return kommend.length ? kommend.sort()[0] : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, buckets]);

  const erledigtCount = tagesItems.filter((i) => i.done).length;

  // Denkpause (Nutzerinnen-Vorgabe 16.09.): ein kurzer, freiwilliger
  // Übergangs-Moment zwischen den Routine-Übersichten (Morgen/Abend) und
  // dem Rest des Tagesplans — nur für "heute" und nur, solange noch etwas
  // offen ist (an einem abgeschlossenen Tag gibt es nichts, wozu man
  // "übergehen" müsste).
  const zeigeUebergangsDenkpause = modus === "tag" && sameDay(selectedDate, today) && !denkpauseVersteckt && tagesItems.some((i) => !i.done);

  // Rendert eine Liste von Stunden-Blöcken (siehe bucketsFor) — geteilt
  // zwischen der normalen Tagesansicht und den aufgeklappten Morgen-/
  // Abendroutine-Abschnitten, damit beide exakt dieselbe Zeilen-Darstellung
  // (inkl. Bestätigen/Bearbeiten/Feedback) nutzen.
  function renderZeitbloecke(bucketsListe) {
    return bucketsListe.map(([hour, entries]) => {
      const istJetzt = hour === jetztHour;
      const offeneSupplemente = entries.filter((e) => e.kategorie === "supplement" && !e.done);
      return (
        <div key={hour || "sonstige"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: istJetzt ? accentDark : textMuted }}>{hourLabel(hour)}</div>
              {istJetzt && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: accent, padding: "2px 8px", borderRadius: 8 }}>
                  JETZT
                </span>
              )}
            </div>
            {offeneSupplemente.length > 1 && (
              <button
                className="mp-tap"
                onClick={() =>
                  confirmAlleTageszeit(
                    toLocalISODate(selectedDate),
                    offeneSupplemente[0].uhrzeit,
                    offeneSupplemente.map((e) => e.refId)
                  )
                }
                style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                Alle bestätigen
              </button>
            )}
          </div>
          <Card style={{ marginBottom: 16, border: istJetzt ? `1.5px solid ${accent}` : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((item) => {
                const k = KATEGORIE[item.kategorie];
                const isOpen = feedbackOpen === item.key;
                const kFarbe = item.farbe || k.dot;
                const erledigt = !!item.done;
                return (
                  <div key={item.key}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 16,
                        border: `1.5px solid ${erledigt ? "transparent" : hexZuRgba(kFarbe, 0.35)}`,
                        background: erledigt ? verdunkeln(kFarbe, 8) : k.bg,
                      }}
                    >
                      <div
                        onClick={item.kategorie === "training" ? () => setTrainingVorschau(item) : undefined}
                        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, cursor: item.kategorie === "training" ? "pointer" : "default" }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: erledigt ? "rgba(255, 255, 255, 0.28)" : "#fff",
                          }}
                        >
                          {k.icon ? (
                            <Icon name={k.icon} size={16} color={erledigt ? "#fff" : kFarbe} />
                          ) : (
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: erledigt ? "#fff" : kFarbe }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: erledigt ? "#fff" : undefined }}>{item.name}</div>
                          <div style={{ fontSize: 12, marginTop: 1, color: erledigt ? "rgba(255, 255, 255, 0.85)" : textMuted }}>
                            {item.uhrzeit ? `${item.uhrzeit} · ` : ""}
                            {k.label}
                          </div>
                          {item.detail && (
                            <div style={{ fontSize: 11.5, marginTop: 1, color: erledigt ? "rgba(255, 255, 255, 0.8)" : textMuted }}>{item.detail}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {item.kategorie !== "training" && onEditItem && (
                          <button
                            className="mp-tap"
                            onClick={() => onEditItem(item.kategorie, item.refId)}
                            title="Bearbeiten"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 10,
                              border: "none",
                              background: erledigt ? "rgba(255, 255, 255, 0.28)" : "#fff",
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            ✏️
                          </button>
                        )}
                        {item.kategorie === "zeitblock" || item.kategorie === "workflow" ? null : erledigt ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "8px 12px",
                              borderRadius: 10,
                              background: "rgba(255, 255, 255, 0.92)",
                              color: verdunkeln(kFarbe, 12),
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✓ Erledigt
                          </span>
                        ) : (
                          <button
                            className="mp-tap"
                            onClick={item.onConfirm}
                            style={{ minHeight: 40, padding: "8px 16px", borderRadius: 12, border: "none", background: kFarbe, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                          >
                            {item.kategorie === "training" ? "Training starten" : "Bestätigen"}
                          </button>
                        )}
                      </div>
                    </div>

                    {["hormon", "supplement"].includes(item.kategorie) && isOpen && (
                      <FeedbackPanel
                        kategorie={item.kategorie}
                        draftFeedback={draftFeedback}
                        setDraftFeedback={setDraftFeedback}
                        toggleDraftNebenwirkung={toggleDraftNebenwirkung}
                        onSkip={() => handleSkipFeedback(item.doseRef)}
                        onSave={() => handleSaveFeedback(item.doseRef)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    });
  }

  if (ablaufRoutine) {
    const schritteFuerRoutine = routineSchritte.filter((s) => s.routine === ablaufRoutine).sort((a, b) => a.reihenfolge - b.reihenfolge);
    return (
      <RoutineAblauf
        routine={ablaufRoutine}
        schritte={schritteFuerRoutine}
        onAbschluss={() => setAblaufRoutine(null)}
        onAbbrechen={() => setAblaufRoutine(null)}
        routineDurchlaufSpeichern={routineDurchlaufSpeichern}
      />
    );
  }

  return (
    <Shell>
      <ViewHeader title="🗓️ Tagesplan" onHome={onHome} />

      {trainingFehler && (
        <Card style={{ marginBottom: 16, borderColor: danger }}>
          <div style={{ fontSize: 13, color: danger, fontWeight: 700, marginBottom: 4 }}>Training konnte nicht gestartet werden</div>
          <div style={{ fontSize: 12.5, color: textMuted }}>{trainingFehler}</div>
          <button
            className="mp-tap"
            onClick={() => setTrainingFehler(null)}
            style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: accentDark, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Verstanden
          </button>
        </Card>
      )}

      <KiChat
        systemPrompt="Du bist ein hilfsbereiter Assistent für eine App zur Selbstverwaltung von Gesundheitsprotokollen. Beantworte Fragen zum Tagesplan der Person. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein neues Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, neue Rezepte, ein Schlaf-Eintrag für die letzte Nacht, ein neues Workflow-Preset), frag von dir aus alle dafür nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — antworte dabei immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Frag mich was zu deinem Tag, oder ich helf dir direkt bei jedem Bereich der App weiter.`}
        pruefeBereitschaft={handleBereitschaftPruefen}
        onUebernehmen={handleUniverselleUebernahme}
        uebernehmenLabels={BEREICH_LABELS}
      />

      {modus === "tag" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ProgressRing done={erledigtCount} total={tagesItems.length} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 3 }}>{fmtDate(selectedDate)}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{statusText(erledigtCount, tagesItems.length)}</div>
            </div>
          </div>
        </Card>
      )}

      {modus === "tag" && sameDay(selectedDate, new Date()) && (
        <QuestsKarte
          quests={(quests || []).filter((q) => q.fortschritt.angenommen === true)}
          onFortschritt={questFortschrittSpeichern}
          titel="🎯 Deine angenommenen Quests"
        />
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "tag", label: "Tag" },
          { id: "woche", label: "Woche" },
        ].map((t) => (
          <button
            key={t.id}
            className="mp-tap"
            onClick={() => setModus(t.id)}
            style={{
              flex: 1,
              minHeight: 44,
              padding: "9px 0",
              borderRadius: 13,
              border: `1px solid ${modus === t.id ? accent : cardBorder}`,
              background: modus === t.id ? accent : "#fff",
              color: modus === t.id ? "#fff" : textMuted,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {modus === "tag" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {wochentage.map((d, i) => {
            const active = sameDay(d, selectedDate);
            return (
              <button
                key={i}
                className="mp-tap"
                onClick={() => {
                  setSelectedDate(d);
                  setModus("tag");
                }}
                style={{
                  flex: "1 0 44px",
                  minHeight: 52,
                  padding: "8px 4px",
                  borderRadius: 13,
                  border: `1px solid ${active ? accent : cardBorder}`,
                  background: active ? accent : "#fff",
                  color: active ? "#fff" : sameDay(d, today) ? accentDark : textMuted,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAGE[d.getDay()]}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>
      )}

      {modus === "tag" && (
        <>
          {tagesItems.length === 0 && (
            <Card>
              <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Für diesen Tag steht nichts an. 🌿</div>
            </Card>
          )}

          <div className="mp-tagesplan-routinen-grid">
          <Card style={{ marginBottom: 16 }}>
            <button
              className="mp-tap"
              onClick={() => setMorgenOffen((o) => !o)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>🌅 Morgenroutine</div>
              <div style={{ fontSize: 11.5, color: textMuted }}>
                {morgenItems.length > 0 ? routineZusammenfassung(morgenItems) : "Noch nichts geplant"} {morgenOffen ? "▲" : "▼"}
              </div>
            </button>
            {morgenOffen && (
              <div style={{ marginTop: 12 }}>
                {morgenItems.length > 0 && renderZeitbloecke(bucketsFor(morgenItems))}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1 }}>
                    <PrimaryButton onClick={() => setAblaufRoutine("morgen")}>▶️ Morgenroutine starten</PrimaryButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSchritteBearbeiten((p) => ({ ...p, morgen: !p.morgen }))}
                    style={{ border: `1px solid ${cardBorder}`, borderRadius: 12, background: "#fff", color: textMuted, fontSize: 18, cursor: "pointer", padding: "0 12px" }}
                  >
                    ⚙️
                  </button>
                </div>
                {schritteBearbeiten.morgen && (
                  <>
                    <RoutineSchritteEditor
                      routine="morgen"
                      schritte={routineSchritte.filter((s) => s.routine === "morgen")}
                      onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("morgen", name, dauerMin)}
                    />
                    <RoutineSchritteListe
                      routine="morgen"
                      schritte={routineSchritte.filter((s) => s.routine === "morgen")}
                      onEntfernen={routineSchrittEntfernen}
                      onVerschieben={routineSchrittVerschieben}
                    />
                  </>
                )}
              </div>
            )}
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <button
              className="mp-tap"
              onClick={() => setAbendOffen((o) => !o)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>🌙 Abendroutine</div>
              <div style={{ fontSize: 11.5, color: textMuted }}>
                {abendItems.length > 0 ? routineZusammenfassung(abendItems) : "Noch nichts geplant"} {abendOffen ? "▲" : "▼"}
              </div>
            </button>
            {abendOffen && (
              <div style={{ marginTop: 12 }}>
                {abendItems.length > 0 && renderZeitbloecke(bucketsFor(abendItems))}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1 }}>
                    <PrimaryButton onClick={() => setAblaufRoutine("abend")}>▶️ Abendroutine starten</PrimaryButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSchritteBearbeiten((p) => ({ ...p, abend: !p.abend }))}
                    style={{ border: `1px solid ${cardBorder}`, borderRadius: 12, background: "#fff", color: textMuted, fontSize: 18, cursor: "pointer", padding: "0 12px" }}
                  >
                    ⚙️
                  </button>
                </div>
                {schritteBearbeiten.abend && (
                  <>
                    <RoutineSchritteEditor
                      routine="abend"
                      schritte={routineSchritte.filter((s) => s.routine === "abend")}
                      onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("abend", name, dauerMin)}
                    />
                    <RoutineSchritteListe
                      routine="abend"
                      schritte={routineSchritte.filter((s) => s.routine === "abend")}
                      onEntfernen={routineSchrittEntfernen}
                      onVerschieben={routineSchrittVerschieben}
                    />
                  </>
                )}
              </div>
            )}
          </Card>
          </div>

          {zeigeUebergangsDenkpause && (
            <DenkpauseNudge text="Kurzer Denksport vorm Umschalten?" onDismiss={() => setDenkpauseVersteckt(true)} />
          )}

          <div className="mp-tagesplan-zeitbloecke-grid">{renderZeitbloecke(restBuckets)}</div>
        </>
      )}

      {modus === "woche" && (
        <div className="mp-tagesplan-woche-grid">
          {wochentage.map((d, i) => {
            const items = wochenItemsProTag[i];
            // Zeitblöcke sind Kalendereinträge, keine erledigbaren
            // Aufgaben — würden die "X/Y erledigt"-Quote sonst künstlich
            // verschlechtern, da sie nie als erledigt zählen können.
            const erledigbareItems = items.filter((i) => i.kategorie !== "zeitblock");
            const done = erledigbareItems.filter((i) => i.done).length;
            const perKategorie = ["hormon", "supplement", "mahlzeit", "training", "gewohnheit"].map((kat) => ({
              kat,
              count: items.filter((i) => i.kategorie === kat).length,
            }));
            return (
              <button
                key={d.toDateString()}
                className="mp-tap"
                onClick={() => {
                  setSelectedDate(d);
                  setModus("tag");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1px solid ${sameDay(d, today) ? accent : cardBorder}`,
                  borderRadius: 18,
                  background: "#fff",
                  padding: "14px 18px",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDate(d)}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>
                    {erledigbareItems.length > 0 ? `${done}/${erledigbareItems.length} erledigt` : "nichts geplant"}
                  </div>
                </div>
                {items.length > 0 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {perKategorie
                      .filter((p) => p.count > 0)
                      .map((p) => (
                        <div key={p.kat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: KATEGORIE[p.kat].text }}>
                          <div style={{ width: 7, height: 7, borderRadius: 4, background: KATEGORIE[p.kat].dot }} />
                          {p.count}× {KATEGORIE[p.kat].label}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {trainingVorschau && (
        <TrainingVorschau
          art={trainingVorschau.raw.art || (trainingVorschau.raw.arten || []).join(" + ")}
          name={trainingVorschau.raw.name}
          tag={fmtDate(selectedDate)}
          uhrzeit={trainingVorschau.uhrzeit}
          uebungen={trainingVorschau.raw.uebungen || trainingVorschau.raw.uebungenListe}
          warmup={trainingVorschau.raw.warmup}
          cooldown={trainingVorschau.raw.cooldown}
          onSchliessen={() => setTrainingVorschau(null)}
          onStarten={
            trainingVorschau.raw.erledigt
              ? undefined
              : () => {
                  trainingVorschau.onConfirm();
                  setTrainingVorschau(null);
                }
          }
        />
      )}
    </Shell>
  );
}
