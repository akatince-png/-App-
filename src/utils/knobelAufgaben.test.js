import { describe, it, expect } from "vitest";
import { knobelAufgabe, knobelLevel, KNOBEL_START } from "./knobelAufgaben";

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

describe("knobelAufgaben", () => {
  it("erzeugt immer 4 verschiedene Antworten mit gültiger richtiger Position", () => {
    for (let level = 1; level <= 10; level++) {
      for (let seed = 1; seed <= 300; seed++) {
        const a = knobelAufgabe(level, seeded(seed * 31 + level));
        expect(a.antworten).toHaveLength(4);
        expect(new Set(a.antworten).size).toBe(4);
        expect(a.richtig).toBeGreaterThanOrEqual(0);
        expect(a.richtig).toBeLessThan(4);
        expect(a.frage.length).toBeGreaterThan(5);
        expect(a.antworten.every((x) => !/NaN|undefined|Infinity/.test(x))).toBe(true);
      }
    }
  });
  it("rechnet Kopfrechnen richtig", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const a = knobelAufgabe(3, seeded(seed));
      const m = a.frage.match(/^(\d+) × (\d+) − (\d+) = \?$/);
      if (m) expect(a.antworten[a.richtig]).toBe(String(+m[1] * +m[2] - +m[3]));
    }
  });
  it("Level steigt nach 10 guten Antworten und sinkt nach schwachen", () => {
    const gut = Array.from({ length: 10 }, (_, i) => ({ kategorie: "knobel", richtig: true, erstelltAm: `2026-09-26T10:${String(i).padStart(2, "0")}` }));
    expect(knobelLevel(gut)).toBe(KNOBEL_START + 1);
    const schwach = gut.map((e, i) => ({ ...e, richtig: i < 3 }));
    expect(knobelLevel(schwach)).toBe(KNOBEL_START - 1);
    expect(knobelLevel([])).toBe(KNOBEL_START);
  });
});
