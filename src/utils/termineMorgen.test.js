import { describe, expect, it } from "vitest";
import { hinweisInhalt, hinweisSatz, offenerRoutineHinweis, termineAmTag } from "./termineMorgen";

const so = new Date(2026, 10, 15, 21, 0); // So 15.11.2026, 21:00
const mo = new Date(2026, 10, 16, 12, 0);

const alltagEintraege = [
  { id: 1, bereich: "eigen", titel: "🏫 Hilfeplangespräch", start: "13:15", ende: "14:45", datum: "2026-11-16", wochentage: [], erinnerung: true, notiz: "❗ Wichtig" },
  { id: 2, bereich: "eigen", titel: "💊 Dosetten stellen", start: "20:00", datum: null, wochentage: ["Mo"], erinnerung: true },
  { id: 3, bereich: "termin", titel: "Physio", start: "08:00", datum: null, wochentage: ["Mo"], erinnerung: true },
  { id: 4, bereich: "termin", titel: "Alt", start: "09:00", datum: "2026-11-16", wochentage: [], erinnerung: false },
];
const matrixAufgaben = [{ id: 9, art: "termin", titel: "Anruf Anwalt", geplantAm: "2026-11-16", uhrzeit: "10:00" }];

describe("Termine für die Routine-Erinnerung", () => {
  it("einmalige Einträge, wöchentliche nur aus Bereich Termin, ohne erinnerung:false, sortiert", () => {
    const t = termineAmTag(mo, { alltagEintraege, matrixAufgaben });
    expect(t.map((x) => [x.zeit, x.titel, x.wichtig])).toEqual([
      ["08:00", "Physio", false],
      ["10:00", "Anruf Anwalt", false],
      ["13:15", "🏫 Hilfeplangespräch", true],
    ]);
  });

  it("Abendroutine: nur morgen", () => {
    const inhalt = hinweisInhalt("abend", { alltagEintraege, matrixAufgaben }, so);
    expect(inhalt.heute).toEqual([]);
    expect(inhalt.morgen).toHaveLength(3);
  });

  it("Morgenroutine: morgen plus restliche Termine von heute", () => {
    const inhalt = hinweisInhalt("morgen", { alltagEintraege, matrixAufgaben }, mo);
    expect(inhalt.heute.map((x) => x.titel)).toEqual(["🏫 Hilfeplangespräch"]);
  });

  it("Hinweis nur kurz nach dem Abschluss und nur einmal", () => {
    const d = [{ routine: "abend", datum: "2026-11-15", abgeschlossenUm: new Date(2026, 10, 15, 20, 50).toISOString() }];
    expect(offenerRoutineHinweis(d, { jetzt: so })).toEqual({ routine: "abend", schluessel: "2026-11-15|abend" });
    expect(offenerRoutineHinweis(d, { jetzt: so, gezeigt: new Set(["2026-11-15|abend"]) })).toBeNull();
    expect(offenerRoutineHinweis(d, { jetzt: new Date(2026, 10, 15, 23, 30) })).toBeNull();
  });

  it("Satz zum Vorlesen", () => {
    expect(hinweisSatz([{ zeit: "09:00", titel: "Bürgeramt" }])).toBe("Denk dran, morgen: 9:00 Uhr Bürgeramt.");
    expect(hinweisSatz([])).toBe("Morgen stehen keine Termine an.");
  });
});
