import { describe, expect, it } from "vitest";
import { chatTagLabel, nachTagenGruppieren } from "./coachChat";

describe("Chat-Tagestrenner", () => {
  const heute = new Date(2026, 8, 24, 15);
  it("Heute, Gestern, sonst Wochentag + Datum", () => {
    expect(chatTagLabel(new Date(2026, 8, 24, 8).toISOString(), heute)).toBe("Heute");
    expect(chatTagLabel(new Date(2026, 8, 23, 20).toISOString(), heute)).toBe("Gestern");
    expect(chatTagLabel(new Date(2026, 8, 21, 9).toISOString(), heute)).toMatch(/21\.09\./);
  });
  it("gruppiert aufeinanderfolgende Nachrichten desselben Tages", () => {
    const n = (d, h) => ({ id: `${d}-${h}`, erstelltAm: new Date(2026, 8, d, h).toISOString() });
    const g = nachTagenGruppieren([n(23, 18), n(24, 8), n(24, 9)], heute);
    expect(g.map((x) => [x.label, x.nachrichten.length])).toEqual([
      ["Gestern", 1],
      ["Heute", 2],
    ]);
  });
});
