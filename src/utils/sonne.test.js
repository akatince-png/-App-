import { describe, expect, it } from "vitest";
import { sonnenuntergang } from "./sonne";

// Sonnenuntergänge Hannover (UTC, ±5 Min.), hergeleitet aus Berlin (15 Min.
// weiter östlich): 25.10. ~16:05, 21.06. ~19:48, 21.12. ~15:09.
const utcMin = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();

describe("Sonnenuntergang Hannover (24.10.)", () => {
  it.each([
    [new Date(2026, 9, 25, 12), 16 * 60 + 5],
    [new Date(2026, 5, 21, 12), 19 * 60 + 48],
    [new Date(2026, 11, 21, 12), 15 * 60 + 9],
  ])("%s", (tag, erwartet) => {
    expect(Math.abs(utcMin(sonnenuntergang(tag)) - erwartet)).toBeLessThanOrEqual(5);
  });
});
