import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";

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
};

// Geteilte Logik des universellen Coaches (anders als die Bereichs-Chats
// kennt er nicht von vornherein, worum es geht — erkennt den Bereich erst
// aus dem Gespräch und routet dann zur selben Extraktions-/Speicherfunktion
// wie der jeweilige Bereichs-Chat). Ursprünglich nur in HomeView.jsx, jetzt
// als Hook extrahiert, damit auch andere bereichsübergreifende Screens
// (Tagesplan, Wochenübersicht) denselben universellen Coach anbieten
// können, ohne die Routing-Logik zu duplizieren.
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
  } = useAppData();

  // Übergabe an <KiChat pruefeBereitschaft>: läuft im Hintergrund nach
  // jeder Coach-Antwort, damit der "Übernehmen"-Knopf nur erscheint, wenn
  // das Gespräch wirklich schon konkret genug ist — nicht schon nach
  // belanglosem Small Talk (siehe KiChat.jsx für die genaue Mechanik).
  const handleBereitschaftPruefen = async (verlauf) => {
    const { bereich } = await AIService.bereichErkennen({ verlauf, coachName: getCoachName() });
    return bereich === "keiner" ? null : bereich;
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
        const result = await supplementHinzufuegen({ name: s.name, tageszeiten: s.tageszeiten, hinweis: s.hinweis || "" });
        if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
        aenderungVermerken({ kategorie: "supplement", itemName: s.name, aktion: "hinzugefügt", detail: s.tageszeiten.join(", ") });
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
          await workflowPlanHinzufuegen({ presetId: presetResult.preset.id, wochentage: w.wochentage || [], uhrzeit: w.uhrzeit || "" });
        }
        aenderungVermerken({
          kategorie: "workflow",
          itemName: w.name,
          aktion: "hinzugefügt",
          detail: `${arbeitMin} Min. Arbeit / ${pauseMin} Min. Pause${w.uhrzeit ? ` · ${w.uhrzeit} Uhr` : ""}`,
        });
        return { bereich: "workflow", daten: { ...w, arbeitMin, pauseMin, gesamtMin } };
      }
      default:
        return { bereich: null };
    }
  };

  return { handleBereitschaftPruefen, handleUniverselleUebernahme };
}
