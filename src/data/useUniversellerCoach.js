import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { bibliotheksUebung } from "../utils/atemBibliothek";
import { OPTIONEN as TAGEBUCH_OPTIONEN, STICHWORTE, autoWerte, tagebuchZeile } from "../utils/tagebuch";
import { VORLAGEN, planErzeugen, plusTage, rollenZuordnung, wochenBeginn } from "../utils/schichtplan";
import { sitzungEnde } from "../utils/fokusGemeinsam";
import { bloeckeFuerTag, konflikteFuerEintrag } from "../utils/kalender";
import { timerHinweisPlanen } from "./nativeTimerHinweis";
import { setzeAbendDunkelErlaubt } from "../ui/theme";
import { buildDayItems } from "../utils/dayItems";
import { verspaetungText } from "../utils/dates";
import { LOESCH_TYP_NAME, ansichtenListe, ansichtName, befehlBereinigen, nameFinden, punktFinden } from "../utils/akaBefehl";
import { ATEM_BIBLIOTHEK, ATEM_START_KEY } from "../utils/atemBibliothek";
import { trainingAusPlan } from "../utils/trainingAusPlan";
import { routineStartMerken } from "../utils/routineStart";
import { workflowStartMerken } from "../utils/workflowStart";
import { essenBerechnen } from "./essenBerechnen";
import { summe as essenSumme } from "../utils/essenRechner";
import { nickerchenBeginn } from "../utils/ereignisse";

// Beschriftung des "Übernehmen"-Knopfs im universellen Coach — je nachdem,
// welchen Bereich AIService.bereichErkennen() im laufenden Gespräch erkannt
// hat.
export const BEREICH_LABELS = {
  gewohnheit: "Gewohnheit anlegen",
  supplement: "Supplement anlegen",
  medikament: "Medikament anlegen",
  hydration: "Übernehmen",
  tageslicht: "Ziel übernehmen",
  training: "Plan übernehmen",
  ernaehrung: "Rezepte übernehmen",
  schlaf: "Eintragen",
  workflow: "Workflow anlegen",
  morgenroutine: "Schritte anlegen",
  abendroutine: "Schritte anlegen",
  schichtplan: "Schichtplan übernehmen",
  atemroutine: "Atem-Zeiten anlegen",
  tagebuch: "Im Tagebuch festhalten",
  fokus: "Fokus-Runde starten",
  alltag: "In den Kalender eintragen",
  matrix: "In die Matrix eintragen",
  aussehen: "Einstellung übernehmen",
};

// Die eine Aktions-Logik von Aka (seit 23.09. der einzige Weg — es gibt
// keine eigenen Bereichs-Chats mehr, siehe ui/Aka.jsx): erkennt den Bereich
// aus dem Gespräch und routet zur passenden Extraktions-/Speicherfunktion.
// Dadurch kann Aka auf jeder Seite in jeden Bereich eintragen.
export function useUniversellerCoach() {
  const {
    gewohnheitHinzufuegen,
    supplementHinzufuegen,
    hormonHinzufuegen,
    hydrationZielSetzen,
    tageslichtZielSetzen,
    wochenplanHinzufuegen,
    mahlzeitHinzufuegen,
    erinnerungen,
    setErinnerung,
    aenderungVermerken,
    schlafHinzufuegen,
    workflowPresetHinzufuegen,
    workflowPresetAendern,
    workflowPlanHinzufuegen,
    routineSchrittHinzufuegen,
    routineVarianten,
    routineVarianteSpeichern,
    routineSchichtplanSpeichern,
    atemZeitSpeichern,
    tagebuchSpeichern,
    tagebuchEintraege,
    fokusStarten,
    alltagSpeichern,
    alltagEintraege,
    alltagBereiche,
    routineEinstellungen,
  } = useAppData();
  const appData = useAppData();

  // Übergabe an <KiChat pruefeBereitschaft>: läuft im Hintergrund nach
  // jeder Coach-Antwort, damit der "Übernehmen"-Knopf nur erscheint, wenn
  // das Gespräch wirklich schon konkret genug ist — nicht schon nach
  // belanglosem Small Talk (siehe KiChat.jsx für die genaue Mechanik).
  // Seit 10.10. zusätzlich „jetzt“: Sagt die Person klar „trag ein“, führt
  // KiChat die Übernahme ohne Knopf aus (der Knopf bleibt als Ersatz).
  const handleBereitschaftPruefen = async (verlauf) => {
    const { bereich, jetzt } = await AIService.bereichErkennen({ verlauf, coachName: getCoachName() });
    return bereich === "keiner" ? null : { bereich, jetzt };
  };

  // Heutige Tagesplan-Punkte wie auf der Startseite (HomeView.jsx).
  const heutePunkte = () =>
    buildDayItems(new Date(), {
      hormonPlan: appData.hormonPlan,
      hormonErledigt: appData.hormonErledigt,
      supplemente: appData.supplemente,
      supplementErledigt: appData.supplementErledigt,
      mahlzeiten: appData.mahlzeiten,
      mahlzeitErledigt: appData.mahlzeitErledigt,
      mealWochenplan: appData.mealWochenplan,
      trainingEintraege: appData.trainingEintraege,
      trainingNachDatum: appData.trainingNachDatum,
      trainingWochenplan: appData.trainingWochenplan,
      trainingTemplates: appData.trainingTemplates,
      gewohnheiten: appData.gewohnheiten,
      gewohnheitErledigt: appData.gewohnheitErledigt,
      workflowPlaene: appData.workflowPlaene,
      workflowPresets: appData.workflowPresets,
      projekte: appData.projekte,
      zeitbloecke: appData.zeitbloecke,
      ausnahmenNachSchluessel: appData.ausnahmenNachSchluessel,
    });

  // Ein Punkt wie beim Ein-Tipp-Abhaken auf der Startseite (HomeView.jsx).
  const punktAbhaken = async (item) => {
    const tag = toLocalISODate(new Date());
    const zeit = item.originalUhrzeit ?? item.uhrzeit;
    if (item.bundleIds) return appData.confirmAlleTageszeit?.(tag, item.uhrzeit, item.bundleIds);
    if (item.kategorie === "training") {
      // Geplantes Training als erledigt eintragen (10.10.).
      const r = item.raw?.virtuell
        ? await appData.trainingHinzufuegen?.(trainingAusPlan(item.raw, { erledigt: true }))
        : await appData.trainingErledigtSetzen?.(item.raw?.id, true);
      if (r && r.ok === false) return false;
      aenderungVermerken({ kategorie: "training", itemName: item.name, aktion: "erledigt", detail: verspaetungText(zeit) || "" });
      return true;
    }
    if (!["supplement", "hormon", "mahlzeit", "gewohnheit"].includes(item.kategorie)) return false;
    if (item.raw?.name) aenderungVermerken({ kategorie: item.kategorie, itemName: item.raw.name, aktion: "erledigt", detail: verspaetungText(item.logZeit ?? zeit) || "" });
    if (item.kategorie === "supplement") return appData.toggleSupplementErledigt?.(tag, item.raw.id, zeit);
    if (item.kategorie === "hormon") return appData.toggleHormonErledigt?.(tag, item.raw.name, zeit);
    if (item.kategorie === "mahlzeit") return appData.toggleMahlzeitErledigt?.(tag, item.refId, item.logZeit ?? zeit);
    return appData.toggleGewohnheitErledigt?.(tag, item.raw.id);
  };

  const plusEineStunde = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // „Lesen lieber um 21:30“ (10.10.): Uhrzeit, Menge, Dauer oder Name ändern.
  const aendern = async (befehl, liste) => {
    const { typ, uhrzeit, menge, dauerMin, neuerName } = befehl;
    const quelle = typ === "aufgabe" ? offeneAufgaben().map((a) => ({ ...a, name: a.titel })) : liste[typ];
    const ziel = nameFinden(quelle, befehl.name);
    if (!ziel) return null;
    const pruefen = (r) => {
      if (r && r.ok === false) throw new Error(r.error || "Ändern fehlgeschlagen.");
    };
    const was = [];
    if (typ === "gewohnheit") {
      if (neuerName || uhrzeit || menge) pruefen(await appData.gewohnheitAendern?.(ziel.id, { name: neuerName || undefined, uhrzeit: uhrzeit || undefined, menge: menge || undefined }));
      if (dauerMin) pruefen(await appData.gewohnheitDauerSetzen?.(ziel.id, dauerMin));
    } else if (typ === "supplement") {
      const felder = {};
      if (uhrzeit) {
        // Mehrere Einnahmezeiten: nicht raten, welche gemeint ist.
        const sp = (appData.supplemente || []).find((x) => x.id === ziel.id);
        if ((sp?.tageszeiten || []).length > 1) throw new Error(`„${ziel.name}“ hat mehrere Einnahmezeiten – die Uhrzeit bitte unter Supplemente ändern.`);
        felder.uhrzeiten = [uhrzeit];
      }
      if (menge) felder.menge = menge;
      if (neuerName) felder.name = neuerName;
      if (!Object.keys(felder).length) return null;
      pruefen(await appData.supplementAendern?.(ziel.id, felder));
    } else if (typ === "routineschritt") {
      const schritt = (appData.routineSchritte || []).find((x) => x.id === ziel.id);
      if (!neuerName && !dauerMin) return null;
      pruefen(await appData.routineSchrittAendern?.(ziel.id, { name: neuerName || schritt?.name, dauerMin: dauerMin || schritt?.dauerMin }));
    } else if (typ === "aufgabe") {
      if (!neuerName && !uhrzeit) return null;
      const a = offeneAufgaben().find((x) => x.id === ziel.id);
      pruefen(await appData.matrixAufgabeSpeichern?.({ ...a, ...(neuerName ? { titel: neuerName } : {}), ...(uhrzeit ? { uhrzeit } : {}) }));
    }
    if (neuerName) was.push(`heißt jetzt „${neuerName}“`);
    if (uhrzeit) was.push(`um ${uhrzeit} Uhr`);
    if (menge) was.push(menge);
    if (dauerMin) was.push(`${dauerMin} Min.`);
    const kategorie = { gewohnheit: "gewohnheit", supplement: "supplement" }[typ];
    if (kategorie) aenderungVermerken({ kategorie, itemName: ziel.name, aktion: "geändert", detail: `${was.join(" · ")} (per Aka)` });
    return { bereich: "geaendert", daten: { name: ziel.name, was } };
  };

  // „Starte …“ (10.10.): Routine, Training, Workflow, Atemübung, Fokus, Rätsel.
  const starten = async (befehl, punkte, { onOpenView, onOpenTraining }) => {
    const oeffne = (v) => onOpenView?.(v);
    switch (befehl.ziel) {
      case "morgenroutine":
      case "abendroutine": {
        const art = befehl.ziel === "morgenroutine" ? "morgen" : "abend";
        routineStartMerken(art);
        oeffne("home");
        return { bereich: "gestartet", daten: { name: art === "morgen" ? "Morgenroutine" : "Abendroutine" }, schliessen: true };
      }
      case "training": {
        const geplant = punkte.find((i) => i.kategorie === "training" && !i.done && (!befehl.name || nameFinden([i], befehl.name)));
        if (geplant && onOpenTraining) {
          let id = geplant.raw?.id;
          if (geplant.raw?.virtuell) {
            const r = await appData.trainingHinzufuegen?.(trainingAusPlan(geplant.raw));
            if (!r?.ok) throw new Error(r?.error || "Training konnte nicht gestartet werden.");
            id = r.eintrag.id;
          }
          onOpenTraining(id);
          return { bereich: "gestartet", daten: { name: geplant.name }, schliessen: true };
        }
        oeffne("training");
        return { bereich: "oeffnen", daten: { name: "Training" }, schliessen: true };
      }
      case "workflow": {
        const preset = befehl.name ? nameFinden(appData.workflowPresets, befehl.name) : null;
        workflowStartMerken(preset ? preset.id : "spontan");
        oeffne("workflow");
        return { bereich: "gestartet", daten: { name: preset?.name || "Workflow" }, schliessen: true };
      }
      case "atem": {
        const u = (befehl.name && nameFinden(ATEM_BIBLIOTHEK, befehl.name)) || null;
        try {
          if (u) sessionStorage.setItem(ATEM_START_KEY, u.key);
        } catch {
          // ohne Speicher öffnet sich nur die Atem-Seite
        }
        oeffne("atemuebungen");
        return { bereich: "gestartet", daten: { name: u?.name || "Atemübungen" }, schliessen: true };
      }
      case "fokus": {
        const r = await fokusStarten({ ziel: befehl.name || "", dauerMinuten: befehl.minuten || 25 });
        if (!r?.ok) throw new Error(r?.error || "Starten fehlgeschlagen.");
        timerHinweisPlanen({ symbol: "🎯", name: r.sitzung.ziel || "Gemeinsam fokussieren", ende: sitzungEnde(r.sitzung) });
        oeffne("fokus");
        return { bereich: "gestartet", daten: { name: "Gemeinsam fokussieren" }, schliessen: true };
      }
      case "tagesraetsel":
        oeffne("tagesraetsel");
        return { bereich: "oeffnen", daten: { name: "Tagesrätsel" }, schliessen: true };
      default:
        return null;
    }
  };

  // Direkte Befehle aus der letzten Nachricht (10.10., „Aka wie Siri“):
  // läuft parallel zur Chat-Antwort, gibt null zurück, wenn es keiner ist.
  // Löschbare Einträge je Typ (für Klassifikator und Ausführung).
  const loeschbar = () => ({
    gewohnheit: (appData.gewohnheiten || []).map((g) => ({ id: g.id, name: g.name })),
    supplement: (appData.supplemente || []).map((x) => ({ id: x.id, name: x.name })),
    medikament: (appData.hormone || []).map((h) => ({ id: typeof h === "string" ? h : h?.name, name: typeof h === "string" ? h : h?.name })),
    aufgabe: offeneAufgaben().map((a) => ({ id: a.id, name: a.titel })),
    termin: (alltagEintraege || []).map((e) => ({ id: e.id, name: e.titel })),
    workflow: (appData.workflowPresets || []).map((w) => ({ id: w.id, name: w.name })),
    // Kernprogramm-Schritte (🔒) bleiben geschützt.
    routineschritt: (appData.routineSchritte || []).filter((x) => !x.kernKey).map((x) => ({ id: x.id, name: x.name })),
  });
  const offeneAufgaben = () => (appData.matrixAufgaben || []).filter((a) => !a.erledigtAm);

  const loeschenAusfuehren = async (typ, id) => {
    const f = {
      gewohnheit: appData.gewohnheitEntfernen,
      supplement: appData.supplementEntfernen,
      medikament: appData.hormonEntfernen,
      aufgabe: appData.matrixAufgabeLoeschen,
      termin: appData.alltagLoeschen,
      workflow: appData.workflowPresetLoeschen,
      routineschritt: appData.routineSchrittEntfernen,
    }[typ];
    if (!f) throw new Error("Das kann ich noch nicht löschen.");
    const r = await f(id);
    if (r && r.ok === false) throw new Error(r.error || "Löschen fehlgeschlagen.");
  };

  const handleBefehl = async (verlauf, { onOpenView, onOpenTraining } = {}) => {
    const punkte = heutePunkte();
    const offen = punkte.filter((i) => !i.done).map((i) => i.name).slice(0, 40);
    const liste = loeschbar();
    const befehl = befehlBereinigen(
      await AIService.befehlErkennen({
        verlauf,
        coachName: getCoachName(),
        ansichten: ansichtenListe(),
        offenePunkte: offen,
        aufgaben: offeneAufgaben().map((a) => a.titel).slice(0, 40),
        eintraege: Object.entries(liste).flatMap(([typ, l]) => l.map((x) => `${typ}: ${x.name}`)).slice(0, 120),
        workflows: (appData.workflowPresets || []).map((w) => w.name),
        atemuebungen: ATEM_BIBLIOTHEK.map((u) => u.name),
        heute: toLocalISODate(new Date()),
      })
    );
    switch (befehl.art) {
      case "oeffnen":
        if (!onOpenView) return null;
        onOpenView(befehl.ansicht);
        return { bereich: "oeffnen", daten: { name: ansichtName(befehl.ansicht) }, schliessen: true };
      case "wasser": {
        const r = await appData.hydrationHinzufuegen?.(befehl.ml);
        if (r && r.ok === false) throw new Error(r.error);
        // Wie im Schnellmenü zusätzlich mit Uhrzeit als Ereignis (Kalender).
        appData.spontanSpeichern?.({ art: "getraenk", mengeMl: befehl.ml, name: "Wasser" });
        aenderungVermerken({ kategorie: "hydration", itemName: "Wasser", aktion: "eingetragen", detail: `+${befehl.ml} ml` });
        return { bereich: "wasser", daten: { ml: befehl.ml } };
      }
      case "tageslicht": {
        const r = await appData.tageslichtHinzufuegen?.(befehl.minuten);
        if (r && r.ok === false) throw new Error(r.error);
        aenderungVermerken({ kategorie: "tageslicht", itemName: "Tageslicht", aktion: "eingetragen", detail: `+${befehl.minuten} Min.` });
        return { bereich: "tageslicht-log", daten: { minuten: befehl.minuten } };
      }
      case "abhaken": {
        const erledigt = [];
        for (const name of befehl.namen) {
          const item = punktFinden(punkte, name);
          if (item && !erledigt.includes(item.name) && (await punktAbhaken(item)) !== false) {
            erledigt.push(item.name);
            continue;
          }
          // Sonst: Aufgabe aus der Matrix als erledigt markieren.
          const a = nameFinden(offeneAufgaben(), name, "titel");
          if (a && !erledigt.includes(a.titel)) {
            const r = await appData.matrixAufgabeSpeichern?.({ ...a, erledigtAm: toLocalISODate(new Date()) });
            if (r?.ok) erledigt.push(a.titel);
          }
        }
        return erledigt.length ? { bereich: "abgehakt", daten: erledigt } : null;
      }
      case "starten":
        return starten(befehl, punkte, { onOpenView, onOpenTraining });
      case "loeschen": {
        const ziel = nameFinden(liste[befehl.typ], befehl.name);
        if (!ziel) return null;
        // Nie ohne Rückfrage löschen: AkaErgebnis zeigt „Ja, löschen“.
        return {
          bereich: "loeschen-frage",
          daten: { typName: LOESCH_TYP_NAME[befehl.typ], name: ziel.name },
          bestaetigen: async () => {
            await loeschenAusfuehren(befehl.typ, ziel.id);
            // Nur Bereiche, die der Tagesverlauf kennt (Aufgaben/Termine nicht).
            const kategorie = { gewohnheit: "gewohnheit", supplement: "supplement", medikament: "hormon", workflow: "workflow" }[befehl.typ];
            if (kategorie) aenderungVermerken({ kategorie, itemName: ziel.name, aktion: "entfernt", detail: "per Aka" });
          },
        };
      }
      case "verschieben": {
        const a = nameFinden(offeneAufgaben(), befehl.name, "titel");
        if (!a) return null;
        const r = await appData.matrixAufgabeSpeichern?.({ ...a, geplantAm: befehl.datum });
        if (!r?.ok) throw new Error(r?.error || "Verschieben fehlgeschlagen.");
        return { bereich: "verschoben", daten: { titel: a.titel, datum: befehl.datum } };
      }
      case "aendern":
        return aendern(befehl, liste);
      case "essen": {
        // Wie „Was hast du gegessen?“ (EssenEingabe), nur ohne Bestätigen.
        const { posten } = await essenBerechnen(befehl.name);
        const s = essenSumme(posten);
        const jetzt = new Date();
        const uhrzeit = `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`;
        const r = await appData.essenSpeichern?.({ datum: toLocalISODate(jetzt), uhrzeit, text: befehl.name, posten, summe: s });
        if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "mahlzeit", itemName: befehl.name.slice(0, 60), aktion: "erledigt", detail: `≈ ${Math.round(s.kcal)} kcal · ${Math.round(s.eiweiss)} g Eiweiß` });
        return { bereich: "gegessen", daten: { text: befehl.name, kcal: Math.round(s.kcal), eiweiss: Math.round(s.eiweiss) } };
      }
      case "einnahme": {
        // Wie „Einnahme“ im Schnellmenü (SchnellKreis.jsx).
        const r = await appData.spontanSpeichern?.({ art: "einnahme", name: befehl.name });
        if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "supplement", itemName: befehl.name, aktion: "erledigt", detail: "zusätzlich, außerhalb des Plans" });
        return { bereich: "einnahme", daten: { name: befehl.name } };
      }
      case "nickerchen": {
        const r = await appData.spontanSpeichern?.({ art: "nickerchen", dauerMin: befehl.minuten, uhrzeit: nickerchenBeginn(new Date(), befehl.minuten) });
        if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "schlaf", itemName: "Nickerchen", aktion: "erledigt", detail: `${befehl.minuten} Min.` });
        return { bereich: "nickerchen", daten: { minuten: befehl.minuten } };
      }
      case "startzeit": {
        const bisher = routineEinstellungen?.[befehl.routine];
        const r = await appData.routineZeitrahmenSetzen?.(befehl.routine, befehl.uhrzeit, bisher?.endZeit || plusEineStunde(befehl.uhrzeit));
        if (r && r.ok === false) throw new Error(r.error);
        aenderungVermerken({ kategorie: befehl.routine === "morgen" ? "morgenroutine" : "abendroutine", itemName: "Startzeit", aktion: "geändert", detail: `${befehl.uhrzeit} Uhr (per Aka)` });
        return { bereich: "startzeit", daten: befehl };
      }
      default:
        return null;
    }
  };

  // Übergabe an <KiChat onUebernehmen>: routet je nach dem von
  // handleBereitschaftPruefen erkannten Bereich zur selben Extraktions- und
  // Speicherfunktion, die auch der jeweilige Bereichs-Chat nutzt (siehe
  // z. B. GewohnheitenView.jsx, SupplementeView.jsx, ...).
  const handleUniverselleUebernahme = async (verlauf, erkannterBereich) => {
    const coachName = getCoachName();
    switch (erkannterBereich) {
      case "gewohnheit": {
        const g = await AIService.gewohnheitAusChat({ verlauf, coachName });
        const result = await gewohnheitHinzufuegen({
          name: g.name,
          icon: g.icon || "🌱",
          menge: g.menge || "",
          uhrzeit: g.uhrzeit || "",
          urzeitVon: g.urzeitVon || "",
          urzeitBis: g.urzeitBis || "",
          zielTage: g.zielTage ?? null,
          dauerMin: g.dauerMin ?? null,
        });
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({
          kategorie: "gewohnheit",
          itemName: g.name,
          aktion: "hinzugefügt",
          detail: g.uhrzeit ? `Uhrzeit: ${g.uhrzeit}` : g.urzeitVon ? `Zeitfenster: ${g.urzeitVon}–${g.urzeitBis}` : "",
        });
        return { bereich: "gewohnheit", daten: g };
      }
      case "supplement": {
        const s = await AIService.supplementAusChat({ verlauf, coachName });
        const result = await supplementHinzufuegen({
          name: s.name,
          tageszeiten: s.tageszeiten,
          hinweis: s.hinweis || "",
          menge: s.menge || "",
          intervallTyp: s.intervallTyp || "fixed",
          intervallDays: s.intervallDays || 1,
          customDays: s.customDays || "",
          onDays: s.onDays || "",
          offDays: s.offDays || "",
          weekdays: s.weekdays || [],
          eigenerStart: s.eigenerStart || "",
          uhrzeiten: s.uhrzeiten || [],
        });
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({
          kategorie: "supplement",
          itemName: s.name,
          aktion: "hinzugefügt",
          detail: [s.tageszeiten.join(", "), s.menge].filter(Boolean).join(" · "),
        });
        return { bereich: "supplement", daten: s };
      }
      case "medikament": {
        const m = await AIService.medikamentAusChat({ verlauf, coachName });
        const payload = {
          name: m.name,
          menge: m.menge || "",
          kategorie: m.kategorie || "Sonstige",
          einnahmeart: m.einnahmeart || "Tablette (oral)",
          intervallTyp: m.intervallTyp || "fixed",
          intervallDays: m.intervallDays || 1,
          customDays: m.customDays || "",
          onDays: m.onDays || "",
          offDays: m.offDays || "",
          weekdays: m.weekdays || [],
          eigenerStart: m.eigenerStart || "",
          uhrzeiten: m.uhrzeiten?.length ? m.uhrzeiten : ["20:00"],
        };
        const result = await hormonHinzufuegen(payload);
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "hormon", itemName: m.name, aktion: "hinzugefügt", detail: `${payload.kategorie} · ${payload.menge || "–"}` });
        return { bereich: "medikament", daten: payload };
      }
      case "hydration": {
        const { zielMl, zeiten } = await AIService.hydrationAusChat({ verlauf, coachName });
        if (zielMl) {
          const result = await hydrationZielSetzen(zielMl);
          if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        }
        if (zeiten.length > 0) {
          const bestehende = Array.isArray(erinnerungen?.hydration?.zeiten) ? erinnerungen.hydration.zeiten : [];
          const neue = zeiten.map((z) => ({ zeit: z.zeit, menge: z.menge, startDatum: "" }));
          const kombiniert = [...bestehende, ...neue].sort((a, b) => a.zeit.localeCompare(b.zeit));
          setErinnerung("hydration", { aktiv: true, zeiten: kombiniert });
        }
        return { bereich: "hydration", daten: { zielMl, zeiten } };
      }
      case "tageslicht": {
        const { zielMinuten } = await AIService.tageslichtAusChat({ verlauf, coachName });
        const result = await tageslichtZielSetzen(zielMinuten);
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        return { bereich: "tageslicht", daten: { zielMinuten } };
      }
      case "training": {
        const einheiten = await AIService.trainingsplanAusChat({ verlauf, coachName });
        for (const einheit of einheiten) {
          const result = await wochenplanHinzufuegen(einheit);
          if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
          const detail = [einheit.uhrzeit, (einheit.arten || []).join(" + ")].filter(Boolean).join(" · ");
          aenderungVermerken({ kategorie: "training", itemName: einheit.wochentag, aktion: "hinzugefügt", detail });
        }
        return { bereich: "training", daten: einheiten };
      }
      case "ernaehrung": {
        const rezepte = await AIService.ernaehrungsplanAusChat({ verlauf, coachName });
        const ergebnisse = await Promise.all(
          rezepte.map((rezept) =>
            mahlzeitHinzufuegen({
              name: rezept.name,
              hinweis: "KI-Vorschlag",
              zutaten: (rezept.zutaten || []).map((z) => ({ name: z.name, menge: z.menge, mengeGramm: "", kcalPro100g: "" })),
            })
          )
        );
        const fehlgeschlagen = ergebnisse.find((r) => !r?.ok);
        if (fehlgeschlagen) throw new Error(fehlgeschlagen.error || "Speichern fehlgeschlagen.");
        return { bereich: "ernaehrung", daten: rezepte };
      }
      case "schlaf": {
        const s = await AIService.schlafAusChat({ verlauf, coachName });
        const eintrag = {
          datum: toLocalISODate(new Date()),
          stunden: String(s.stunden),
          schlafqualitaet: s.schlafqualitaet || "",
          einschlafzeit: s.einschlafzeit || "",
          durchgeschlafen: s.durchgeschlafen ?? null,
          erholt: s.erholt ?? null,
          traeume: s.traeume || "",
          bemerkungen: s.bemerkungen || "",
        };
        const result = await schlafHinzufuegen(eintrag);
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        return { bereich: "schlaf", daten: eintrag };
      }
      case "workflow": {
        const w = await AIService.workflowAusChat({ verlauf, coachName });
        const presetResult = await workflowPresetHinzufuegen(w.name);
        if (!presetResult?.ok) throw new Error(presetResult?.error || "Speichern fehlgeschlagen.");
        const arbeitMin = w.arbeitMin || 25;
        const pauseMin = w.pauseMin || 5;
        const gesamtMin = w.gesamtMin || 100;
        await workflowPresetAendern(presetResult.preset.id, { arbeitMin: String(arbeitMin), pauseMin: String(pauseMin), gesamtMin: String(gesamtMin) });
        if (w.uhrzeit || w.wochentage?.length) {
          await workflowPlanHinzufuegen({
            presetId: presetResult.preset.id,
            wochentage: w.wochentage || [],
            uhrzeit: w.uhrzeit || "",
            gueltigVon: w.gueltigVon || "",
            gueltigBis: w.gueltigBis || "",
          });
        }
        aenderungVermerken({
          kategorie: "workflow",
          itemName: w.name,
          aktion: "hinzugefügt",
          detail: `${arbeitMin} Min. Arbeit / ${pauseMin} Min. Pause${w.uhrzeit ? ` · ${w.uhrzeit} Uhr` : ""}`,
        });
        return { bereich: "workflow", daten: { ...w, arbeitMin, pauseMin, gesamtMin } };
      }
      case "morgenroutine":
      case "abendroutine": {
        const routine = erkannterBereich === "morgenroutine" ? "morgen" : "abend";
        const schritte = await AIService.routineAusChat({ verlauf, coachName });
        for (const schritt of schritte) {
          const result = await routineSchrittHinzufuegen(routine, schritt.name, schritt.dauerMin || 5);
          if (result && !result.ok) throw new Error(result.error || "Speichern fehlgeschlagen.");
        }
        return { bereich: erkannterBereich, daten: schritte };
      }
      case "schichtplan": {
        // Schichtarbeit (25.09.): Varianten anlegen bzw. gleichnamige
        // aktualisieren, dann (falls genannt) den Rhythmus als Plan speichern.
        const heute = toLocalISODate(new Date());
        const erg = await AIService.schichtplanAusChat({ verlauf, coachName, heute });
        const alle = [...(routineVarianten || [])];
        for (const [i, v] of erg.varianten.entries()) {
          const vorhanden = alle.find((x) => x.name.toLowerCase() === String(v.name).toLowerCase());
          const vorlage = VORLAGEN.find((x) => x.name.toLowerCase() === String(v.name).toLowerCase());
          const r = await routineVarianteSpeichern({
            ...(vorhanden || {}),
            name: v.name,
            icon: vorhanden?.icon || vorlage?.icon || (/nacht/i.test(v.name) ? "🌙" : "🕐"),
            morgenStart: v.morgenStart || vorhanden?.morgenStart || "",
            abendStart: v.abendStart || vorhanden?.abendStart || "",
            arbeitVon: v.arbeitVon || vorhanden?.arbeitVon || "",
            arbeitBis: v.arbeitBis || vorhanden?.arbeitBis || "",
            reihenfolge: vorhanden?.reihenfolge ?? alle.length + i,
          });
          if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
          if (vorhanden) alle[alle.indexOf(vorhanden)] = r.variante;
          else alle.push(r.variante);
        }
        let planText = null;
        if (erg.rhythmus) {
          const start = erg.start && erg.start >= heute ? erg.start : plusTage(wochenBeginn(heute), 7);
          const wochen = Math.min(Math.max(erg.wochen || 4, 1), 26);
          const nachName = (n) => alle.find((x) => x.name.toLowerCase() === String(n).toLowerCase())?.id || null;
          const tage = planErzeugen({ rhythmus: erg.rhythmus, start, wochen, rollen: rollenZuordnung(alle), eigenesMuster: erg.eigenesMuster.map(nachName) });
          const r = await routineSchichtplanSpeichern(tage, tage[0].datum, tage.at(-1).datum);
          if (!r?.ok) throw new Error(r?.error || "Plan speichern fehlgeschlagen.");
          planText = `${tage[0].datum.split("-").reverse().join(".")} bis ${tage.at(-1).datum.split("-").reverse().join(".")}`;
        }
        aenderungVermerken({
          kategorie: "morgenroutine",
          itemName: "Schichtplan",
          aktion: "geändert",
          detail: `Per Aka: ${erg.varianten.map((v) => `${v.name} ☀ ${v.morgenStart || "–"}`).join(", ")}${planText ? ` · Plan ${planText}` : ""}`,
        });
        return { bereich: "schichtplan", daten: { varianten: erg.varianten, planText } };
      }
      case "atemroutine": {
        const zeiten = await AIService.atemroutineAusChat({ verlauf, coachName });
        const angelegt = [];
        for (const z of zeiten) {
          const u = bibliotheksUebung(z.uebung) || bibliotheksUebung("ruhig");
          const r = await atemZeitSpeichern({ uhrzeit: z.uhrzeit, uebungKey: u.key, dauerMinuten: z.dauerMinuten || u.dauerMinuten });
          if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
          angelegt.push({ uhrzeit: z.uhrzeit, name: u.name, dauerMinuten: z.dauerMinuten || u.dauerMinuten });
          aenderungVermerken({ kategorie: "atemuebung", itemName: "Atem-Routine", aktion: "hinzugefügt", detail: `Per Aka: ${z.uhrzeit} · ${u.name}` });
        }
        return { bereich: "atemroutine", daten: angelegt };
      }
      case "fokus": {
        const f = await AIService.fokusAusChat({ verlauf, coachName });
        const r = await fokusStarten({ ziel: f.ziel, dauerMinuten: f.dauerMinuten });
        if (!r?.ok) throw new Error(r?.error || "Starten fehlgeschlagen.");
        timerHinweisPlanen({ symbol: "🎯", name: r.sitzung.ziel || "Gemeinsam fokussieren", ende: sitzungEnde(r.sitzung) });
        return { bereich: "fokus", daten: r.sitzung };
      }
      case "matrix": {
        const liste = await AIService.matrixAusChat({ verlauf, coachName, heute: toLocalISODate(new Date()) });
        if (!liste.length) throw new Error("Ich habe keine Aufgabe erkannt.");
        const angelegt = [];
        for (const a of liste) {
          const r = await appData.matrixAufgabeSpeichern?.(a);
          if (r?.ok) angelegt.push(r.aufgabe);
        }
        if (!angelegt.length) throw new Error("Speichern fehlgeschlagen.");
        return { bereich: "matrix", daten: angelegt };
      }
      case "alltag": {
        const liste = await AIService.alltagAusChat({ verlauf, coachName, heute: toLocalISODate(new Date()) });
        if (!liste.length) throw new Error("Ich habe keinen Termin mit Uhrzeit und Tag erkannt.");
        const angelegt = [];
        for (const e of liste) {
          const r = await alltagSpeichern?.(e);
          if (r?.ok) angelegt.push(r.eintrag);
        }
        if (!angelegt.length) throw new Error("Speichern fehlgeschlagen.");
        // Überschneidungen mit Routinen und anderen Kalender-Einträgen melden.
        const alle = [...(alltagEintraege || []).filter((x) => !angelegt.some((a) => a.id === x.id)), ...angelegt];
        const fuer = (d) => bloeckeFuerTag(d, { routineEinstellungen: routineEinstellungen || {}, alltagEintraege: alle, alltagBereiche: alltagBereiche || [] });
        const konflikt = angelegt.flatMap((e) => konflikteFuerEintrag(e, fuer).map((t) => ({ eintrag: e.titel, mit: t.titel, tag: t.tag, von: t.start, bis: t.ende })));
        return { bereich: "alltag", daten: angelegt, konflikte: konflikt };
      }
      case "tagebuch": {
        const heute = toLocalISODate(new Date());
        const e = await AIService.tagebuchAusChat({ verlauf, coachName, optionen: { ...TAGEBUCH_OPTIONEN, stichworte: STICHWORTE } });
        const vorher = (tagebuchEintraege || []).find((x) => x.datum === heute);
        const r = await tagebuchSpeichern({ ...e, datum: heute, notizTeilen: vorher?.notizTeilen || false, auto: autoWerte(heute, appData) });
        if (!r?.ok) throw new Error(r?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "tagebuch", itemName: "Tagebuch", aktion: vorher ? "geändert" : "hinzugefügt", detail: `Per Aka: ${tagebuchZeile(r.eintrag)}` });
        return { bereich: "tagebuch", daten: r.eintrag };
      }
      case "aussehen": {
        const a = await AIService.aussehenAusChat({ verlauf, coachName });
        setzeAbendDunkelErlaubt(a.abendsDunkel);
        return { bereich: "aussehen", daten: a };
      }
      default:
        return { bereich: null };
    }
  };

  return { handleBefehl, handleBereitschaftPruefen, handleUniverselleUebernahme };
}
