import { describe, expect, it } from "vitest";
import { dauerAusVonBis, ereignisseAmTag, nickerchenBeginn } from "./ereignisse";

describe("ereignisseAmTag", () => {
  it("macht aus Spontan-Einträgen und Essen Blöcke mit Uhrzeit, sortiert", () => {
    const l = ereignisseAmTag("2026-09-30", {
      spontanEintraege: [
        { id: 1, art: "nickerchen", datum: "2026-09-30", uhrzeit: "14:10", dauerMin: 20 },
        { id: 2, art: "getraenk", datum: "2026-09-30", uhrzeit: "09:05", mengeMl: 330 },
        { id: 3, art: "einnahme", datum: "2026-09-30", uhrzeit: "17:00", name: "Pre-Workout" },
        { id: 4, art: "einnahme", datum: "2026-09-29", uhrzeit: "17:00", name: "Gestern" },
      ],
      essenEintraege: [{ id: 9, datum: "2026-09-30", uhrzeit: "10:30", text: "Apfel", werte: { kcal: 72.4 } }],
    });
    expect(l.map((e) => e.titel)).toEqual(["330 ml Getränk", "Apfel · 72 kcal", "Nickerchen 20 Min.", "Pre-Workout"]);
    expect(l[2]).toMatchObject({ start: 14 * 60 + 10, ende: 14 * 60 + 30, kategorie: "schlaf" });
  });
});

describe("Nickerchen-Zeiten", () => {
  it("Beginn = jetzt minus Dauer", () => {
    expect(nickerchenBeginn(new Date(2026, 8, 30, 15, 0), 30)).toBe("14:30");
  });
  it("Dauer aus von–bis, auch über Mitternacht", () => {
    expect(dauerAusVonBis("13:40", "14:05")).toBe(25);
    expect(dauerAusVonBis("23:50", "00:20")).toBe(30);
    expect(dauerAusVonBis("13:40", "13:40")).toBe(null);
  });
});
