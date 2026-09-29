import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Shell } from "../ui/primitives";
import Logo from "../ui/Logo";
import { useErrungenschaften } from "../data/useErrungenschaften";
import { useTagesphase } from "../utils/useTagesphase";
import { TAGESRAETSEL_ZIEL, tagesraetselHeute } from "../utils/tagesraetsel";
import { questFortschritt, werHatHeute } from "../data/gruppenprotokoll";
import { widgetsFuerZeitraum, gesamtVerfuegbar, kalendertageSeit } from "../utils/zeitraumFortschritt";
import { accentSoft, cardBorder, fontHeading, hexZuRgba, textMain, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META, ROUTINE_META, TAGESRAETSEL_META, ATEM_META } from "../utils/dayItems";
import { ATEM_START_KEY, atemZeitenHeute, uebungFuerKey } from "../utils/atemBibliothek";
import { aktuelleSession } from "../data/useAtemSessions";
import FokusGemeinsamKarte from "../ui/FokusGemeinsamKarte";
import { useTagGeschafftFeier } from "../ui/useTagGeschafftFeier";
import { ZusatzEtikett } from "../ui/Zusatzprotokolle";
import { useZusatzEtikett } from "../ui/useZusatzEtikett";
import { SpielstandReihe } from "../ui/SpielstandKarte";
import GehirnKarte from "../ui/GehirnKarte";
import TagesQuestsKarte from "../ui/TagesQuestsKarte";
import { useSpielFeiern } from "../ui/useSpielFeiern";
import { baueTagesQuests } from "../utils/tagesQuests";
import { toLocalISODate, addDays, sameDay, verspaetungText } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { useT } from "../i18n/translate";
import { AkutModusPanel } from "../ui/AkutModusKarte";
import { getCoachName } from "../utils/coachStorage";
import QuickTaskList from "../ui/QuickTaskList";
import { QuestsKarte } from "../ui/QuestsKarte";
import RanglisteKarte from "../ui/RanglisteKarte";
import RoutineZeitHinweisKarte from "../ui/RoutineZeitHinweisKarte";
import SchichtHeuteKarte from "../ui/SchichtHeuteKarte";
import KernprogrammKarte from "../ui/KernprogrammKarte";
import LaufenderTimerKarte from "../ui/TimerRing";
import Top3Karte from "../ui/Top3Karte";
import WochenCheckKarte from "../ui/WochenCheckKarte";
import TeamKarte from "../ui/TeamKarte";
import { getADHSMode, saveADHSMode, getSoundEnabled, saveSoundEnabled } from "../utils/adhsStorage";
import RoutineHeuteChecklist from "../ui/RoutineHeuteChecklist";
import RoutineAblauf from "../ui/RoutineAblauf";

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


// Startseite schlicht (29.09., Nutzerin): nur das Nötigste auf Home.
const STARTSEITE_SCHLICHT = true;

export default function HomeView({ onOpenView, onOpenTraining }) {
  const { t, tLabel } = useT();
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
    kognitivErgebnisse,
    atemZeiten,
    atemuebungen,
    atemSessions,
    eigeneGruppenLogs,
    eigeneFokusSitzungen,
    alltagEintraege,
    alltagErledigt,
    gruppenprotokolle,
    gruppenBausteinUmschalten,
    gruppenprotokolleNeuLaden,
    routineEinstellungen,
    routineSchrittErledigt,
    routineDurchlaufSpeichern,
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
    coacheeNachrichtenNeuLaden,
    quests,
    questFortschrittSpeichern,
    team,
    teamKollegen,
    teamNachrichten,
    teamNachrichtSenden,
    teamNachrichtGelesen,
  } = useAppData();
  // Gruppenprotokoll-Stand beim Öffnen der Startseite auffrischen
  // (Gruppen-Quest-Karte), siehe TeamView.
  useEffect(() => {
    gruppenprotokolleNeuLaden?.();
    // Coach-Chat (24.09.): nach dem Lesen im Chat soll der Hinweis oben weg sein.
    coacheeNachrichtenNeuLaden?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ungeleseneCoachNachrichten = (coacheeNachrichten || []).filter((n) => n.absender === "coach" && !n.gelesen);
  const { proband } = useAdmin();
  // Coach-verwaltetes Modell (13.08.): Coachees sehen hier statt des
  // KI-Assistenten eine einfache Nachricht-an-den-Coach-Karte (siehe
  // Chat-Karte unten) — dieselbe istAdminModus-Logik wie in
  // KiChat.jsx/OnboardingFlow.jsx/AuthenticatedApp.jsx.
  const istAdminModus = proband !== null || isAdmin;

  // ADHS Mode State
  const [isEmergencyMode, setIsEmergencyMode] = useState(() => getADHSMode());
  const [akutOffen, setAkutOffen] = useState(false);
  const [spieleOffen, setSpieleOffen] = useState(false);
  // Routine direkt von der Startseite starten (29.09., Nutzerin: „die
  // Stoppuhr muss man sofort finden“): "morgen"/"abend" öffnet den
  // geführten Ablauf wie im Tagesplan, null = normale Startseite.
  const [ablaufRoutine, setAblaufRoutine] = useState(null);
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
  // Gruppenprotokoll (24.09.): eigene Gruppen-Gewohnheiten des Teams, die
  // heute noch offen sind — mit Team-Kennzeichen und wer schon dran war.
  const gruppenItems = isEmergencyMode
    ? []
    : (gruppenprotokolle || []).filter((gp) => !gp.abgelaufen).flatMap((gp) =>
        gp.bausteine
          .filter((b) => b.art === "eigen" && !(eigeneGruppenLogs || []).some((l) => l.bausteinId === b.id && l.datum === tagStr))
          .map((b) => {
            const wer = werHatHeute(gp.stand, b.id, tagStr);
            return {
              key: `gruppe-${b.id}`,
              name: `${b.icon || "🌱"} ${b.name}`,
              kategorie: "gruppe",
              viewId: "team",
              detail: `👥 ${gp.name}${wer.length ? ` · ${wer.length} von ${gp.stand.mitglieder.length} schon ✓` : ""}`,
              uhrzeit: "",
              done: false,
              bausteinId: b.id,
            };
          })
      );
  // Feste Atem-Zeiten (25.09.): offene Atem-Pausen von heute, nach Uhrzeit
  // zwischen die übrigen Punkte sortiert; Antippen startet die Übung.
  const atemItems = isEmergencyMode
    ? []
    : atemZeitenHeute(atemZeiten, atemuebungLogs, today)
        .filter((z) => !z.erledigt)
        .map((z) => {
          const u = uebungFuerKey(z.uebungKey, atemuebungen);
          return {
            key: `atem-${z.id}`,
            name: `🌬️ Atem-Pause`,
            kategorie: "atem",
            viewId: "atemuebungen",
            atemKey: z.uebungKey,
            detail: `${u?.name || "Atemübung"} · ${z.dauerMinuten} Min.`,
            uhrzeit: z.uhrzeit,
            done: false,
          };
        });
  const zeitZuMin = (u) => (u ? Number(u.slice(0, 2)) * 60 + Number(u.slice(3, 5)) : null);
  const jetztMin = today.getHours() * 60 + today.getMinutes();
  const atemJetzt = atemItems.filter((a) => zeitZuMin(a.uhrzeit) <= jetztMin + 30);
  const atemSpaeter = atemItems.filter((a) => zeitZuMin(a.uhrzeit) > jetztMin + 30);
  const atemStarten = (key) => {
    try {
      sessionStorage.setItem(ATEM_START_KEY, key);
    } catch {
      // ohne Speicher öffnet sich einfach die Atem-Seite
    }
  };
  const angezeigteItems = [
    ...routineAlsNaechstesItems.filter(routineIstJetzt),
    ...atemJetzt,
    ...gruppiereFuerAlsNaechstes(offeneItems, t, tLabel),
    ...atemSpaeter,
    ...gruppenItems,
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
    (item.kategorie === "gruppe" ||
      (item.kategorie === "supplement" && item.raw?.id) || (item.kategorie === "hormon" && item.raw?.name) || (item.kategorie === "mahlzeit" && item.refId) || (item.kategorie === "gewohnheit" && item.raw?.id));
  // Tagesprotokoll (24.09.): Abhaken auf der Startseite landet wie im
  // Tagesplan und auf den Kategorie-Seiten als "erledigt" im Protokoll.
  const protokolliereErledigt = (kategorie, name, zeit) => {
    if (name) aenderungVermerken({ kategorie, itemName: name, aktion: "erledigt", detail: verspaetungText(zeit) || "" });
  };
  const direktErledigen = (item) => {
    const zeit = item.originalUhrzeit ?? item.uhrzeit;
    if (item.kategorie === "gruppe") return gruppenBausteinUmschalten(item.bausteinId, tagStr);
    if (["supplement", "hormon", "mahlzeit", "gewohnheit"].includes(item.kategorie)) protokolliereErledigt(item.kategorie, item.raw?.name, item.logZeit ?? zeit);
    if (item.kategorie === "supplement") return toggleSupplementErledigt(tagStr, item.raw.id, zeit);
    if (item.kategorie === "hormon") return toggleHormonErledigt(tagStr, item.raw.name, zeit);
    if (item.kategorie === "mahlzeit") return toggleMahlzeitErledigt(tagStr, item.refId, item.logZeit ?? zeit);
    if (item.kategorie === "gewohnheit") return toggleGewohnheitErledigt(tagStr, item.raw.id);
    return undefined;
  };
  const buendelErledigen = (item) => {
    (supplemente || []).filter((sp) => item.bundleIds.includes(sp.id)).forEach((sp) => protokolliereErledigt("supplement", sp.name, item.uhrzeit));
    return confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
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
        buendelErledigen(item);
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
      // Bug-Fix 24.09. (Dauertest mit Team-Seite gefunden): fehlte hier —
      // Home zählte Tagesrätsel-/Denkpause-Punkte nie mit, Erfolge-Reiter
      // und Team-Seite schon (unterschiedliche Punktestände).
      denkpauseErgebnisse,
      kognitivErgebnisse,
      eigeneGruppenLogs,
      eigeneFokusSitzungen,
      alltagEintraege,
      alltagErledigt,
    }),
    [supplementErledigt, mahlzeitErledigt, hormonErledigt, gewohnheitErledigt, trainingEintraege, routineDurchlaeufe,
      schlafEintraege, atemuebungLogs, hydrationEintraege, hydrationZielMl, tageslichtEintraege, tageslichtZielMinuten, denkpauseErgebnisse, kognitivErgebnisse, eigeneGruppenLogs, eigeneFokusSitzungen, alltagEintraege, alltagErledigt]
  );
  const { kategorien: ordenKategorien, gesamtPunkte, globalerStreak, ladend: ordenLadend, neueBadgeKeys } = useErrungenschaften(userId, errungenschaftenQuellen);
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

  // Als-Nächstes-Liste als Baustein (24.09.): steht jetzt im weißen Feld
  // der großen Karte oben (siehe kartenMitte). "Tagesplan ›" führt zur
  // vollen Liste; Morgen-/Abendroutine sind mit drin (routineAlsNaechstesItems).
  const renderAlsNaechstes = ({ max = 4, eingebettet = false } = {}) => (
      <div style={{ marginBottom: eingebettet ? 0 : 20 }}>
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
              style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--mp-accent-dark-text)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 0" }}
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
              angezeigteItems.slice(0, max).map((item, i) => {
                const k = KATEGORIE_META[item.kategorie] || ROUTINE_META[item.kategorie] || (item.kategorie === "tagesraetsel" ? TAGESRAETSEL_META : item.kategorie === "gruppe" ? KATEGORIE_META.gewohnheit : item.kategorie === "atem" ? ATEM_META : null) || { dot: "#8A8F96", bg: "#F4F5F4", text: textMuted };
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
                        // Design 2.0 (29.09., „wirkt alt“): kein dicker Rahmen
                        // mehr, sondern zarte Fläche mit Farbstreifen links.
                        border: "none",
                        borderLeft: `4px solid ${k.dot}`,
                        background: k.bg,
                        boxShadow: istErste ? `0 4px 14px ${hexZuRgba(k.dot, 0.14)}` : "none",
                      }}
                    >
                      <button
                        className="mp-tap"
                        onClick={() => {
                          if (item.kategorie === "training") return starteTrainingVonItem(item);
                          if (routineKey) return setExpandedRoutine((prev) => (prev === routineKey ? null : routineKey));
                          if (item.atemKey) atemStarten(item.atemKey);
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
                          color: "inherit",
                          fontFamily: "inherit",
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
                            buendelErledigen(item);
                          }}
                          style={{
                            flexShrink: 0,
                            padding: "7px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: accentSoft,
                            color: "var(--mp-accent-dark-text)",
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
                              : { flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: `2px solid ${k.dot}`, background: "var(--mp-karte)", color: k.dot, fontSize: 15, fontWeight: 800, cursor: "pointer" }
                          }
                        >
                          {istErste ? "✓ Erledigt" : "✓"}
                        </button>
                      ) : (
                        <button
                          className="mp-tap"
                          onClick={() => {
                            if (routineKey) return setExpandedRoutine((prev) => (prev === routineKey ? null : routineKey));
                            if (item.atemKey) atemStarten(item.atemKey);
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
  );

  // "Jetzt dran" in der großen Karte (24.09., Nutzerinnen-Wahl "B" aus
  // drei Vorschauen): die nächste Aufgabe groß in einem weißen Feld, damit
  // sie sich vom farbigen Kartenhintergrund klar abhebt; die folgenden als
  // kleine Chips in ihrer Bereichsfarbe. Die volle Liste steht im Tagesplan.
  const weissesFeld = (kinder) => (
    <div style={{ background: "var(--mp-karte)", color: textMain, borderRadius: 22, padding: 14, border: "1px solid rgba(16, 24, 40, 0.05)", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 24px rgba(16, 24, 40, 0.06)" }}>{kinder}</div>
  );
  const naechsteChips = angezeigteItems.slice(1, 4);
  const kartenMitte = weissesFeld(
    <>
      {renderAlsNaechstes({ max: 1, eingebettet: true })}
      {angezeigteItems.length === 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: textMuted, padding: "4px 2px" }}>Für heute ist alles erledigt 🎉</div>}
      {naechsteChips.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>Danach:</span>
          {naechsteChips.map((item) => {
            const k = KATEGORIE_META[item.kategorie] || ROUTINE_META[item.kategorie] || (item.kategorie === "tagesraetsel" ? TAGESRAETSEL_META : item.kategorie === "gruppe" ? KATEGORIE_META.gewohnheit : item.kategorie === "atem" ? ATEM_META : null) || { dot: "#8A8F96", bg: "#F4F5F4", text: textMuted };
            return (
              <button
                key={item.key}
                type="button"
                className="mp-tap"
                onClick={() => {
                  if (item.kategorie === "training") return starteTrainingVonItem(item);
                  if (item.atemKey) atemStarten(item.atemKey);
                  return onOpenView(item.viewId || "tagesplan");
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 99, border: "none", background: k.bg, color: k.text, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 4, background: k.dot }} />
                {item.name}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  if (ablaufRoutine) {
    return (
      <RoutineAblauf
        routine={ablaufRoutine}
        schritte={routineSchritte.filter((x) => x.routine === ablaufRoutine).sort((x, y) => x.reihenfolge - y.reihenfolge)}
        onAbschluss={() => setAblaufRoutine(null)}
        onAbbrechen={() => setAblaufRoutine(null)}
        routineDurchlaufSpeichern={routineDurchlaufSpeichern}
      />
    );
  }

  return (
    <Shell>
      {/* Design 2.0 (28.09.): große Begrüßung mit Datum statt Logo-Zeile;
          rechts das Logo als kleines Markenzeichen. */}
      <div data-home-kopf style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "4px 2px 16px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: textMuted }}>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 style={{ fontFamily: fontHeading, fontSize: 27, fontWeight: 800, letterSpacing: -0.6, margin: "2px 0 0", lineHeight: 1.15 }}>{userName ? `${gruss}, ${userName}` : gruss}</h1>
        </div>
        <Logo size={40} />
      </div>

      {!STARTSEITE_SCHLICHT && (
      <>
      {/* Coach-Chat (24.09., Nutzerinnen-Freigabe der Vorschau): ungelesene
          Nachricht vom Coach steht ganz oben, antippen öffnet den Chat.
          Vorher lag sie bei ~78 % der Seitenhöhe unter dem Eingabefeld. */}
      {!istAdminModus && ungeleseneCoachNachrichten.length > 0 && (
        <button
          type="button"
          className="mp-tap"
          onClick={() => onOpenView("coach-chat")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "color-mix(in srgb, #FFF6E0 var(--mp-flaeche), var(--mp-karte))", border: "2px solid color-mix(in srgb, #F2C94C var(--mp-flaeche), var(--mp-rand-dunkel))", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 99, background: "var(--mp-karte)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧑‍🏫</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 900, fontSize: 14 }}>Dein Coach hat geschrieben</span>
            <span style={{ display: "block", fontSize: 13, color: "color-mix(in srgb, #4A5170 var(--mp-schrift), var(--mp-schrift-hell))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              „{ungeleseneCoachNachrichten[0].text}“
            </span>
          </span>
          <span style={{ background: "#E0352B", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px", flexShrink: 0 }}>{ungeleseneCoachNachrichten.length}</span>
        </button>
      )}
      {/* Verspätete Routine als Muster (25.09.): "Passt deine Zeit noch?" —
          nur im eigenen Konto, nicht beim Verwalten einer anderen Person. */}
      {/* Kontext-Tagebuch (25.09.): abends einmal "Wie war dein Tag?" —
          nur im eigenen Konto. */}
      {/* AKA-Kernprogramm (25.09.): Etappe/Woche, Morgen-Startblock "Top 3",
          sonntags Wochen-Check in der Erhaltung — nur im eigenen Konto. */}
      {/* Fokus-Timer aus dem Bild-Tagesplan läuft weiter (27.09.) */}
      <LaufenderTimerKarte />
      </>
      )}
      {proband === null && <KernprogrammKarte onOeffnen={() => onOpenView("coaching")} onRoutineStart={setAblaufRoutine} />}
      {!STARTSEITE_SCHLICHT && (
      <>
      {proband === null && <Top3Karte />}
      {proband === null && <WochenCheckKarte />}
      {/* Gruppen-Atem-Session (25.09.): 15 Min. vorher bis zum Ende. */}
      {team && aktuelleSession(atemSessions) && (
        <button
          type="button"
          className="mp-tap"
          onClick={() => onOpenView("atemuebungen")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-karte))", border: "2px solid #2E9C86", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ fontSize: 26 }}>👥</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontWeight: 900, fontSize: 14 }}>Gemeinsam atmen</span>
            <span style={{ display: "block", fontSize: 12.5, color: "color-mix(in srgb, #1E6E57 var(--mp-schrift), var(--mp-schrift-hell))" }}>
              {new Date(aktuelleSession(atemSessions).startUm) > new Date()
                ? `startet um ${new Date(aktuelleSession(atemSessions).startUm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
                : "läuft gerade"}{" "}
              · Mitmachen ›
            </span>
          </span>
        </button>
      )}
      {/* Gemeinsam fokussieren (27.09.): nur wenn gerade etwas los ist. */}
      {proband === null && <FokusGemeinsamKarte onOeffnen={() => onOpenView("fokus")} />}
      {/* Schichtarbeit (25.09.): welche Schicht heute gilt + "Heute anders". */}
      <SchichtHeuteKarte />
      {proband === null && <RoutineZeitHinweisKarte zeigeCoachKnopf={!isAdmin} onCoachChat={() => onOpenView("coach-chat")} />}
      </>
      )}
      {/* Seit 25.09. (Nutzerinnen-Wunsch): Begrüßung, dann Gehirn + Balken
          oben, darunter Als Nächstes und der Spielstand (kopfUnten).
          Ursprünglich (24.09.): EINE Karte mit Spielstand
          (Tagesring, Serie, Punkte, Level — ersetzt seit 23.09. die reine
          Text-Begrüßung) und darunter "Dein Gehirn" mit Wasser-Tropfen und
          Akut-Knopf. Als Nächstes und Quests folgen darunter. */}
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
        phase={phase}
        balkenKlappbar
      />
      {!STARTSEITE_SCHLICHT && (
      <>
      {/* Design 2.0 (28.09., Entwurf „Mischung B+C“): Spielstand als drei
          Kacheln, Schnellknöpfe als eigene Zeile, „Jetzt dran“ als eigene Karte. */}
      <SpielstandReihe
        erledigt={erledigtCount + raetselZaehlt}
        gesamt={displayItems.length + (isEmergencyMode ? 0 : 1)}
        punkte={gesamtPunkte}
        serie={globalerStreak}
        onOpenErfolge={() => onOpenView("erfolge")}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <button type="button" className="mp-tap" data-schnell-wasser aria-label="Wasser eintragen" onClick={() => onOpenView("hydration")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 16, padding: "12px 10px", background: "color-mix(in srgb, #E6F0FF var(--mp-flaeche), var(--mp-karte))", color: "color-mix(in srgb, #1F4FAF var(--mp-schrift), var(--mp-schrift-hell))", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          💧 Wasser +
        </button>
        <button type="button" className="mp-tap" aria-label="Grad nicht gut?" onClick={() => setAkutOffen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 16, padding: "12px 10px", background: "color-mix(in srgb, #FFF3D6 var(--mp-flaeche), var(--mp-karte))", color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          💡 Grad nicht gut?
        </button>
      </div>
      <div data-jetzt-karte style={{ marginBottom: 20 }}>{kartenMitte}</div>

      </>
      )}
      {/* Startseite schlicht (29.09., Nutzerin): nur Kernprogramm, Gehirn +
          Körper, drei große Knöpfe und die Tages-Quests. Alles andere steht
          unter Plan bzw. Mehr. */}
      {STARTSEITE_SCHLICHT && (
        <div data-schnellknoepfe style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { key: "wasser", emoji: "💧", titel: "Wasser +", sub: "Glas eintragen", verlauf: "linear-gradient(145deg, #4F8DF5, #2D6FD6)", onClick: () => onOpenView("hydration"), label: "Wasser eintragen" },
            { key: "spielen", emoji: "🎮", titel: "Spielen", sub: "Rätsel & Fokus", verlauf: "linear-gradient(145deg, #9B8CFF, #6C5CE7)", onClick: () => setSpieleOffen((o) => !o), label: "Spielen" },
            { key: "akut", emoji: "💡", titel: "Grad nicht gut?", sub: "Hilfe für jetzt", verlauf: "linear-gradient(145deg, #FFC857, #F29F05)", onClick: () => setAkutOffen(true), label: "Grad nicht gut?" },
          ].map((k) => (
            <button key={k.key} type="button" className="mp-tap" aria-label={k.label} aria-expanded={k.key === "spielen" ? spieleOffen : undefined} onClick={k.onClick} style={{ border: "none", borderRadius: 22, padding: "16px 8px 14px", minHeight: 108, background: k.verlauf, color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 8px 20px rgba(16, 24, 40, 0.14)", fontFamily: "inherit" }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{k.emoji}</span>
              <span style={{ fontSize: 14.5, fontWeight: 800, marginTop: 4, textAlign: "center", lineHeight: 1.15 }}>{k.titel}</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>{k.sub}</span>
            </button>
          ))}
          {spieleOffen && (
            // Denksport und Tagesrätsel zusammengelegt (29.09., Nutzerin: „führen
            // in den gleichen Reiter“) – das Tagesrätsel steht oben in Denksport.
            <div data-spiele-auswahl style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, padding: 10, borderRadius: 20, background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)" }}>
              {[
                ["denksport", "🧠", "Denksport & Rätsel"],
                ["fokus", "🎯", "Gemeinsam fokussieren"],
              ].map(([id, emoji, titel]) => (
                <button key={id} type="button" className="mp-tap" onClick={() => onOpenView(id)} style={{ border: "none", borderRadius: 14, padding: "12px 6px", background: "color-mix(in srgb, #F1EDFF var(--mp-flaeche), var(--mp-karte))", cursor: "pointer", fontSize: 12.5, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  {titel}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Spiel-Ausbau 23.09.: automatische Tages-Quests + "Dein Gehirn"
          direkt unter "Als Nächstes" — für alle, auch im Admin-Modus. */}
      {!isEmergencyMode && <TagesQuestsKarte quests={tagesQuests} onOpenView={onOpenView} />}
      {!STARTSEITE_SCHLICHT && (
      <>
      {/* Spielen & Fokus (Design 2.0, 28.09., Nutzerin: „die Spiele nicht mehr
          entdecken“): gut sichtbar direkt unter den Quests. */}
      {!isEmergencyMode && (
        <div data-spielen style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: fontHeading, fontSize: 18, fontWeight: 800, letterSpacing: -0.3, margin: "0 2px 10px" }}>🎮 Spielen & Fokus</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { id: "tagesraetsel", emoji: "🧩", titel: "Tagesrätsel", sub: "5 Fragen am Tag", verlauf: "linear-gradient(135deg, #FF8A5B, #FFB36B)" },
              { id: "denksport", emoji: "🧠", titel: "Denksport", sub: "Rätsel & Quiz", verlauf: "linear-gradient(135deg, #7C6CFF, #A48BFF)" },
              { id: "fokus", emoji: "🎯", titel: "Gemeinsam fokussieren", sub: "Body Doubling", verlauf: "linear-gradient(135deg, #1FA99A, #4FD1C5)" },
            ].map((sp) => (
              <button
                key={sp.id}
                type="button"
                className="mp-tap"
                onClick={() => onOpenView(sp.id)}
                style={{ textAlign: "left", border: "none", borderRadius: 18, padding: "12px 10px", minHeight: 110, background: sp.verlauf, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 6px 16px rgba(16, 24, 40, 0.12)" }}
              >
                <span style={{ fontSize: 24, marginBottom: 4 }}>{sp.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{sp.titel}</span>
                <span style={{ fontSize: 11, opacity: 0.9 }}>{sp.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Gruppen-Quests des Teams (24.09.) — kompakt, Tippen führt zur Team-Seite. */}
      {!isEmergencyMode &&
        (gruppenprotokolle || []).filter((gp) => !gp.abgelaufen).flatMap((gp) =>
          gp.quests.map((q) => {
            const f = questFortschritt(q, gp.stand, userId);
            return (
              <button
                key={q.id}
                type="button"
                className="mp-tap"
                onClick={() => onOpenView("team")}
                style={{ width: "100%", textAlign: "left", marginBottom: 14, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: 14, background: "var(--mp-karte)", cursor: "pointer", fontFamily: "inherit" }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>🎯 Gruppen-Quest {f.geschafft ? "🏅" : ""}</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>{q.titel}</div>
                <div style={{ height: 8, borderRadius: 99, background: "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-karte))", marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Math.round((f.gesamt / f.ziel) * 100))}%`, height: "100%", borderRadius: 99, background: TAGESRAETSEL_META.dot }} />
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>
                  {Math.min(f.gesamt, f.ziel)} / {f.ziel} – dein Beitrag: {f.eigen} · 👥 {gp.name}
                </div>
              </button>
            );
          })
        )}
      </>
      )}
      {/* Akut-Hilfe als Fenster über dem Bildschirm (24.09.): der 💡-Knopf
          sitzt jetzt oben im Gehirnfeld — inline weiter unten wäre das
          Panel nach dem Tippen gar nicht zu sehen. Aufbau wie in
          AkutModusGlobal.jsx. */}
      {akutOffen &&
        createPortal(
          <div
            onClick={() => setAkutOffen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(21, 24, 26, 0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))" }}
            >
              <AkutModusPanel
                onClose={() => setAkutOffen(false)}
                onSendenAnCoach={!istAdminModus ? coacheeNachrichtSenden : undefined}
                coachName={getCoachName()}
                zeigeCoachOption={!istAdminModus}
                akutUebungen={gewohnheiten.filter((g) => g.akutFavorit)}
              />
            </div>
          </div>,
          document.body
        )}

      {!STARTSEITE_SCHLICHT && (
      <>
      {/* Notfallmodus-Umschalter: eigene volle Zeile (13.09., Nutzerin-
          Vorgabe) — vorher schmal neben dem Akutmodus-Knopf, der jetzt
          stattdessen oben neben Hydration sitzt (beides häufigere
          Schnellaktionen). Der Umschalter selbst wird seltener gebraucht,
          bekommt deshalb wieder seine volle, ausführlichere Darstellung
          statt der schmalen `compact`-Variante — Design wird bei
          Gelegenheit noch weiter überarbeitet. */}
      {/* Design 2.0 (29.09., „wirkt alt“): statt des großen farbigen Balkens
          ein schlanker Umschalter „Alles / Nur Basics“. */}
      <div role="group" aria-label="Ansicht heute" data-ansicht-umschalter style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18, padding: "10px 12px 10px 16px", borderRadius: 18, background: "var(--mp-karte)", border: "1px solid rgba(16, 24, 40, 0.05)", boxShadow: "var(--mp-schatten)" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Heute zeigen</span>
        <span style={{ display: "flex", gap: 4, padding: 3, borderRadius: 99, background: "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-rand-dunkel))" }}>
          {[
            [false, "✨ Alles"],
            [true, "🌿 Nur Basics"],
          ].map(([wert, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={isEmergencyMode === wert}
              onClick={() => isEmergencyMode !== wert && handleToggleEmergencyMode(wert)}
              style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", background: isEmergencyMode === wert ? "var(--mp-karte)" : "transparent", boxShadow: isEmergencyMode === wert ? "0 1px 3px rgba(16, 24, 40, 0.12)" : "none" }}
            >
              {label}
            </button>
          ))}
        </span>
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
          {/* Rangliste (24.09.): Personen, die teilen, und Teams — für alle
              Coachees erreichbar, auch ohne Team. */}
          <button
            type="button"
            className="mp-tap"
            onClick={() => onOpenView("team")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 20, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: 14, background: "var(--mp-karte)", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span style={{ fontSize: 24 }}>🏆</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>Rangliste</span>
              <span style={{ display: "block", fontSize: 12, color: textMuted }}>Personen und Teams nach Punkten</span>
            </span>
            <span style={{ fontSize: 18, color: textMuted }}>›</span>
          </button>
          <TeamKarte
            team={team}
            teamKollegen={teamKollegen}
            teamNachrichten={teamNachrichten}
            onSenden={teamNachrichtSenden}
            onGelesen={teamNachrichtGelesen}
            onOpenTeam={() => onOpenView("team")}
          />
          <button
            type="button"
            className="mp-tap mp-nur-ohne-leiste"
            onClick={() => onOpenView("coach-chat")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 24, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: 14, background: "var(--mp-karte)", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
          >
            <span style={{ fontSize: 24 }}>💬</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>Chat mit deinem Coach</span>
              <span style={{ display: "block", fontSize: 12, color: textMuted }}>jederzeit hier, auch ohne neue Nachricht</span>
            </span>
            <span style={{ fontSize: 18, color: textMuted }}>›</span>
          </button>
        </>
      )}

      </>
      )}
      {/* „Deine Bereiche“ (Ringe) und „Weitere Pläne – einrichten“ sind seit
          29.09. nicht mehr auf der Startseite (Nutzerin: „Kacheln unten weg“).
          Alle Bereiche: Mehr → Alle Pläne. */}
      {/* Design 2.0 (29.09., Nutzerin: „Leiste reicht, Kacheln unten weg“):
          Alle Pläne, Archiv, Tagebuch und Neues Protokoll stehen jetzt oben
          unter „Mehr“ (MehrView.jsx), erreichbar über die Leiste. */}

      {trainingFehler && (
        <div
          onClick={() => setTrainingFehler(null)}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            background: "var(--mp-karte)",
            border: "1px solid #E8B4AE",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 12.5,
            color: "color-mix(in srgb, #A63B32 var(--mp-schrift), var(--mp-schrift-hell))",
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
