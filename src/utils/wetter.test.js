import { describe, expect, it } from "vitest";
import { besteLichtZeit, himmel, lichtTipp, stundenFuerTag } from "./wetter";

// Open-Meteo-Antwort im Kleinen: 28.10., morgens bedeckt, mittags sonnig.
const wolken = [100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 70, 40, 15, 10, 20, 60, 80, 90, 100, 100, 100, 100, 100, 100];
const DATEN = {
  hourly: {
    time: wolken.map((_, i) => `2026-10-28T${String(i).padStart(2, "0")}:00`),
    cloud_cover: wolken,
    precipitation_probability: wolken.map(() => 0),
  },
};

describe("Wetter für Tageslicht (28.10.)", () => {
  it("liest die Stunden eines Tages", () => {
    expect(stundenFuerTag(DATEN, "2026-10-28")).toHaveLength(24);
    expect(stundenFuerTag(DATEN, "2026-10-29")).toHaveLength(0);
  });
  it("findet das sonnigste 2-Stunden-Fenster nach Sonnenaufgang", () => {
    const tag = new Date(2026, 9, 28, 6, 0);
    const b = besteLichtZeit(stundenFuerTag(DATEN, "2026-10-28"), tag, tag);
    expect(b.von).toBe(12);
    expect(b.bis).toBe(14);
  });
  it("schaut heute nur nach vorn", () => {
    const tag = new Date(2026, 9, 28, 15, 0);
    const b = besteLichtZeit(stundenFuerTag(DATEN, "2026-10-28"), tag, tag);
    expect(b.von).toBeGreaterThanOrEqual(15);
  });
  it("beschreibt den Himmel und gibt einen Tipp", () => {
    expect(himmel(10)).toBe("sonnig");
    expect(himmel(95)).toBe("bedeckt");
    expect(himmel(10, 70)).toBe("Regen wahrscheinlich");
    const tag = new Date(2026, 9, 28, 6, 0);
    expect(lichtTipp(DATEN, tag, tag).text).toContain("12–14 Uhr");
    expect(lichtTipp(null, tag, tag)).toBeNull();
  });
});

describe("Fenster endet vor Sonnenuntergang (28.10., Foto Nutzerin: „16–18 Uhr“ bei Untergang 17:00)", () => {
  it("schlägt nichts nach Sonnenuntergang vor", () => {
    const klar = { hourly: { time: DATEN.hourly.time, cloud_cover: DATEN.hourly.time.map((_, i) => (i >= 16 ? 0 : 50)), precipitation_probability: DATEN.hourly.time.map(() => 0) } };
    const tag = new Date(2026, 9, 28, 6, 0);
    const b = besteLichtZeit(stundenFuerTag(klar, "2026-10-28"), tag, tag);
    expect(b.bis).toBeLessThanOrEqual(17);
  });
});
