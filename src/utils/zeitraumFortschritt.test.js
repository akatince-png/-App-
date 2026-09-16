import { describe, it, expect, vi, afterEach } from "vitest";
import { widgetsFuerZeitraum, gesamtVerfuegbar } from "./zeitraumFortschritt";

const HEUTE = new Date(2026, 8, 16, 12, 0); // 16.09.2026

function widget(overrides) {
  return { name: "Supplemente", kategorie: "supplement", aktiv: true, dailyCount: 1, dailyTotal: 1, ...overrides };
}

describe("widgetsFuerZeitraum", () => {
  afterEach(() => vi.useRealTimers());

  it("gibt die Widgets für 'tag' unverändert zurück", () => {
    const widgets = [widget()];
    expect(widgetsFuerZeitraum("tag", widgets, {}, null, HEUTE)).toBe(widgets);
  });

  it("zählt für 'woche' die erledigten Tage der letzten 7 Tage aus supplementErledigt", () => {
    const quellen = {
      supplementErledigt: {
        "2026-09-16__vitD": true, // heute
        "2026-09-15__vitD": true, // gestern
        "2026-09-08__vitD": true, // außerhalb der letzten 7 Tage (Fenster: 10.-16.9.)
      },
    };
    const ergebnis = widgetsFuerZeitraum("woche", [widget()], quellen, "2026-01-01", HEUTE);
    expect(ergebnis[0].dailyCount).toBe(2);
    expect(ergebnis[0].dailyTotal).toBe(7);
  });

  it("deckelt den Nenner auf die Tage seit Protokollstart, wenn das Protokoll jünger als der Zeitraum ist", () => {
    const quellen = {
      supplementErledigt: {
        "2026-09-16__vitD": true,
        "2026-09-15__vitD": true,
      },
    };
    // Protokoll erst seit dem 15.09. aktiv -> 2 Tage seit Start (15. + 16.),
    // nicht die vollen 7 der Wochenansicht.
    const ergebnis = widgetsFuerZeitraum("woche", [widget()], quellen, "2026-09-15", HEUTE);
    expect(ergebnis[0].dailyTotal).toBe(2);
    expect(ergebnis[0].dailyCount).toBe(2);
  });

  it("markiert Kategorien ohne Erfolge-Mapping (z. B. Bildschirmzeit) für Zeitraum-Ansichten als inaktiv", () => {
    const ergebnis = widgetsFuerZeitraum("monat", [widget({ kategorie: "bildschirmzeit" })], {}, "2026-01-01", HEUTE);
    expect(ergebnis[0].aktiv).toBe(false);
  });

  it("lässt bereits inaktive Widgets inaktiv", () => {
    const ergebnis = widgetsFuerZeitraum("woche", [widget({ aktiv: false })], {}, "2026-01-01", HEUTE);
    expect(ergebnis[0].aktiv).toBe(false);
  });

  it("'gesamt' nutzt die volle Protokolllaufzeit als Nenner", () => {
    const quellen = { supplementErledigt: { "2026-09-16__vitD": true } };
    const ergebnis = widgetsFuerZeitraum("gesamt", [widget()], quellen, "2026-07-01", HEUTE);
    // 1. Juli bis 16. September = 78 Tage.
    expect(ergebnis[0].dailyTotal).toBe(78);
    expect(ergebnis[0].dailyCount).toBe(1);
  });
});

describe("gesamtVerfuegbar", () => {
  it("ist falsch ohne Startdatum", () => {
    expect(gesamtVerfuegbar(null, HEUTE)).toBe(false);
  });

  it("ist falsch, wenn das Protokoll noch nicht länger als einen Monat läuft", () => {
    expect(gesamtVerfuegbar("2026-08-20", HEUTE)).toBe(false); // 27 Tage
  });

  it("ist wahr, sobald das Protokoll länger als einen Monat läuft", () => {
    expect(gesamtVerfuegbar("2026-08-01", HEUTE)).toBe(true); // 46 Tage
  });
});
