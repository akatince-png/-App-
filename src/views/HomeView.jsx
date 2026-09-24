import React, { useState, useMemo } from "react";
import { Shell } from "../ui/primitives";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import MiniPlanWidget from "../ui/MiniPlanWidget";
import { useErrungenschaften } from "../data/useErrungenschaften";
import { useTagesphase } from "../utils/useTagesphase";
import { TAGESRAETSEL_ZIEL, tagesraetselHeute } from "../utils/tagesraetsel";
import { ordenFuerWidgetKategorie } from "../utils/errungenschaften";
import { widgetsFuerZeitraum, gesamtVerfuegbar, kalendertageSeit } from "../utils/zeitraumFortschritt";
import NachrichtAnCoachCard from "../ui/NachrichtAnCoachCard";
import { accentDark, accentSoft, cardBorder, hexZuRgba, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META, ROUTINE_META, TAGESRAETSEL_META } from "../utils/dayItems";
import { useTagGeschafftFeier } from "../ui/useTagGeschafftFeier";
import { ZusatzEtikett } from "../ui/Zusatzprotokolle";
import { useZusatzEtikett } from "../ui/useZusatzEtikett";
import SpielstandKarte from "../ui/SpielstandKarte";
import GehirnKarte from "../ui/GehirnKarte";
import TagesQuestsKarte from "../ui/TagesQuestsKarte";
import { useSpielFeiern } from "../ui/useSpielFeiern";
import { baueTagesQuests } from "../utils/tagesQuests";
import { statusText } from "../utils/motivation";
import { toLocalISODate, addDays, sameDay } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { useT } from "../i18n/translate";
import ADHSModeToggle from "../ui/ADHSModeToggle";
import { AkutModusPanel } from "../ui/AkutModusKarte";
import QuickTaskList from "../ui/QuickTaskList";
import { QuestsKarte } from "../ui/QuestsKarte";
import RanglisteKarte from "../ui/RanglisteKarte";
import TeamKarte from "../ui/TeamKarte";
import { getADHSMode, saveADHSMode, getSoundEnabled, saveSoundEnabled } from "../utils/adhsStorage";
import RoutineHeuteChecklist from "../ui/RoutineHeuteChecklist";
import TagebuchModal from "../ui/TagebuchModal";

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
const ROUTINE_FARBE = { morgenroutine: ROUTINE_META.morgenroutine.dot, abendroutine: ROUTINE_META.abendroutine.dot };
const ROUTINE_HINTERGRUND = { morgenroutine: ROUTINE_META.morgenroutine.bg, abendroutine: ROUTINE_META.abendroutine.bg };
// Gleiche Icon-Namen wie anderswo in der App für dieselbe Routine (siehe
// z. B. constants.js FUNKTIONEN, useRoutinen.js-Belohnung) — Morgen- und
// Abendroutine stecken nicht in KATEGORIE_META (siehe Kommentar dort),
// brauchen ihr Icon also wie Farbe/Hintergrund als eigene, kleine Map.
const ROUTINE_ICON = { morgenroutine: "sunrise", abendroutine: "moon" };
// Dunklere, besser lesbare Text-Variante von ROUTINE_FARBE (13.09.) — gleiche
// Rolle wie KATEGORIE_META[...].text gegenüber .dot, für die "Weitere
// Pläne"-Kacheln unten, die jetzt vollflächig eingefärbt sind statt nur
// einen kleinen Punkt zu zeigen.
const ROUTINE_TEXT = { morgenroutine: ROUTINE_META.morgenroutine.text, abendroutine: ROUTINE_META.abendroutine.text };


export default function HomeView({ onOpenView, onOpenTraining, onNeuesProtokoll }) {
  const { t, tLabel, lang } = useT();
  const {
    userId,
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
    denkpauseErgebnisse,
    routineEinstellungen,
    routineSchrittErledigt,
    confirmAlleTageszeit,
    toggleSupplementErledigt,
    toggleHormonErledigt,
    toggleMahlzeitErledigt,
    toggleGewohnheitErledigt,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    hydrationEintraege,
    tageslichtHeuteMinuten,
    tageslichtZielMinuten,
    tageslichtEintraege,
    bildschirmzeitHeuteMinuten,
    bildschirmzeitZielMinuten,
    schlafEintraege,
    atemuebungLogs,
    aenderungVermerken,
    aktivesHauptprotokoll,
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
  const [tagebuchOffen, setTagebuchOffen] = useState(false);

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
  // Im "Verwalten als"-Modus den Coachee begrüßen, nicht den auf diesem
  // Gerät gespeicherten Namen der Coachin (der liegt in localStorage und
  // gehört zum Gerät, nicht zum gerade verwalteten Profil).
  const userName = proband ? proband.vorname || null : typeof window !== "undefined" ? localStorage.getItem("user_name") : null;

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

  useTagGeschafftFeier(heuteItems);
  const zusatzEtikett = useZusatzEtikett();

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
  // Routinen nach Tageszeit einsortieren (Bug-Fix Dauertest 23.09.): bisher
  // standen sie immer ganz oben — eine abends noch offene Morgenroutine war
  // dann "JETZT DRAN". Jetzt nur vorne, wenn ihre Tageszeit gerade ist
  // (Morgenroutine bis 12 Uhr, Abendroutine ab 17 Uhr), sonst hinten.
  const stundeJetzt = today.getHours();
  const routineIstJetzt = (item) => (item.kategorie === "morgenroutine" ? stundeJetzt < 12 : stundeJetzt >= 17);
  // Tagesrätsel (24.09., Nutzerinnen-Wunsch): 5 gemischte Denksport-Fragen
  // als feste Tagesaufgabe — steht unter "Als Nächstes", bis sie geschafft
  // ist, und zählt im Tagesring mit. Nicht im Notfallmodus.
  const raetselHeute = tagesraetselHeute(denkpauseErgebnisse, today);
  const raetselGeschafft = raetselHeute >= TAGESRAETSEL_ZIEL;
  const raetselItems =
    isEmergencyMode || raetselGeschafft
      ? []
      : [
          {
            key: "tagesraetsel",
            name: "🧩 Tagesrätsel",
            kategorie: "tagesraetsel",
            viewId: "tagesraetsel",
            detail: raetselHeute > 0 ? `${raetselHeute} von ${TAGESRAETSEL_ZIEL} Fragen gelöst` : `${TAGESRAETSEL_ZIEL} kurze Fragen, gemischt`,
            uhrzeit: "",
            done: false,
          },
        ];
  const angezeigteItems = [
    ...routineAlsNaechstesItems.filter(routineIstJetzt),
    ...gruppiereFuerAlsNaechstes(offeneItems, t, tLabel),
    ...raetselItems,
    ...routineAlsNaechstesItems.filter((item) => !routineIstJetzt(item)),
  ];

  // Ein-Tipp-Erledigen direkt auf Home (UX-Review 23.09.): bisher führte
  // jeder Punkt unter "Als Nächstes" (außer Supplement-Bündeln) erst in den
  // Tagesplan — auch im Notfallmodus. Für alles, was sich ohne weitere
  // Angaben abhaken lässt, reicht jetzt ein Tipp; Training und Routinen
  // öffnen weiterhin ihren eigenen Ablauf. Log-Schlüssel wie in
  // buildDayItems(): immer die ursprünglich geplante Uhrzeit.
  const direktErledigbar = (item) =>
    !item.done &&
    ((item.kategorie === "supplement" && item.raw?.id) || (item.kategorie === "hormon" && item.raw?.name) || (item.kategorie === "mahlzeit" && item.refId) || (item.kategorie === "gewohnheit" && item.raw?.id));
  const direktErledigen = (item) => {
    const zeit = item.originalUhrzeit ?? item.uhrzeit;
    if (item.kategorie === "supplement") return toggleSupplementErledigt(tagStr, item.raw.id, zeit);
    if (item.kategorie === "hormon") return toggleHormonErledigt(tagStr, item.raw.name, zeit);
    if (item.kategorie === "mahlzeit") return toggleMahlzeitErledigt(tagStr, item.refId, item.logZeit ?? zeit);
    if (item.kategorie === "gewohnheit") return toggleGewohnheitErledigt(tagStr, item.raw.id);
    return undefined;
  };

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
      } else if (direktErledigbar(item)) {
        direktErledigen(item);
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
        icon: ROUTINE_ICON[kategorie],
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
    // Standard gesetzt wurde. Bug-Fix (12.09., Nutzerin-Bericht): "!== 2500"
    // allein reichte nicht — ein Ziel von 0 (z. B. durch Eintippen von "0" ins
    // normale Ziel-Feld + Speichern, statt über "Ziel zurücksetzen") galt
    // damit fälschlich weiterhin als aktiv. 0 zählt jetzt ebenfalls als
    // "nicht konfiguriert", genau wie der Standardwert.
    widgets.push({
      name: tLabel("Wasser"),
      kategorie: "hydration",
      viewId: "hydration",
      aktiv: hydrationHeuteMl > 0 || (hydrationZielMl > 0 && hydrationZielMl !== 2500),
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
      aktiv: tageslichtHeuteMinuten > 0 || (tageslichtZielMinuten > 0 && tageslichtZielMinuten !== 30),
      dailyCount: Math.min(tageslichtHeuteMinuten, tageslichtZielMinuten),
      dailyTotal: tageslichtZielMinuten || 1,
      weeklyCount: 0,
      weeklyTotal: 1,
      isEssential: false,
      unit: "min",
    });

    // Bildschirmzeit — gleicher Aufbau wie Tageslicht, Standard-Limit 60
    // Minuten (siehe 0086_bildschirmzeit.sql). Anders als bei allen anderen
    // Mini-Widgets ist "dailyCount/dailyTotal" hier eine Obergrenze statt
    // eines Mindestziels — der Balken füllt sich also mit "verbrauchtem
    // Budget", nicht mit Fortschritt zu einem wünschenswerten Zustand.
    widgets.push({
      name: tLabel("Bildschirmzeit"),
      kategorie: "bildschirmzeit",
      viewId: "bildschirmzeit",
      aktiv: bildschirmzeitHeuteMinuten > 0 || (bildschirmzeitZielMinuten > 0 && bildschirmzeitZielMinuten !== 60),
      dailyCount: Math.min(bildschirmzeitHeuteMinuten, bildschirmzeitZielMinuten),
      dailyTotal: bildschirmzeitZielMinuten || 1,
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
      tageslichtHeuteMinuten, tageslichtZielMinuten, bildschirmzeitHeuteMinuten, bildschirmzeitZielMinuten,
      heuteItems, today, tLabel, ausnahmenNachSchluessel,
      routineSchritte, routineDurchlaeufe, tagStr]);

  // Quelldaten fürs Erfolge-/Orden-System (13.09., Nutzerinnen-Vorgabe:
  // rechts neben dem Tagesfortschritt-Balkendiagramm sollen die nächsten/
  // potenziellen Orden je eingerichtetem Bereich auftauchen, siehe
  // TagesfortschrittOrden.jsx) — derselbe Feld-Satz wie in ErfolgeTab.jsx,
  // damit ein Orden hier exakt dann farbig wird, wenn es das auch im
  // Archiv-Reiter "Erfolge" ist. useErrungenschaften() vergibt/speichert
  // neu erreichte Orden als Nebeneffekt (Supabase-Upsert) — dadurch werden
  // Orden jetzt schon beim Öffnen von Home vergeben, nicht erst nach einem
  // Besuch im Erfolge-Reiter.
  const errungenschaftenQuellen = useMemo(
    () => ({
      supplementErledigt, mahlzeitErledigt, hormonErledigt, gewohnheitErledigt, trainingEintraege, routineDurchlaeufe,
      schlafEintraege, atemuebungLogs, hydrationEintraege, hydrationZielMl, tageslichtEintraege, tageslichtZielMinuten,
    }),
    [supplementErledigt, mahlzeitErledigt, hormonErledigt, gewohnheitErledigt, trainingEintraege, routineDurchlaeufe,
      schlafEintraege, atemuebungLogs, hydrationEintraege, hydrationZielMl, tageslichtEintraege, tageslichtZielMinuten]
  );
  const { kategorien: ordenKategorien, verdiente: ordenVerdiente, gesamtPunkte, globalerStreak, ladend: ordenLadend, neueBadgeKeys } = useErrungenschaften(userId, errungenschaftenQuellen);
  useSpielFeiern({ userId, gesamtPunkte, ladend: ordenLadend, neueBadgeKeys });
  const tagesQuests = useMemo(
    () => baueTagesQuests({ items: heuteItems, hydrationHeuteMl, hydrationZielMl, raetselHeute, raetselZiel: TAGESRAETSEL_ZIEL }),
    [heuteItems, hydrationHeuteMl, hydrationZielMl, raetselHeute]
  );
  const raetselZaehlt = !isEmergencyMode && raetselGeschafft ? 1 : 0;

  // Zeitraum-Auswahl fürs Tagesfortschritt-Balkendiagramm (16.09.,
  // Nutzerinnen-Vorgabe): "die Möglichkeit, zwischen Wochen- und
  // Monatsdiagramm noch weiter zu wählen ... auch ich als Coach, wenn ich
  // beim Coachee reingehe" — funktioniert im Verwalten-Modus automatisch
  // mit, weil HomeView dieselbe Komponente für beide ist und useAppData()
  // dann schon auf den verwalteten Account zeigt. "Gesamt" (ganze
  // Protokolllaufzeit) erscheint erst, wenn das Protokoll wirklich länger
  // als einen Monat läuft (sonst wäre es nur eine Dopplung von "Monat").
  const [zeitraum, setZeitraum] = useState("tag"); // "tag" | "woche" | "monat" | "gesamt"
  const zeigeGesamtOption = gesamtVerfuegbar(aktivesHauptprotokoll?.startdatum);
  // Fällt auf "monat" zurück, falls "gesamt" gewählt war und die Option
  // inzwischen nicht mehr zutrifft (z. B. neues, frisches Protokoll) —
  // sonst würde ein leerer/falscher Zustand hängen bleiben.
  const effektiverZeitraum = zeitraum === "gesamt" && !zeigeGesamtOption ? "monat" : zeitraum;
  // Tagesphase für die Stimmung der Gehirn-Karte (Morgen/Tag/Nacht, 24.09.)
  // — minütlich neu geprüft, damit sie bei offener App von selbst wechselt.
  const phase = useTagesphase({ routineDurchlaeufe, routineSchritte, routineEinstellungen });

  // Länge des gewählten Zeitraums in Tagen — für die Gehirn-Ladung der
  // Bereiche ohne eigenen Balken (Schlaf, Atemübungen, Denkpause).
  const zeitraumTage =
    effektiverZeitraum === "tag"
      ? 1
      : effektiverZeitraum === "woche"
        ? 7
        : effektiverZeitraum === "monat"
          ? 30
          : aktivesHauptprotokoll?.startdatum
            ? Math.max(1, kalendertageSeit(aktivesHauptprotokoll.startdatum, today) + 1)
            : 30;
  const zeitraumWidgets = useMemo(
    () => widgetsFuerZeitraum(effektiverZeitraum, miniWidgetData, errungenschaftenQuellen, aktivesHauptprotokoll?.startdatum),
    [effektiverZeitraum, miniWidgetData, errungenschaftenQuellen, aktivesHauptprotokoll]
  );

  // Direktzugriff (aktive Pläne) vs. Weitere Pläne (noch nicht eingerichtet)
  // — im Notfallmodus wie bisher: nur essenzielle UND tatsächlich genutzte
  // Kategorien, "Weitere Pläne" bleibt dort ganz leer (nur Basics zählen).
  const direktzugriffWidgets = isEmergencyMode ? miniWidgetData.filter((w) => w.isEssential && w.aktiv) : miniWidgetData.filter((w) => w.aktiv);
  const weiterePlaeneWidgets = isEmergencyMode ? [] : miniWidgetData.filter((w) => !w.aktiv);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Logo size={44} />
        <div style={{ fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: 0.4, color: textMuted }}>AKA</div>
      </div>

      {/* Spielstand ganz oben (UX-Umbau 23.09., Nutzerinnen-Wunsch "mehr
          Spielcharakter"): Tagesring + Serie + Punkte + Level in einer
          Karte, ersetzt die bisherige reine Text-Begrüßung. */}
      <SpielstandKarte
        gruss={userName ? `${gruss}, ${userName} 👋` : `${gruss} 👋`}
        statusZeile={statusText(erledigtCount + raetselZaehlt, displayItems.length + (isEmergencyMode ? 0 : 1), lang)}
        erledigt={erledigtCount + raetselZaehlt}
        gesamt={displayItems.length + (isEmergencyMode ? 0 : 1)}
        punkte={gesamtPunkte}
        serie={globalerStreak}
        onOpenErfolge={() => onOpenView("erfolge")}
      />

      {/* "Jetzt dran"/Als Nächstes direkt unter dem Spielstand (23.09.) —
          eine Sache zur Zeit, vor allen Zusatz-Kacheln. */}
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
          // Kasten-Stil (23.09.): jeder Punkt als eigener Kasten mit
          // kräftigem Rand in seiner Bereichsfarbe — wie im Tagesplan und
          // auf den Bereichsseiten, damit sich Farbe = Bereich einprägt.
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isEmergencyMode ? (
              <QuickTaskList items={quickTasksFormatted} maxItems={4} soundEnabled={soundEnabled} />
            ) : (
              angezeigteItems.slice(0, 4).map((item, i) => {
                const k = KATEGORIE_META[item.kategorie] || ROUTINE_META[item.kategorie] || (item.kategorie === "tagesraetsel" ? TAGESRAETSEL_META : null) || { dot: "#8A8F96", bg: "#F4F5F4", text: textMuted };
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
                        padding: istErste ? "15px 14px" : "11px 14px",
                        borderRadius: 16,
                        border: `2px solid ${k.dot}`,
                        background: k.bg,
                        // "Jetzt dran": der oberste Punkt etwas größer und
                        // mit leichtem Schein in seiner Farbe.
                        boxShadow: istErste ? `0 6px 16px ${hexZuRgba(k.dot, 0.22)}` : "none",
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
                          {istErste && (
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: k.text || textMuted, marginBottom: 2 }}>JETZT DRAN</div>
                          )}
                          <div style={{ fontSize: istErste ? 16 : 14, fontWeight: 700 }}>
                            {item.name} {item.uhrzeit && <span style={{ fontWeight: 600, color: textMuted, fontSize: istErste ? 13 : 12 }}>· {tLabel(item.uhrzeit)}</span>}
                            <ZusatzEtikett name={zusatzEtikett(item)} />
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
                      ) : direktErledigbar(item) ? (
                        <button
                          type="button"
                          className="mp-tap"
                          aria-label={`${item.name} erledigt`}
                          onClick={(e) => {
                            e.stopPropagation();
                            direktErledigen(item);
                          }}
                          style={
                            istErste
                              ? { flexShrink: 0, padding: "10px 14px", borderRadius: 12, border: "none", background: k.dot, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }
                              : { flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: `2px solid ${k.dot}`, background: "#fff", color: k.dot, fontSize: 15, fontWeight: 800, cursor: "pointer" }
                          }
                        >
                          {istErste ? "✓ Erledigt" : "✓"}
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
          </div>
        )}
      </div>

      {/* Spiel-Ausbau 23.09.: automatische Tages-Quests + "Dein Gehirn"
          direkt unter "Als Nächstes" — für alle, auch im Admin-Modus. */}
      {!isEmergencyMode && <TagesQuestsKarte quests={tagesQuests} onOpenView={onOpenView} />}
      {/* Gehirn + Tagesfortschritt in einer Karte (23.09.) — auch im
          Notfallmodus, wie vorher das Tagesfortschritt-Diagramm. */}
      <GehirnKarte
        kategorien={ordenKategorien}
        widgets={zeitraumWidgets}
        zeitraum={effektiverZeitraum}
        setZeitraum={setZeitraum}
        tage={zeitraumTage}
        zeigeGesamt={zeigeGesamtOption}
        onOpenErfolge={() => onOpenView("erfolge")}
        onDenksport={() => onOpenView("denksport")}
        onOpenView={onOpenView}
        onWasser={() => onOpenView("hydration")}
        onAkut={() => setAkutOffen(true)}
        phase={phase}
      />

      {akutOffen && (
        <AkutModusPanel
          onClose={() => setAkutOffen(false)}
          onSendenAnCoach={!istAdminModus ? coacheeNachrichtSenden : undefined}
          coachName={getCoachName()}
          zeigeCoachOption={!istAdminModus}
          akutUebungen={gewohnheiten.filter((g) => g.akutFavorit)}
        />
      )}

      {/* Notfallmodus-Umschalter: eigene volle Zeile (13.09., Nutzerin-
          Vorgabe) — vorher schmal neben dem Akutmodus-Knopf, der jetzt
          stattdessen oben neben Hydration sitzt (beides häufigere
          Schnellaktionen). Der Umschalter selbst wird seltener gebraucht,
          bekommt deshalb wieder seine volle, ausführlichere Darstellung
          statt der schmalen `compact`-Variante — Design wird bei
          Gelegenheit noch weiter überarbeitet. */}
      <div style={{ marginBottom: 18 }}>
        <ADHSModeToggle isEmergencyMode={isEmergencyMode} onToggle={handleToggleEmergencyMode} />
      </div>

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


      {/* Quests/Rangliste/Team/Coach-Nachricht: bewusst HIER statt ganz oben
          (App-Bauplan-Punkt, "Startseite entschlacken") — standen vorher
          direkt zwischen den Schnellaktionen und dem eigentlichen
          Tagesfortschritt/"Als Nächstes", verdeckten also genau den Teil,
          den man als Erstes braucht ("Was steht heute an?"). Home ist ein
          Tagesassistent, kein Menü (siehe Kommentar bei "Als Nächstes" oben)
          — das gilt auch für die Reihenfolge: Aufgaben zuerst, Motivations-/
          Team-Bausteine danach. Bleiben vollständig erhalten, nur weiter
          unten statt im Weg. */}
      {!istAdminModus && (
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
      )}

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
                orden={ordenFuerWidgetKategorie(widget.kategorie, ordenKategorien, ordenVerdiente)}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 8 }}>
            {weiterePlaeneWidgets.map((widget) => {
              // Bug-Fix/Verbesserung (13.09., Nutzerin-Vorgabe): vorher nur
              // ein winziger 7px-Punkt in der Kategorie-Farbe — kaum zu
              // erkennen, und half nicht dabei, die Farben mit dem
              // Tagesfortschritt-Balkendiagramm oben zu verknüpfen. Jetzt
              // trägt die ganze Kachel Hintergrund- und Textfarbe der
              // Kategorie. Grid statt Flex-Wrap (13.09., Nutzerin-Vorgabe):
              // unterschiedlich breite Pillen liefen auf dem Handy nur noch
              // 1 pro Zeile untereinander — mit gleich breiten Kacheln
              // ordnen sie sich stattdessen sauber in Reihen.
              const bg = widget.hintergrund || KATEGORIE_META[widget.kategorie]?.bg || "#F7F7F5";
              const textFarbe = ROUTINE_TEXT[widget.kategorie] || KATEGORIE_META[widget.kategorie]?.text || textMuted;
              return (
                <button
                  key={widget.kategorie}
                  type="button"
                  className="mp-tap"
                  onClick={() => onOpenView(widget.viewId)}
                  style={{ textAlign: "left", background: bg, border: "none", borderRadius: 14, padding: "9px 12px", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: textFarbe }}>{widget.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textFarbe, opacity: 0.75 }}>{t("home.weiterePlaene.einrichten")}</div>
                </button>
              );
            })}
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
        {/* Tagebuch (13.09., Nutzerin-Vorgabe): gleichgroße Kachel wie die
            Ordner oben, öffnet TagebuchModal.jsx. Der Text selbst verlässt
            das Gerät nie in Richtung Supabase (Datenschutz-Vorgabe) —
            Details dazu in TagebuchModal.jsx/tagebuchStorage.js. */}
        <button
          type="button"
          className="mp-tap"
          onClick={() => setTagebuchOffen(true)}
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
            <Icon name="book" size={22} color={accentDark} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>Tagebuch</div>
          <div style={{ fontSize: 10.5, color: textMuted }}>Frei schreiben</div>
        </button>
        {/* Denksport nach Wunsch (23.09.): 800 Aufgaben in 4 Kategorien. */}
        <button
          type="button"
          className="mp-tap"
          onClick={() => onOpenView("denksport")}
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
          <div style={{ marginBottom: 8, fontSize: 20, lineHeight: "22px" }}>🧩</div>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>Denksport</div>
          <div style={{ fontSize: 10.5, color: textMuted }}>Rätsel & Quiz</div>
        </button>
        {/* "Neues Protokoll" (13.09., Nutzerin-Vorgabe): ersetzt den
            früheren schwebenden runden "+"-Knopf oben rechts (Fab.jsx) —
            fiel dort kaum auf und führte wiederholt dazu, dass die
            Nutzerin ihn nicht fand und die App für weniger vollständig
            hielt, als sie ist. Jetzt als vierte Kachel direkt neben den
            Ordnern, gleiche Größe/Form (nicht mehr rund, damit es nicht
            wie ein deplatziertes Icon zwischen den eckigen Kacheln wirkt),
            bewusst in Blau statt Weiß, damit sofort erkennbar bleibt, dass
            sie etwas anderes tut als die drei Ordner. */}
        {istAdminModus && (
          <button
            type="button"
            className="mp-tap"
            onClick={onNeuesProtokoll}
            style={{
              textAlign: "left",
              borderRadius: 18,
              padding: "14px 10px",
              cursor: "pointer",
              background: accentDark,
              boxShadow: shadow,
              border: "none",
              color: "#fff",
            }}
          >
            <div style={{ marginBottom: 8, fontSize: 22, fontWeight: 800, lineHeight: "22px" }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>Neues Protokoll</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>Von vorn beginnen</div>
          </button>
        )}
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

      {tagebuchOffen && <TagebuchModal onClose={() => setTagebuchOffen(false)} onOpenArchiv={() => onOpenView("tagebuch")} />}
    </Shell>
  );
}
