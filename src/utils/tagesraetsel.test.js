import { describe, expect, it } from "vitest";
import { TAGESRAETSEL_ZIEL, tageMitTagesraetsel, tagesraetselHeute } from "./tagesraetsel";

const um = (tag, stunde) => new Date(`${tag}T${String(stunde).padStart(2, "0")}:00:00`).toISOString();

describe("tagesraetsel", () => {
  it("zählt nur heutige Antworten, richtig und falsch", () => {
    const ergebnisse = [
      { erstelltAm: um("2026-09-24", 8), richtig: true },
      { erstelltAm: um("2026-09-24", 9), richtig: false },
      { erstelltAm: um("2026-09-23", 22), richtig: true },
    ];
    expect(tagesraetselHeute(ergebnisse, new Date("2026-09-24T12:00:00"))).toBe(2);
  });

  it("ein Tag gilt ab 5 Antworten als geschafft", () => {
    const voll = Array.from({ length: TAGESRAETSEL_ZIEL }, (_, i) => ({ erstelltAm: um("2026-09-22", 8 + i) }));
    const halb = Array.from({ length: TAGESRAETSEL_ZIEL - 1 }, (_, i) => ({ erstelltAm: um("2026-09-23", 8 + i) }));
    expect(tageMitTagesraetsel([...voll, ...halb])).toEqual(["2026-09-22"]);
  });
});
