import { describe, it, expect, vi } from "vitest";
import { berechneWochenStats } from "./gnadentag";

vi.mock("./dayItems", () => ({ buildDayItems: vi.fn() }));
import { buildDayItems } from "./dayItems";

const buildDayItemsMock = vi.mocked(buildDayItems);

describe("berechneWochenStats", () => {
  it("zählt einen Tag ohne geplante Punkte als aktiv, nicht als Pause", () => {
    buildDayItemsMock.mockReturnValue([]);
    const stats = berechneWochenStats({}, new Date(2026, 0, 15));
    expect(stats).toEqual({ completedDays: 7, pauseDays: 0, totalDays: 7 });
  });

  it("zählt einen Tag mit 50%+ erledigten Punkten als aktiv", () => {
    buildDayItemsMock.mockReturnValue([
      { kategorie: "supplement", name: "Vitamin D", done: true },
      { kategorie: "supplement", name: "Magnesium", done: false },
    ]);
    const stats = berechneWochenStats({}, new Date(2026, 0, 15));
    expect(stats).toEqual({ completedDays: 7, pauseDays: 0, totalDays: 7 });
  });

  it("zählt einen Tag mit weniger als 50% erledigten Punkten als Pause, nicht als Fehlschlag", () => {
    buildDayItemsMock.mockReturnValue([
      { kategorie: "supplement", name: "Vitamin D", done: false },
      { kategorie: "supplement", name: "Magnesium", done: false },
      { kategorie: "training", name: "Krafttraining", done: true },
    ]);
    const stats = berechneWochenStats({}, new Date(2026, 0, 15));
    expect(stats).toEqual({ completedDays: 0, pauseDays: 7, totalDays: 7 });
  });

  it("prüft genau die letzten 7 Tage, nicht den heutigen (noch nicht vorbeien) Tag", () => {
    berechneWochenStats({}, new Date(2026, 0, 15));
    expect(buildDayItems).toHaveBeenCalledTimes(7);
  });

  it("zählt Tage vor dem Protokollstart nicht mit (neues Konto hat keine Schein-Pausen)", () => {
    buildDayItemsMock.mockReturnValue([{ kategorie: "supplement", name: "Vitamin D", done: false }]);
    const heute = new Date(2026, 0, 15);
    expect(berechneWochenStats({ aktivesHauptprotokoll: { startdatum: "2026-01-15" } }, heute)).toEqual({ completedDays: 0, pauseDays: 0, totalDays: 0 });
    expect(berechneWochenStats({ startdatum: "2026-01-13" }, heute)).toEqual({ completedDays: 0, pauseDays: 2, totalDays: 2 });
  });
});
