import { describe, expect, it } from "vitest";
import { alltagAmTag, bloeckeFuerTag, monatsRaster, spaltenVerteilen } from "./kalender";

const mo = new Date(2026, 8, 28); // Montag

describe("Kalender Mein Alltag", () => {
  it("Alltags-Einträge gelten wöchentlich oder einmalig", () => {
    expect(alltagAmTag({ wochentage: ["Mo", "Mi"] }, mo)).toBe(true);
    expect(alltagAmTag({ wochentage: ["Sa"] }, mo)).toBe(false);
    expect(alltagAmTag({ datum: "2026-09-28" }, mo)).toBe(true);
  });

  it("Tag: Routinen, Tagesplan und Alltag als Blöcke, sortiert", () => {
    const b = bloeckeFuerTag(mo, {
      routineEinstellungen: { morgen: { startZeit: "06:30", endZeit: "07:30" }, abend: { startZeit: "21:30", endZeit: "22:30" } },
      items: [{ key: "m1", kategorie: "mahlzeit", uhrzeit: "12:30", name: "Mittagessen" }],
      alltagEintraege: [{ id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:00", ende: "16:30", wochentage: ["Mo"] }],
    });
    expect(b.map((x) => [x.titel, x.start, x.ende])).toEqual([
      ["Morgenroutine", 390, 450],
      ["Arbeit", 480, 990],
      ["Mittagessen", 750, 780],
      ["Abendroutine", 1290, 1350],
    ]);
  });

  it("Überlappungen nebeneinander", () => {
    const s = spaltenVerteilen([
      { key: "a", start: 480, ende: 990 },
      { key: "b", start: 750, ende: 780 },
      { key: "c", start: 1000, ende: 1060 },
    ]);
    expect(s.map((x) => [x.key, x.spalte, x.spalten])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ]);
  });

  it("Monatsraster beginnt am Montag", () => {
    const r = monatsRaster(2026, 8); // September 2026, 1. = Dienstag
    expect(r[0][0]).toBeNull();
    expect(r[0][1].getDate()).toBe(1);
    expect(r.every((w) => w.length === 7)).toBe(true);
  });
});

describe("Aka-Antwort für den Kalender prüfen", () => {
  it("übernimmt gültige Einträge, ergänzt Endzeit, verwirft Unvollständiges", async () => {
    const { alltagEintraegeBereinigen } = await import("./kalender");
    const r = alltagEintraegeBereinigen([
      { bereich: "haushalt", titel: "Staubsaugen", start: "10:00", wochentage: ["Sa"] },
      { bereich: "quatsch", titel: "Zahnarzt", start: "15:00", ende: "16:00", datum: "2026-10-30", wochentage: ["Mo"] },
      { bereich: "hobby", titel: "", start: "18:00", wochentage: ["Di"] },
      { bereich: "hobby", titel: "Gitarre", start: "18 Uhr", wochentage: ["Di"] },
    ]);
    expect(r).toEqual([
      { bereich: "haushalt", titel: "Staubsaugen", start: "10:00", ende: "11:00", wochentage: ["Sa"], datum: null, erinnerung: true },
      { bereich: "termin", titel: "Zahnarzt", start: "15:00", ende: "16:00", wochentage: [], datum: "2026-10-30", erinnerung: true },
    ]);
  });
});
