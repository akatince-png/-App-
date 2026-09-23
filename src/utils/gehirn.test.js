import { describe, expect, it } from "vitest";
import { berechneGehirn } from "./gehirn";

const heute = new Date(2026, 8, 23, 12);

describe("berechneGehirn", () => {
  it("lädt Regionen mit den Tagen der letzten Woche auf und fasst Kategorien zusammen", () => {
    const g = berechneGehirn(
      [
        { key: "supplemente", tageListe: ["2026-09-23", "2026-09-22"], streak: 2 },
        { key: "hydration", tageListe: ["2026-09-22", "2026-09-20"], streak: 0 },
        { key: "training", tageListe: ["2026-09-23"], streak: 1 },
        { key: "schlaf", tageListe: ["2026-09-01"], streak: 0 },
      ],
      heute
    );
    const r = Object.fromEntries(g.regionen.map((x) => [x.key, x]));
    expect(r.energie).toMatchObject({ tageWoche: 3, zustand: "aktiv", serie: 2 });
    expect(r.energie.ladung).toBeCloseTo(3 / 7);
    expect(r.erholung).toMatchObject({ zustand: "ruht", tageWoche: 0, tageGesamt: 1 });
    expect(r.ruhe.zustand).toBe("leer");
    expect(g.verbindungen.find((v) => v.a === "bewegung" && v.b === "energie").aktiv).toBe(true);
    expect(g.verbindungen.find((v) => v.a === "rhythmus" && v.b === "erholung").aktiv).toBe(false);
    expect(g).toMatchObject({ aktiv: 2, genutzt: 3 });
  });

  it("zählt nie genutzte Regionen nicht in die Gesamtladung", () => {
    const g = berechneGehirn([{ key: "training", tageListe: ["2026-09-23"], streak: 1 }], heute);
    expect(g.gesamtLadung).toBeCloseTo(1 / 7);
  });
});

describe("berechneGehirnZeitraum", () => {
  it("lädt Regionen aus den Balken des Zeitraums und ergänzt Schlaf über die Tage", async () => {
    const { berechneGehirnZeitraum } = await import("./gehirn");
    const g = berechneGehirnZeitraum({
      widgets: [
        { kategorie: "supplement", aktiv: true, dailyCount: 1, dailyTotal: 2 },
        { kategorie: "hydration", aktiv: true, dailyCount: 2500, dailyTotal: 2500 },
        { kategorie: "training", aktiv: true, dailyCount: 0, dailyTotal: 1 },
        { kategorie: "tageslicht", aktiv: false, dailyCount: 0, dailyTotal: 1 },
      ],
      kategorien: [{ key: "schlaf", tageListe: ["2026-09-23", "2026-09-20"], streak: 1 }],
      tage: 7,
      heute,
    });
    const r = Object.fromEntries(g.regionen.map((x) => [x.key, x]));
    expect(r.energie.ladung).toBeCloseTo(0.75);
    expect(r.bewegung).toMatchObject({ zustand: "offen", ladung: 0 });
    expect(r.rhythmus.zustand).toBe("leer");
    expect(r.erholung.ladung).toBeCloseTo(2 / 7);
    expect(g.genutzt).toBe(3);
  });
});
