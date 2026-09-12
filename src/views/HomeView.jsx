import React, { useState, useMemo } from "react";
import { Shell, Card, TextArea, PrimaryButton } from "../ui/primitives";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import MiniPlanWidget from "../ui/MiniPlanWidget";
import { accentDark, accentSoft, cardBorder, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { toLocalISODate, addDays, sameDay } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { useT } from "../i18n/translate";
import ADHSModeToggle from "../ui/ADHSModeToggle";
import { AkutModusTrigger, AkutModusPanel } from "../ui/AkutModusKarte";
import QuickTaskList from "../ui/QuickTaskList";
import { QuestsKarte } from "../ui/QuestsKarte";
import RanglisteKarte from "../ui/RanglisteKarte";
import TeamKarte from "../ui/TeamKarte";
import { getADHSMode, saveADHSMode, getSoundEnabled, saveSoundEnabled } from "../utils/adhsStorage";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import RoutineHeuteChecklist from "../ui/RoutineHeuteChecklist";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";

// Basis-Rollenbeschreibung des Home-Coaches. Die "Background Brain"-Inhalte
// (Wissens-Basis aus src/wissen/ + Trackingdaten-Zusammenfassung) werden
// nicht hier, sondern zentral in KiChat.jsx an JEDE Coach-Anfrage in allen
// Bereichen angehängt (nicht nur Home) — siehe dort.
const HOME_SYSTEM_PROMPT_BASIS =
  "Du bist ein hilfsbereiter Assistent für eine App zur Selbstverwaltung von Gesundheitsprotokollen (Peptide, Hormone, Supplemente, Training, Schlaf, Ernährung, Hydration, Tageslicht, Gewohnheiten). Beantworte Fragen zu den Plänen der Person allgemein und motivierend. Nutze die weiter unten mitgegebene Zusammenfassung der Trackingdaten, um Zusammenhänge zwischen den Bereichen zu erkennen und anzusprechen, wenn es hilfreich ist (z. B. sinkende Trinkmenge und schlechtere Trainingswerte) — dräng das aber nicht in jede Antwort, nur wenn es zur Frage passt. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein neues Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, neue Rezepte, ein Schlaf-Eintrag für die letzte Nacht, ein neues Workflow-Preset), frag von dir aus alle dafür nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — antworte dabei immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.";

// Fasst mehrere Supplemente derselben Tageszeit ("Morgens-Supplemente")
// bzw. mehrere Trainingseinheiten desselben Tages ("Trainingseinheit") zu
// einer Zeile zusammen — Einzeleinträge bleiben unverändert, sobald nur
// ein Eintrag der jeweiligen Gruppe angehört.
function gruppiereFuerAlsNaechstes(items, t, tLabel) {
  const angezeigt = [];
  const supplementSlots = {};
  let trainingSlot = null;

  items.forEach((item) => {
    if (item.kategorie === "supplement") {
      let slot = supplementSlots[item.uhrzeit];
      if (!slot) {
        slot = { ...item, _ids: [item.refId], _namen: [item.name] };
        supplementSlots[item.uhrzeit] = slot;
        angezeigt.push(slot);
      } else {
        slot._ids.push(item.refId);
        slot._namen.push(item.name);
      }
    } else if (item.kategorie === "training") {
      if (!trainingSlot) {
        trainingSlot = { ...item, _traininganzahl: 1 };
        angezeigt.push(trainingSlot);
      } else {
        trainingSlot._traininganzahl += 1;
      }
    } else {
      angezeigt.push(item);
    }
  });

  return angezeigt.map((it) => {
    if (it.kategorie === "supplement" && it._ids.length > 1) {
      return { ...it, name: t("home.list.supplementBundle", { uhrzeit: tLabel(it.uhrzeit) }), detail: it._namen.join(", "), bundleIds: it._ids };
    }
    if (it.kategorie === "training" && it._traininganzahl > 1) {
      return { ...it, name: t("home.list.trainingseinheit") };
    }
    return it;
  });
}

// Konzept 4B: die Startseite ist ein knapper Tagesassistent + drei
// Ordner-Kacheln (Alle Pläne / Archiv / Mehr) statt einer langen Liste
// aus 17 Einzelkacheln — jede Kategorie liegt jetzt hinter einem Reiter
// innerhalb dieser Ordner (siehe PlaeneView.jsx / PlanView.jsx).
const ORDNER = [
  { id: "schlaf", labelKey: "home.ordner.plaene.label", descKey: "home.ordner.plaene.desc", icon: "folder" },
  { id: "archiv", labelKey: "home.ordner.archiv.label", descKey: "home.ordner.archiv.desc", icon: "archive" },
  { id: "mehr", labelKey: "home.ordner.mehr.label", descKey: "home.ordner.mehr.desc", icon: "sliders" },
];

// Morgen-/Abendroutine haben bewusst KEINEN KATEGORIE_META-Eintrag (siehe
// PlaeneView.jsx/RoutineTabView.jsx: sonst tauchen sie als tote Einträge in
// der Wochenübersicht-Legende auf) — dieselben Farben hier lokal dupliziert,
// gleiches Muster wie in den beiden anderen Dateien.
const ROUTINE_FARBE = { morgenroutine: "#E08A3E", abendroutine: "#4E6690" };
const ROUTINE_HINTERGRUND = { morgenroutine: "#FBEADA", abendroutine: "#E7EBF3" };

// Tagesfortschritt als Balkendiagramm (12.09., Nutzerinnen-Vorgabe: "so ein
// Diagramm mit so Stäbchen" statt eines einzelnen Rings) — ein Balken je
// Lebensbereich statt einer einzelnen Gesamtzahl, damit auf einen Blick
// sichtbar ist, WO es heute hakt. Graue Kurz-Balken markieren Bereiche, die
// noch gar nicht eingerichtet sind (aktiv: false).
function TagesfortschrittBalken({ widgets }) {
  const MAX_HOEHE = 100;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: MAX_HOEHE }}>
        {widgets.map((w) => {
          const hoehe = w.aktiv ? Math.max(4, Math.round(Math.min(1, w.dailyCount / (w.dailyTotal || 1)) * MAX_HOEHE)) : 6;
          // Bug-Fix: w.farbe ist NUR bei Morgen-/Abendroutine gesetzt (siehe
          // ROUTINE_FARBE weiter unten) — alle anderen Kategorien holen ihre
          // Farbe aus KATEGORIE_META, wie schon bei "Als Nächstes"/"Weitere
          // Pläne". Ohne diesen Fallback waren hier bisher ALLE Balken außer
          // Morgen-/Abendroutine unsichtbar (kein background gesetzt).
          const farbe = w.aktiv ? w.farbe || KATEGORIE_META[w.kategorie]?.dot : "#E2E2DC";
          return (
            <div key={w.kategorie} title={w.name} style={{ width: 26, flexShrink: 0, height: hoehe, borderRadius: "6px 6px 2px 2px", background: farbe }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
        {widgets.map((w) => (
          <div key={w.kategorie} style={{ width: 26, flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: w.aktiv ? w.farbe || KATEGORIE_META[w.kategorie]?.dot : "#B5B5AE" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Ersetzt für Coachees (istAdminModus === false) den KI-Assistenten als
// Kontaktweg (13.08., Coach-verwaltetes Modell) — eine einfache Nachricht
// an den echten Coach statt an Aka, siehe useCoacheeNachrichten.js.
function NachrichtAnCoachCard({ nachrichten, onSenden }) {
  const [text, setText] = useState("");
  const [senden, setSenden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(false);

  const absenden = async () => {
    setFehler(null);
    setErfolg(false);
    setSenden(true);
    const result = await onSenden(text);
    setSenden(false);
    if (!result?.ok) {
      setFehler(result?.error || "Senden fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setText("");
    setErfolg(true);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>
        Frag deinen Coach etwas oder gib eine Rückmeldung — er meldet sich bei dir.
      </div>
      <Card>
        <TextArea value={text} onChange={setText} placeholder="Deine Nachricht an deinen Coach ..." />
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={absenden} disabled={senden || !text.trim()}>
            {senden ? "Wird gesendet …" : "Nachricht senden"}
          </PrimaryButton>
        </div>
        {fehler && <div style={{ fontSize: 12, color: "#C24545", marginTop: 8 }}>{fehler}</div>}
        {erfolg && <div style={{ fontSize: 12, color: accentDark, marginTop: 8 }}>Nachricht gesendet.</div>}
      </Card>
      {nachrichten?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {nachrichten.slice(0, 5).map((n) =>
            n.absender === "coach" ? (
              <div key={n.id} style={{ fontSize: 12.5, padding: "8px 10px", marginBottom: 6, borderRadius: 10, background: accentSoft, color: accentDark }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2 }}>Dein Coach</div>
                {n.text}
              </div>
            ) : (
              <div key={n.id} style={{ fontSize: 12, color: textMuted, padding: "6px 2px" }}>
                {n.gelesen ? "✓ Gelesen" : "Noch nicht gelesen"} · {n.text}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}


export default function HomeView({ onOpenView, onOpenTraining }) {
  const { t, tLabel, lang } = useT();
  const {
    hormonPlan,
    hormonErledigt,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingNachDatum,
    trainingWochenplan,
    trainingTemplates,
    trainingHinzufuegen,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    projekte,
    zeitbloecke,
    ausnahmenNachSchluessel,
    routineSchritte,
    routineDurchlaeufe,
    routineSchrittErledigt,
    confirmAlleTageszeit,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    tageslichtHeuteMinuten,
    tageslichtZielMinuten,
    aenderungVermerken,
    isAdmin,
    coacheeNachrichten,
    coacheeNachrichtSenden,
    quests,
    questFortschrittSpeichern,
    team,
    teamKollegen,
    teamNachrichten,
    teamNachrichtSenden,
    teamNachrichtGelesen,
  } = useAppData();
  const { proband } = useAdmin();
  // Coach-verwaltetes Modell (13.08.): Coachees sehen hier statt des
  // KI-Assistenten eine einfache Nachricht-an-den-Coach-Karte (siehe
  // NachrichtAnCoachCard unten) — dieselbe istAdminModus-Logik wie in
  // KiChat.jsx/OnboardingFlow.jsx/AuthenticatedApp.jsx.
  const istAdminModus = proband !== null || isAdmin;

  const { handleBereitschaftPruefen, handleUniverselleUebernahme } = useUniversellerCoach();

  // ADHS Mode State
  const [isEmergencyMode, setIsEmergencyMode] = useState(() => getADHSMode());
  const [akutOffen, setAkutOffen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled());
  const [trainingFehler, setTrainingFehler] = useState(null);
  // Direkte Checkliste statt Wegnavigieren (12.09., Nutzerin-Vorgabe): ein
  // Tap auf "Morgenroutine"/"Abendroutine" in "Als Nächstes" klappt die
  // echten Schritte HIER auf der Startseite auf, statt zum Schritte-Editor
  // oder Tagesplan zu springen. null = zugeklappt, sonst "morgen"/"abend".
  const [expandedRoutine, setExpandedRoutine] = useState(null);

  // Tap auf die Trainingszeile in "Als Nächstes" soll direkt in den
  // Live-Start-Screen führen (Nutzerin-Korrektur 14.08.: eine reine
  // Vorschau ohne Startmöglichkeit war nicht das, was sie wollte — die
  // volle Übungstabelle gibt's stattdessen als kleines Icon INNERHALB des
  // Live-Screens, siehe TrainingView.jsx). Gleiche Logik wie
  // TagesplanView.starteTraining: reale Einträge direkt öffnen, virtuelle
  // (aus dem Wochenplan) erst als echten Eintrag anlegen.
  const starteTrainingVonItem = async (item) => {
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
  };

  // Notfallmodus-Tage werden jetzt im Tagesverlauf vermerkt (Nutzerinnen-
  // Vorgabe: "Notfallmodus-Tage werden nicht dauerhaft gespeichert") —
  // sowohl Aktivierung als auch Beendigung, damit im Protokoll sichtbar
  // ist, wie lange ein Notfalltag gedauert hat.
  const handleToggleEmergencyMode = (newState) => {
    setIsEmergencyMode(newState);
    saveADHSMode(newState);
    aenderungVermerken({
      kategorie: "notfallmodus",
      itemName: "Notfallmodus",
      aktion: newState ? "aktiviert" : "beendet",
      detail: newState ? "Nur Basics heute — kein vollständiger Plan genutzt" : "",
    });
  };

  const handleToggleSoundEnabled = (newState) => {
    setSoundEnabled(newState);
    saveSoundEnabled(newState);
  };

  // useMemo statt `new Date()` direkt: Der Wert wird unten als Dependency
  // eines weiteren useMemo (Widget-Liste) verwendet — ein bei jedem Render
  // neu erzeugtes Date-Objekt hätte jedes Mal eine andere Referenz und
  // machte dieses Memoisieren wirkungslos (Bug: komplette Widget-Liste
  // wurde bei JEDEM Render neu berechnet statt nur bei echten
  // Datenänderungen — spürbar als Ruckeln bei Interaktionen auf der
  // Startseite).
  const today = useMemo(() => new Date(), []);
  const stunde = today.getHours();
  const gruss = stunde < 12 ? t("home.greeting.morgen") : stunde < 18 ? t("home.greeting.tag") : t("home.greeting.abend");

  // Lade Benutzernamen aus localStorage
  const userName = typeof window !== "undefined" ? localStorage.getItem("user_name") : null;

  // Performance-Fix (12.09., Bug-Report "Tagesplan ruckelt" — betrifft auch
  // den Home-Bildschirm, der bei jedem Öffnen zuerst angezeigt wird): lief
  // bisher direkt im Render-Body neu, bei jeder noch so unbeteiligten
  // Zustandsänderung irgendwo in der App.
  const heuteItems = useMemo(
    () =>
      buildDayItems(today, {
        hormonPlan,
        hormonErledigt,
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
      }),
    [
      today,
      hormonPlan,
      hormonErledigt,
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
      ausnahmenNachSchluessel,
      projekte,
      zeitbloecke,
    ]
  );

  // Im Notfallmodus: nur Medikamente/Hormone und Hydration anzeigen — die
  // Kategorie heißt intern "hormon" (siehe KATEGORIE_META, label "Medikament"),
  // "medikament" als Schlüssel existierte nirgends und ließ den Filter vorher
  // leerlaufen. Hydration wird separat als Balken angezeigt (kein Item-Modell).
  const ESSENTIAL_KATEGORIEN = ["hormon", "hydration"];
  const displayItems = isEmergencyMode ? heuteItems.filter((item) => ESSENTIAL_KATEGORIEN.includes(item.kategorie)) : heuteItems;

  const erledigtCount = displayItems.filter((i) => i.done).length;
  const offeneItems = displayItems.filter((i) => !i.done);
  const tagStr = toLocalISODate(today);

  // Morgen-/Abendroutine tauchen jetzt auch unter "Als Nächstes" auf (12.09.,
  // Nutzerinnen-Vorgabe: "ich hab grad eine aktuell hinterlegte Morgenroutine,
  // aber die erscheint im Tagesplan nicht") — buildDayItems() erzeugt dafür
  // bewusst keine Einträge (eine Routine ist eine Schritt-Kette, kein
  // einzelnes Toggle-Item, siehe PlaeneView.jsx/RoutineTabView.jsx), deshalb
  // hier als eigene Pseudo-Items ergänzt. Ein Durchlauf wird erst EINMAL ganz
  // am Ende gespeichert (routineDurchlaufSpeichern, siehe useRoutinen.js) —
  // es gibt keinen Zwischenstand, deshalb bewusst nur "erledigt/offen", kein
  // Bruchteil wie bei anderen Kategorien. Bleibt stehen, bis der Durchlauf für
  // heute wirklich gespeichert ist, verschwindet also nicht schon beim ersten
  // Antippen. Nicht im Notfallmodus (dort zählen nur die Basics).
  const routineAlsNaechstesItems = isEmergencyMode
    ? []
    : ["morgen", "abend"]
        .filter((routine) => routineSchritte.some((s) => s.routine === routine) && !routineDurchlaeufe.some((d) => d.routine === routine && d.datum === tagStr))
        .map((routine) => {
          const schritteDieserRoutine = routineSchritte.filter((s) => s.routine === routine);
          const erledigtCount = schritteDieserRoutine.filter((s) => routineSchrittErledigt[`${tagStr}__${s.id}`]).length;
          return {
            key: `routine-${routine}`,
            name: tLabel(routine === "morgen" ? "Morgenroutine" : "Abendroutine"),
            kategorie: routine === "morgen" ? "morgenroutine" : "abendroutine",
            viewId: routine === "morgen" ? "morgenroutine" : "abendroutine",
            // Statt der bisherigen pauschalen "Routine offen" (Nutzerin-
            // Vorgabe 12.09.: "ich finde nicht gut, was sie anzeigt") echter
            // Fortschritt — Tippen klappt darunter die Schritte im Detail auf.
            detail: erledigtCount > 0 ? `${erledigtCount} von ${schritteDieserRoutine.length} Schritten erledigt` : t("home.list.routineOffen"),
            uhrzeit: "",
            done: false,
          };
        });
  const angezeigteItems = [...routineAlsNaechstesItems, ...gruppiereFuerAlsNaechstes(offeneItems, t, tLabel)];

  // Konvertiere Items ins QuickTaskList-Format
  const quickTasksFormatted = angezeigteItems.map((item) => ({
    key: item.key,
    name: item.name,
    detail: item.detail || "",
    done: item.done || false,
    kategorie: item.kategorie,
    onToggle: () => {
      if (item.bundleIds) {
        confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
      } else {
        onOpenView("tagesplan");
      }
    },
  }));

  // Mini-Widget-Daten für alle Kategorien — die volle Liste (auch inaktive)
  // wird unten in "Direktzugriff" (aktiv) und "Weitere Pläne" (inaktiv)
  // aufgeteilt (12.09., Nutzerinnen-Vorgabe), plus als Grundlage für das
  // Balkendiagramm im Tagesfortschritt. Der Notfallmodus-Filter läuft erst
  // beim Aufteilen (siehe direktzugriffWidgets/weiterePlaeneWidgets unten).
  const miniWidgetData = useMemo(() => {
    const widgets = [];

    // Einmal für alle 7 Tage berechnen statt einmal pro Kategorie-Block —
    // vorher riefen Supplemente/Mahlzeiten/Training je einzeln dieselbe
    // 7-Tage-Schleife mit identischen Argumenten auf (21 buildDayItems()-
    // Aufrufe pro Render statt der nötigen 7).
    const wocheItems = Array.from({ length: 7 }, (_, i) =>
      buildDayItems(addDays(today, i), {
        hormonPlan, hormonErledigt, supplemente, supplementErledigt,
        mahlzeiten, mahlzeitErledigt, mealWochenplan, trainingEintraege, trainingNachDatum, trainingWochenplan,
        trainingTemplates, gewohnheiten, gewohnheitErledigt, workflowPlaene, workflowPresets, ausnahmenNachSchluessel,
      })
    ).flat();

    // Gewohnheiten — war bisher eine eigene große Ring-Kachel oben auf der
    // Startseite (12.09., Nutzerinnen-Vorgabe: "der Kreis mit Routinen soll
    // kleiner werden, daraus soll ein Button werden") — jetzt genauso groß
    // wie jede andere Kategorie hier im Raster.
    {
      const gewohnheitItems = heuteItems.filter((i) => i.kategorie === "gewohnheit");
      const todayCount = gewohnheitItems.filter((i) => i.done).length;
      const weekItems = wocheItems.filter((it) => it.kategorie === "gewohnheit" && it.done);
      widgets.push({
        name: tLabel("Gewohnheiten"),
        kategorie: "gewohnheit",
        viewId: "routinen",
        aktiv: gewohnheiten.length > 0,
        dailyCount: todayCount,
        dailyTotal: Math.max(gewohnheitItems.length, 1),
        weeklyCount: weekItems.length,
        weeklyTotal: Math.max(gewohnheiten.length * 7, 1),
        isEssential: false,
      });
    }

    // Morgen-/Abendroutine — bisher nirgends auf der Startseite vertreten
    // (buildDayItems() erzeugt dafür bewusst keine Tagesplan-Einträge, siehe
    // ROUTINE_FARBE-Kommentar oben). "Aktiv" heißt hier: mindestens ein
    // Schritt ist konfiguriert. Ein Durchlauf wird erst EINMAL ganz am Ende
    // gespeichert — deshalb nur binär "heute erledigt oder nicht", kein
    // Bruchteil wie bei den anderen Kategorien.
    ["morgen", "abend"].forEach((routine) => {
      const kategorie = routine === "morgen" ? "morgenroutine" : "abendroutine";
      const heuteErledigt = routineDurchlaeufe.some((d) => d.routine === routine && d.datum === tagStr);
      const wochenStart = toLocalISODate(addDays(today, -6));
      const wochenCount = routineDurchlaeufe.filter((d) => d.routine === routine && d.datum >= wochenStart && d.datum <= tagStr).length;
      widgets.push({
        name: tLabel(routine === "morgen" ? "Morgenroutine" : "Abendroutine"),
        kategorie,
        viewId: kategorie,
        aktiv: routineSchritte.some((s) => s.routine === routine),
        dailyCount: heuteErledigt ? 1 : 0,
        dailyTotal: 1,
        weeklyCount: wochenCount,
        weeklyTotal: 7,
        isEssential: false,
        farbe: ROUTINE_FARBE[kategorie],
        hintergrund: ROUTINE_HINTERGRUND[kategorie],
        statusText: heuteErledigt ? "heute erledigt" : "heute noch offen",
      });
    });

    // Medikamente (umfasst seit der Datenzusammenlegung, 13.08., auch
    // Hormone und Peptide — Bug-Fix, 12.09.: diese Kachel hieß bisher fest
    // "Hormone", obwohl sie schon immer alle drei zusammen zeigt und beim
    // Klick dieselbe "Medikamente"-Ansicht öffnet — wirkte für die Nutzerin
    // wie ein zweiter, separater Bereich neben "Medikamente".
    {
      const todayCount = hormonPlan.filter((d) => {
        const key = `${toLocalISODate(d.date)}__${d.name}__${d.uhrzeit}`;
        return hormonErledigt[key];
      }).length;
      const weekStart = addDays(today, -((today.getDay() + 6) % 7));
      const weekEnd = addDays(weekStart, 6);
      const weekCount = hormonPlan.filter((d) => {
        const key = `${toLocalISODate(d.date)}__${d.name}__${d.uhrzeit}`;
        return (
          hormonErledigt[key] &&
          d.date >= weekStart &&
          d.date <= weekEnd
        );
      }).length;
      widgets.push({
        name: tLabel("Medikamente"),
        kategorie: "hormon",
        viewId: "medikamente",
        aktiv: hormonPlan.length > 0,
        dailyCount: todayCount,
        dailyTotal: hormonPlan.filter((d) => sameDay(d.date, today)).length || 1,
        weeklyCount: weekCount,
        weeklyTotal: hormonPlan.length || 1,
        isEssential: true,
      });
    }

    // Supplemente
    {
      const supplementItems = heuteItems.filter((i) => i.kategorie === "supplement");
      const todayCount = supplementItems.filter((i) => i.done).length;
      const weekItems = wocheItems.filter((it) => it.kategorie === "supplement" && it.done);
      widgets.push({
        name: tLabel("Supplemente"),
        kategorie: "supplement",
        viewId: "supplemente",
        aktiv: supplemente.length > 0,
        dailyCount: todayCount,
        dailyTotal: Math.max(supplementItems.length, 1),
        weeklyCount: weekItems.length,
        weeklyTotal: Math.max(supplemente.length * 7, 1),
        isEssential: false,
      });
    }

    // Mahlzeiten
    {
      const mealItems = heuteItems.filter((i) => i.kategorie === "mahlzeit");
      const todayCount = mealItems.filter((i) => i.done).length;
      const weekItems = wocheItems.filter((it) => it.kategorie === "mahlzeit" && it.done);
      widgets.push({
        name: tLabel("Mahlzeiten"),
        kategorie: "mahlzeit",
        viewId: "ernaehrung",
        aktiv: mahlzeiten.length > 0,
        dailyCount: todayCount,
        dailyTotal: Math.max(mealItems.length, 1),
        weeklyCount: weekItems.length,
        weeklyTotal: Math.max(mahlzeiten.length * 7, 1),
        isEssential: false,
      });
    }

    // Training
    {
      const trainingItems = heuteItems.filter((i) => i.kategorie === "training");
      const todayCount = trainingItems.filter((i) => i.done).length;
      const weekItems = wocheItems.filter((it) => it.kategorie === "training" && it.done);
      widgets.push({
        name: tLabel("Training"),
        kategorie: "training",
        viewId: "training",
        aktiv: trainingEintraege.length > 0 || trainingWochenplan.length > 0,
        dailyCount: todayCount,
        dailyTotal: Math.max(trainingItems.length, 1),
        weeklyCount: weekItems.length,
        weeklyTotal: Math.max(trainingWochenplan.filter((w) => w.vorlage).length * 7, 1),
        isEssential: false,
      });
    }

    // Hydration wird als laufende Trinkmenge geführt, nicht als Liste
    // einzelner Zeit-Items (siehe useHydrationData) — deshalb hier direkt aus
    // hydrationHeuteMl/-ZielMl berechnet statt aus heuteItems gefiltert, wo
    // nie ein "hydration"-Eintrag existiert. Gilt als "aktiv", sobald
    // überhaupt schon etwas getrunken wurde oder ein Ziel abweichend vom
    // Standard gesetzt wurde.
    widgets.push({
      name: tLabel("Hydration"),
      kategorie: "hydration",
      viewId: "hydration",
      aktiv: hydrationHeuteMl > 0 || hydrationZielMl !== 2500,
      dailyCount: Math.min(hydrationHeuteMl, hydrationZielMl),
      dailyTotal: hydrationZielMl || 1,
      weeklyCount: 0,
      weeklyTotal: 1,
      isEssential: true,
      unit: "ml",
      actionLabel: "+200ml",
      onAction: () => hydrationHinzufuegen(200),
    });

    // Tageslicht — gleicher Aufbau wie Hydration (laufende Tageszeit statt
    // Item-Liste), Standard-Ziel ist 30 Minuten (siehe 0033_tageslicht.sql).
    widgets.push({
      name: tLabel("Tageslicht"),
      kategorie: "tageslicht",
      viewId: "tageslicht",
      aktiv: tageslichtHeuteMinuten > 0 || tageslichtZielMinuten !== 30,
      dailyCount: Math.min(tageslichtHeuteMinuten, tageslichtZielMinuten),
      dailyTotal: tageslichtZielMinuten || 1,
      weeklyCount: 0,
      weeklyTotal: 1,
      isEssential: false,
      unit: "min",
    });

    // Immer die volle Liste zurückgeben (auch inaktive) — "Direktzugriff"/
    // "Weitere Pläne" (siehe unten im Render) filtern selbst nach aktiv/
    // inaktiv, und das Balkendiagramm oben braucht ohnehin alle Kategorien.
    return widgets;
  }, [hormonPlan, hormonErledigt, supplemente, supplementErledigt,
      mahlzeiten, mahlzeitErledigt, mealWochenplan, trainingEintraege, trainingNachDatum, trainingWochenplan, trainingTemplates,
      gewohnheiten, gewohnheitErledigt, workflowPlaene, workflowPresets, hydrationHeuteMl, hydrationZielMl, hydrationHinzufuegen,
      tageslichtHeuteMinuten, tageslichtZielMinuten, heuteItems, today, tLabel, ausnahmenNachSchluessel,
      routineSchritte, routineDurchlaeufe, tagStr]);

  // Direktzugriff (aktive Pläne) vs. Weitere Pläne (noch nicht eingerichtet)
  // — im Notfallmodus wie bisher: nur essenzielle UND tatsächlich genutzte
  // Kategorien, "Weitere Pläne" bleibt dort ganz leer (nur Basics zählen).
  const direktzugriffWidgets = isEmergencyMode ? miniWidgetData.filter((w) => w.isEssential && w.aktiv) : miniWidgetData.filter((w) => w.aktiv);
  const weiterePlaeneWidgets = isEmergencyMode ? [] : miniWidgetData.filter((w) => !w.aktiv);

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Logo size={52} />
          <div style={{ fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: 19, fontWeight: 800, letterSpacing: 0.4, color: textMuted }}>AKA</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: textMuted, marginBottom: 4 }}>
          {userName ? `${gruss}, ${userName}` : gruss}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>
          {getCoachName()} ist einsatzbereit. Was verwalten wir heute?
        </div>
      </div>

      {/* Direkter Hydration-Knopf (12.09., Nutzerin-Vorgabe): "immer, wenn
          ich was trinke, direkt auf den Knopf drücken ... und zur
          Hydration gelangen". Bewusst ganz oben, unabhängig vom
          Notfallmodus und ohne erst durch Direktzugriff/Als Nächstes
          suchen zu müssen — ein Tap führt direkt zur Hydration-Ansicht. */}
      <button
        type="button"
        className="mp-tap"
        onClick={() => onOpenView("hydration")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          marginBottom: 20,
          borderRadius: 18,
          border: "none",
          background: KATEGORIE_META.hydration.bg,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: KATEGORIE_META.hydration.dot,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="droplet" size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: KATEGORIE_META.hydration.text }}>Hydration eintragen</div>
          <div style={{ fontSize: 12, color: KATEGORIE_META.hydration.text, opacity: 0.8 }}>Getrunken? Direkt hier eintragen.</div>
        </div>
      </button>

      {!istAdminModus ? (
        <>
          <QuestsKarte quests={quests} onFortschritt={questFortschrittSpeichern} />
          <RanglisteKarte />
          <TeamKarte
            team={team}
            teamKollegen={teamKollegen}
            teamNachrichten={teamNachrichten}
            onSenden={teamNachrichtSenden}
            onGelesen={teamNachrichtGelesen}
          />
          <NachrichtAnCoachCard nachrichten={coacheeNachrichten} onSenden={coacheeNachrichtSenden} />
        </>
      ) : (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>
          Frag alles rund um deine Pläne, oder lass eine neue Gewohnheit anlegen.
        </div>
        <KiChat
          bereich="home"
          systemPrompt={HOME_SYSTEM_PROMPT_BASIS}
          einleitung={`Hi, ich bin ${getCoachName()}! Frag mich was — ich kann dir auch direkt bei jedem Bereich der App helfen, z. B. eine neue Gewohnheit anlegen, ein Supplement hinzufügen oder einen Trainingsplan aufstellen.`}
          pruefeBereitschaft={handleBereitschaftPruefen}
          onUebernehmen={handleUniverselleUebernahme}
          uebernehmenLabels={BEREICH_LABELS}
          renderErgebnis={(ergebnis) => {
            if (!ergebnis?.bereich) {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  Ich konnte noch nichts Konkretes zum Übernehmen finden — magst du genauer sagen, worum es gehen soll?
                </div>
              );
            }
            const { bereich, daten } = ergebnis;
            if (bereich === "gewohnheit") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  "{daten.name}" wurde angelegt{daten.uhrzeit ? ` · ${daten.uhrzeit} Uhr` : daten.urzeitVon ? ` · ${daten.urzeitVon}–${daten.urzeitBis} Uhr` : ""}
                  {daten.menge ? ` · ${daten.menge}` : ""}
                </div>
              );
            }
            if (bereich === "supplement") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  "{daten.name}" wurde angelegt · {daten.tageszeiten.join(", ")}
                  {daten.hinweis ? ` · ${daten.hinweis}` : ""}
                </div>
              );
            }
            if (bereich === "medikament") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  "{daten.name}" wurde angelegt · {daten.kategorie}
                  {daten.menge ? ` · ${daten.menge}` : ""}
                </div>
              );
            }
            if (bereich === "hydration") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  {daten.zielMl ? `Tagesziel auf ${daten.zielMl} ml gesetzt. ` : ""}
                  {daten.zeiten.length > 0 ? `${daten.zeiten.length} neue Erinnerungszeit${daten.zeiten.length === 1 ? "" : "en"} hinzugefügt.` : ""}
                </div>
              );
            }
            if (bereich === "tageslicht") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  Tagesziel auf {daten.zielMinuten} Minuten gesetzt.
                </div>
              );
            }
            if (bereich === "training") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  {daten.length} Einheit{daten.length === 1 ? "" : "en"} in den Wochenplan übernommen.
                </div>
              );
            }
            if (bereich === "ernaehrung") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  {daten.length} Rezept{daten.length === 1 ? "" : "e"} als Mahlzeiten angelegt.
                </div>
              );
            }
            if (bereich === "schlaf") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  Schlaf-Eintrag mit {daten.stunden} h gespeichert{daten.schlafqualitaet ? ` (${daten.schlafqualitaet})` : ""}.
                </div>
              );
            }
            if (bereich === "workflow") {
              return (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  "{daten.name}" wurde angelegt · {daten.arbeitMin} Min. Arbeit / {daten.pauseMin} Min. Pause
                  {daten.uhrzeit ? ` · ${daten.uhrzeit} Uhr` : ""}
                </div>
              );
            }
            return null;
          }}
        />
      </div>
      )}

      {/* ADHS Mode Toggle + Akutmodus-Knopf nebeneinander (16.08.,
          Nutzerinnen-Vorgabe: Notfallmodus etwas schmaler, gleich hoher,
          schmalerer Knopf daneben für "mir geht's grad nicht gut" statt
          untereinander). Akutmodus ergänzt den Notfallmodus (der nur die
          Ansicht vereinfacht) um eine aktive Lösungs-Vorschlag-Funktion —
          inkl. vorher festgelegter "Akut-Übung" aus den Gewohnheiten. */}
      <div style={{ display: "flex", gap: 10, marginBottom: akutOffen ? 12 : 18 }}>
        <div style={{ flex: 1.6 }}>
          <ADHSModeToggle isEmergencyMode={isEmergencyMode} onToggle={handleToggleEmergencyMode} compact />
        </div>
        <div style={{ flex: 1 }}>
          <AkutModusTrigger onClick={() => setAkutOffen(true)} />
        </div>
      </div>

      {akutOffen && (
        <AkutModusPanel
          onClose={() => setAkutOffen(false)}
          onSendenAnCoach={!istAdminModus ? coacheeNachrichtSenden : undefined}
          coachName={getCoachName()}
          zeigeCoachOption={!istAdminModus}
          akutUebungen={gewohnheiten.filter((g) => g.akutFavorit)}
        />
      )}

      {/* Emergency Mode Info Banner */}
      {isEmergencyMode && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: "14px",
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.3)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#D97706",
            lineHeight: "1.5",
            fontWeight: "500",
          }}
        >
          💛 <strong>Heute nur Basics:</strong> Medikamente + Wasser. Alles andere ist Bonus. Kein Druck!
        </div>
      )}

      {/* Tagesfortschritt zuerst — die Startseite ist ein Tagesassistent, kein
          Menü. Balkendiagramm statt Ring (12.09., Nutzerinnen-Vorgabe): ein
          Balken je Lebensbereich statt einer einzelnen Ring-Zahl, zeigt auf
          einen Blick, wo es heute hakt. Der frühere zweite Ring ("Routinen")
          ist weg — Gewohnheiten/Morgen-/Abendroutine stecken jetzt gleich-
          berechtigt mit allen anderen Bereichen im Direktzugriff unten. */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 4 }}>{t("home.tagesfortschritt")}</div>
        {/* Bug-Fix: statusText() gibt teils ganze Sätze zurück (z. B. "Nur
            noch zwei Aufgaben bis zum Tagesziel."), keine kurze Zahl — in
            einer Zeile nebeneinander mit dem Label lief das ineinander.
            Jetzt eigene Zeile darunter.
            Zweiter Bug-Fix: erledigtCount zählt schon im Notfallmodus nur
            die essenziellen Kategorien (aus displayItems), total kam bisher
            trotzdem aus dem ungefilterten heuteItems.length — zeigte im
            Notfallmodus einen irreführend niedrigen Bruch (z. B. "2 von 9"
            statt "2 von 3"), obwohl der Rest laut Notfallmodus bewusst
            Bonus ist. Jetzt beide aus derselben (ggf. gefilterten) Liste. */}
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>{statusText(erledigtCount, displayItems.length, lang)}</div>
        <TagesfortschrittBalken widgets={miniWidgetData} />
      </Card>

      {/* Als Nächstes/Tagesplan direkt unter dem Tagesfortschritt (12.09.,
          Nutzerinnen-Vorgabe), statt weiter unten — "Tagesplan" ist hier nur
          noch der Link zur vollen Ansicht, kein eigener großer Button mehr.
          Morgen-/Abendroutine tauchen hier jetzt mit auf, siehe
          routineAlsNaechstesItems oben. */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted }}>{t("home.alsNaechstes")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Bug-Fix: soundEnabled/handleToggleSoundEnabled existierten bereits
                (steuert den Erledigt-Ton in QuickTaskList), aber es gab nirgends
                in der App einen Schalter dafür — Ton ließ sich nie ausschalten. */}
            <button
              type="button"
              onClick={() => handleToggleSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Ton bei Erledigt-Häkchen ausschalten" : "Ton bei Erledigt-Häkchen einschalten"}
              style={{ border: "none", background: "transparent", fontSize: 15, cursor: "pointer", padding: "2px 4px", opacity: soundEnabled ? 1 : 0.4 }}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            <button
              className="mp-tap"
              onClick={() => onOpenView("tagesplan")}
              style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 0" }}
            >
              {t("home.tagesplan")}
              <span style={{ fontSize: 14 }}>›</span>
            </button>
          </div>
        </div>
        {angezeigteItems.length > 0 && (
          <Card style={{ padding: 8 }}>
            {isEmergencyMode ? (
              <QuickTaskList items={quickTasksFormatted} maxItems={4} soundEnabled={soundEnabled} />
            ) : (
              angezeigteItems.slice(0, 4).map((item, i, arr) => {
                const k = KATEGORIE_META[item.kategorie] || { dot: ROUTINE_FARBE[item.kategorie] || "#999" };
                // Morgen-/Abendroutine öffnen HIER eine Checkliste mit den
                // echten Schritten statt wegzunavigieren (12.09., Nutzerin-
                // Vorgabe) — "routine" ist der Schlüssel, den useRoutinen.js
                // erwartet ("morgen"/"abend"), nicht der kategorie-Wert.
                const routineKey = item.kategorie === "morgenroutine" ? "morgen" : item.kategorie === "abendroutine" ? "abend" : null;
                // Nutzerin-Vorgabe: die oberste Karte (nächster/überfälliger
                // Punkt) soll sich etwas abheben statt gleich groß wie der
                // Rest der Liste zu wirken.
                const istErste = i === 0;
                return (
                  <React.Fragment key={item.key}>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: istErste ? "15px 12px" : "12px 12px",
                        borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none",
                      }}
                    >
                      <button
                        className="mp-tap"
                        onClick={() => {
                          if (item.kategorie === "training") return starteTrainingVonItem(item);
                          if (routineKey) return setExpandedRoutine((prev) => (prev === routineKey ? null : routineKey));
                          return onOpenView(item.viewId || "tagesplan");
                        }}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          padding: 0,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ width: istErste ? 10 : 8, height: istErste ? 10 : 8, borderRadius: 5, background: k.dot, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: istErste ? 16 : 14, fontWeight: 700 }}>
                            {item.name} {item.uhrzeit && <span style={{ fontWeight: 600, color: textMuted, fontSize: istErste ? 13 : 12 }}>· {tLabel(item.uhrzeit)}</span>}
                          </div>
                          {item.detail && <div style={{ fontSize: istErste ? 12.5 : 11.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                        </div>
                      </button>
                      {item.bundleIds ? (
                        <button
                          className="mp-tap"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
                          }}
                          style={{
                            flexShrink: 0,
                            padding: "7px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: accentSoft,
                            color: accentDark,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {t("home.list.confirmAll")}
                        </button>
                      ) : (
                        <button
                          className="mp-tap"
                          onClick={() => {
                            if (routineKey) return setExpandedRoutine((prev) => (prev === routineKey ? null : routineKey));
                            return onOpenView(item.viewId || "tagesplan");
                          }}
                          style={{ color: textMuted, fontSize: 16, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          {routineKey ? (expandedRoutine === routineKey ? "▲" : "▼") : "›"}
                        </button>
                      )}
                    </div>
                    {routineKey && expandedRoutine === routineKey && (
                      <div style={{ padding: "0 12px 10px" }}>
                        <RoutineHeuteChecklist routine={routineKey} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </Card>
        )}
      </div>

      {/* Direktzugriff: nur die aktiven Pläne (schon eingerichtet, echte
          Daten) — Gewohnheiten/Morgen-/Abendroutine stecken jetzt mit drin,
          genau wie jede andere Kategorie. */}
      {direktzugriffWidgets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: textMuted }}>{t("home.direktzugriff")}</span>{" "}
            <span style={{ fontSize: 11, fontWeight: 600, color: textMuted }}>— {t("home.direktzugriff.desc")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
            {direktzugriffWidgets.map((widget) => (
              <MiniPlanWidget
                key={widget.kategorie}
                name={widget.name}
                dailyCount={widget.dailyCount}
                dailyTotal={widget.dailyTotal}
                weeklyCount={widget.weeklyCount}
                weeklyTotal={widget.weeklyTotal}
                kategorie={widget.kategorie}
                unit={widget.unit}
                aktiv={widget.aktiv}
                farbe={widget.farbe}
                hintergrund={widget.hintergrund}
                statusText={widget.statusText}
                onClick={() => onOpenView(widget.viewId)}
                actionLabel={widget.actionLabel}
                onAction={widget.onAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weitere Pläne: die inaktiven, noch nicht eingerichteten — klein und
          gedeckt, laden aber weiter zum Einrichten ein. */}
      {weiterePlaeneWidgets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>{t("home.weiterePlaene")}</span>{" "}
            <span style={{ fontSize: 11, color: textMuted }}>— {t("home.weiterePlaene.desc")}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {weiterePlaeneWidgets.map((widget) => (
              <button
                key={widget.kategorie}
                type="button"
                className="mp-tap"
                onClick={() => onOpenView(widget.viewId)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#F7F7F5", border: "1px dashed #D8D8D2", borderRadius: 100, padding: "6px 12px", cursor: "pointer" }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 4, background: widget.farbe || KATEGORIE_META[widget.kategorie]?.dot || "#999" }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: textMuted }}>{widget.name}</span>
                <span style={{ fontSize: 10, color: accentDark, fontWeight: 700 }}>{t("home.weiterePlaene.einrichten")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mp-ordner-grid">
        {ORDNER.map((o) => (
          <button
            key={o.id}
            className="mp-tap"
            onClick={() => onOpenView(o.id)}
            style={{
              textAlign: "left",
              borderRadius: 18,
              padding: "14px 10px",
              cursor: "pointer",
              background: "#fff",
              boxShadow: shadow,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Icon name={o.icon} size={22} color={accentDark} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{t(o.labelKey)}</div>
            <div style={{ fontSize: 10.5, color: textMuted }}>{t(o.descKey)}</div>
          </button>
        ))}
      </div>

      {trainingFehler && (
        <div
          onClick={() => setTrainingFehler(null)}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            background: "#fff",
            border: "1px solid #E8B4AE",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 12.5,
            color: "#A63B32",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            zIndex: 60,
          }}
        >
          {trainingFehler} — antippen zum Schließen.
        </div>
      )}
    </Shell>
  );
}
