import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { VORLAGEN, planErzeugen, plusTage, rollenZuordnung, wochenBeginn } from "../utils/schichtplan";

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
      default:
        return { bereich: null };
    }
  };

  return { handleBereitschaftPruefen, handleUniverselleUebernahme };
}
