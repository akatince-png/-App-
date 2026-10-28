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

describe("Sonnenaufgang (28.10.)", () => {
  it("liegt in Hannover Ende Oktober zwischen 7 und 8 Uhr (MEZ/MESZ)", async () => {
    const { sonnenaufgang } = await import("./sonne");
    const d = sonnenaufgang(new Date(2026, 9, 28, 12));
    const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
    expect(utcMin).toBeGreaterThan(6 * 60 - 20); // ca. 06:15 UTC = 07:15 MEZ
    expect(utcMin).toBeLessThan(6 * 60 + 40);
  });
  it("erkennt den Tageslicht-Schritt", async () => {
    const { istLichtSchritt } = await import("./sonne");
    expect(istLichtSchritt({ kernKey: "licht" })).toBe(true);
    expect(istLichtSchritt({ name: "☀️ Tageslicht – draußen" })).toBe(true);
    expect(istLichtSchritt({ name: "💧 Glas Wasser" })).toBe(false);
  });
});
