import React, { useState, useMemo } from "react";
import { Shell, Card, TextArea, PrimaryButton } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { accentDark, accentSoft, blue, blueSoft, cardBorder, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { toLocalISODate, addDays, sameDay } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { useT } from "../i18n/translate";
import ADHSModeToggle from "../ui/ADHSModeToggle";
import QuickTaskList from "../ui/QuickTaskList";
import MiniPlanWidget from "../ui/MiniPlanWidget";
import { getADHSMode, saveADHSMode, getSoundEnabled, saveSoundEnabled } from "../utils/adhsStorage";
import { getMiniWidgetsAlleAnzeigen, saveMiniWidgetsAlleAnzeigen } from "../utils/widgetPrefs";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";

// Basis-Rollenbeschreibung des Home-Coaches. Die "Background Brain"-Inhalte
// (Wissens-Basis aus src/wissen/ + Trackingdaten-Zusammenfassung) werden
// nicht hier, sondern zentral in KiChat.jsx an JEDE Coach-Anfrage in allen
// Bereichen angehängt (nicht nur Home) — siehe dort.
const HOME_SYSTEM_PROMPT_BASIS =
  "Du bist ein hilfsbereiter Assistent für eine App zur Selbstverwaltung von Gesundheitsprotokollen (Peptide, Hormone, Supplemente, Training, Schlaf, Ernährung, Hydration, Tageslicht, Gewohnheiten). Beantworte Fragen zu den Plänen der Person allgemein und motivierend. Nutze die weiter unten mitgegebene Zusammenfassung der Trackingdaten, um Zusammenhänge zwischen den Bereichen zu erkennen und anzusprechen, wenn es hilfreich ist (z. B. sinkende Trinkmenge und schlechtere Trainingswerte) — dräng das aber nicht in jede Antwort, nur wenn es zur Frage passt. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein neues Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, neue Rezepte), frag von dir aus alle dafür nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — antworte dabei immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.";

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
    trainingWochenplan,
    trainingTemplates,
    trainingHinzufuegen,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    projekte,
    zeitbloecke,
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
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled());
  // Mini-Widgets: alle Kategorien zeigen (unbenutzte grau) vs. nur genutzte —
  // unabhängig vom ADHS-Notfallmodus, siehe miniWidgetData weiter unten.
  const [alleWidgetsAnzeigen, setAlleWidgetsAnzeigen] = useState(() => getMiniWidgetsAlleAnzeigen());
  const [trainingFehler, setTrainingFehler] = useState(null);

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

  const handleToggleAlleWidgets = () => {
    setAlleWidgetsAnzeigen((prev) => {
      const next = !prev;
      saveMiniWidgetsAlleAnzeigen(next);
      return next;
    });
  };

  const handleToggleSoundEnabled = (newState) => {
    setSoundEnabled(newState);
    saveSoundEnabled(newState);
  };

  const today = new Date();
  const stunde = today.getHours();
  const gruss = stunde < 12 ? t("home.greeting.morgen") : stunde < 18 ? t("home.greeting.tag") : t("home.greeting.abend");

  // Lade Benutzernamen aus localStorage
  const userName = typeof window !== "undefined" ? localStorage.getItem("user_name") : null;

  const heuteItems = buildDayItems(today, {
    hormonPlan,
    hormonErledigt,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    projekte,
    zeitbloecke,
  });

  // Im Notfallmodus: nur Medikamente/Hormone und Hydration anzeigen — die
  // Kategorie heißt intern "hormon" (siehe KATEGORIE_META, label "Medikament"),
  // "medikament" als Schlüssel existierte nirgends und ließ den Filter vorher
  // leerlaufen. Hydration wird separat als Balken angezeigt (kein Item-Modell).
  const ESSENTIAL_KATEGORIEN = ["hormon", "hydration"];
  const displayItems = isEmergencyMode ? heuteItems.filter((item) => ESSENTIAL_KATEGORIEN.includes(item.kategorie)) : heuteItems;

  const erledigtCount = displayItems.filter((i) => i.done).length;
  const gewohnheitHeuteItems = displayItems.filter((i) => i.kategorie === "gewohnheit");
  const gewohnheitErledigtHeute = gewohnheitHeuteItems.filter((i) => i.done).length;
  const offeneItems = displayItems.filter((i) => !i.done);
  const angezeigteItems = gruppiereFuerAlsNaechstes(offeneItems, t, tLabel);
  const tagStr = toLocalISODate(today);

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

  // Mini-Widget-Daten für alle Kategorien — erscheinen jetzt IMMER (auch ohne
  // eigene Daten, dann grau/"aktiv: false"), damit jede Kategorie als
  // Einstiegspunkt sichtbar bleibt. Das "alleWidgetsAnzeigen"-Präferenz
  // blendet unbenutzte Kategorien optional aus (siehe Toggle unten) — der
  // Notfallmodus-Filter bleibt davon unberührt und funktioniert exakt wie
  // zuvor (nur essenzielle UND tatsächlich genutzte Kategorien).
  const miniWidgetData = useMemo(() => {
    const widgets = [];

    // Einmal für alle 7 Tage berechnen statt einmal pro Kategorie-Block —
    // vorher riefen Supplemente/Mahlzeiten/Training je einzeln dieselbe
    // 7-Tage-Schleife mit identischen Argumenten auf (21 buildDayItems()-
    // Aufrufe pro Render statt der nötigen 7).
    const wocheItems = Array.from({ length: 7 }, (_, i) =>
      buildDayItems(addDays(today, i), {
        hormonPlan, hormonErledigt, supplemente, supplementErledigt,
        mahlzeiten, mahlzeitErledigt, mealWochenplan, trainingEintraege, trainingWochenplan,
        trainingTemplates, gewohnheiten, gewohnheitErledigt, workflowPlaene, workflowPresets,
      })
    ).flat();

    // Hormone (umfasst seit der Datenzusammenlegung, 13.08., auch Peptide)
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
        name: tLabel("Hormone"),
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

    // Im Notfallmodus wie bisher: nur essenzielle UND tatsächlich genutzte
    // Kategorien. Sonst: je nach Präferenz entweder alle (unbenutzte grau)
    // oder nur die tatsächlich genutzten.
    if (isEmergencyMode) return widgets.filter((w) => w.isEssential && w.aktiv);
    return alleWidgetsAnzeigen ? widgets : widgets.filter((w) => w.aktiv);
  }, [isEmergencyMode, alleWidgetsAnzeigen, hormonPlan, hormonErledigt, supplemente, supplementErledigt,
      mahlzeiten, mahlzeitErledigt, mealWochenplan, trainingEintraege, trainingWochenplan, trainingTemplates,
      gewohnheiten, gewohnheitErledigt, workflowPlaene, workflowPresets, hydrationHeuteMl, hydrationZielMl, hydrationHinzufuegen,
      tageslichtHeuteMinuten, tageslichtZielMinuten, heuteItems, today, tLabel]);

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

      {!istAdminModus ? (
        <NachrichtAnCoachCard nachrichten={coacheeNachrichten} onSenden={coacheeNachrichtSenden} />
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
            return null;
          }}
        />
      </div>
      )}

      {/* ADHS Mode Toggle */}
      <ADHSModeToggle isEmergencyMode={isEmergencyMode} onToggle={handleToggleEmergencyMode} />

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

      {/* Fortschritt zuerst — die Startseite ist ein Tagesassistent, kein Menü.
          Vertikal gestapelt (Label über Ring über Text) statt nebeneinander:
          bei nebeneinander lag der Ring je nach Textlänge/Zeilenumbruch der
          Statuszeile in den beiden Karten auf unterschiedlicher Höhe, wirkte
          "verschoben" — im Stapel bleibt der Ring immer direkt unter dem
          (kurzen, garantiert einzeiligen) Label, unabhängig davon, wie viele
          Zeilen der Text darunter braucht. */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 16 }}>{t("home.tagesfortschritt")}</div>
          <ProgressRing done={erledigtCount} total={heuteItems.length} size={110} stroke={9} color={accentDark} />
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginTop: 16 }}>{statusText(erledigtCount, heuteItems.length, lang)}</div>
        </Card>
        <Card
          className="mp-tap"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer", background: blueSoft, border: "none" }}
          onClick={() => onOpenView("routinen")}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: blue, marginBottom: 16 }}>{tLabel("Routinen")}</div>
          <ProgressRing done={gewohnheitErledigtHeute} total={gewohnheitHeuteItems.length} size={110} stroke={9} color={blue} />
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginTop: 16, color: blue }}>
            {gewohnheitHeuteItems.length === 0
              ? t("home.gewohnheiten.leer")
              : statusText(gewohnheitErledigtHeute, gewohnheitHeuteItems.length, lang)}
          </div>
        </Card>
      </div>

      {/* Mini-Widgets für alle Pläne */}
      {miniWidgetData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: textMuted }}>📊 Alle Pläne im Überblick</div>
            {!isEmergencyMode && (
              <button
                type="button"
                onClick={handleToggleAlleWidgets}
                className="mp-tap"
                style={{
                  border: "none",
                  background: "transparent",
                  color: accentDark,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 6px",
                }}
                title="Unabhängig vom ADHS-Notfallmodus"
              >
                {alleWidgetsAnzeigen ? "Nur genutzte zeigen" : "Alle zeigen"}
              </button>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 10,
            }}
          >
            {miniWidgetData.map((widget) => (
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
                onClick={() => onOpenView(widget.viewId)}
                actionLabel={widget.actionLabel}
                onAction={widget.onAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Schnellzugriff auf den Tagesplan — ersetzt den früheren "+"-FAB in
          der unteren Navigation, direkt über den heute offenen Aufgaben. */}
      <button
        className="mp-tap"
        onClick={() => onOpenView("tagesplan")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0 0 10px 0",
          textAlign: "left",
        }}
      >
        <Icon name="calendarCheck" size={18} color={accentDark} />
        <span style={{ fontSize: 13, fontWeight: 800, color: accentDark }}>{t("home.tagesplan")}</span>
        <span style={{ marginLeft: "auto", color: textMuted, fontSize: 14 }}>›</span>
      </button>

      {/* Dann die heute offenen Aufgaben — erst danach die Ordner. */}
      {angezeigteItems.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 10 }}>{t("home.alsNaechstes")}</div>
          <Card style={{ marginBottom: 20, padding: isEmergencyMode ? 8 : 8 }}>
            {isEmergencyMode ? (
              <QuickTaskList items={quickTasksFormatted} maxItems={4} soundEnabled={soundEnabled} />
            ) : (
              angezeigteItems.slice(0, 4).map((item, i, arr) => {
                const k = KATEGORIE_META[item.kategorie];
                return (
                  <div
                    key={item.key}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "12px 12px",
                      borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none",
                    }}
                  >
                    <button
                      className="mp-tap"
                      onClick={() => (item.kategorie === "training" ? starteTrainingVonItem(item) : onOpenView("tagesplan"))}
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
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {item.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {tLabel(item.uhrzeit)}</span>
                        </div>
                        {item.detail && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
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
                        onClick={() => onOpenView("tagesplan")}
                        style={{ color: textMuted, fontSize: 16, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        ›
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}

      <button
        className="mp-tap"
        onClick={() => onOpenView("routinen")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 18px",
          borderRadius: 18,
          border: "none",
          background: accentSoft,
          cursor: "pointer",
          marginBottom: 20,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="target" size={22} color={accentDark} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: accentDark }}>{tLabel("Routinen")}</div>
            <div style={{ fontSize: 12, color: accentDark, opacity: 0.8 }}>{t("home.gewohnheiten.cta.desc")}</div>
          </div>
        </div>
        <span style={{ color: accentDark, fontSize: 18 }}>›</span>
      </button>

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
