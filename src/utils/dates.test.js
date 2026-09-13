import { describe, it, expect, vi, afterEach } from "vitest";
import {
  sameDay,
  addDays,
  keyOf,
  toLocalISODate,
  parseLocalISODate,
  zaehleTageStreak,
  verspaetungText,
} from "./dates";

describe("sameDay", () => {
  it("erkennt denselben Kalendertag trotz unterschiedlicher Uhrzeit", () => {
    expect(sameDay(new Date(2026, 0, 15, 8, 0), new Date(2026, 0, 15, 23, 59))).toBe(true);
  });
  it("erkennt unterschiedliche Tage", () => {
    expect(sameDay(new Date(2026, 0, 15), new Date(2026, 0, 16))).toBe(false);
  });
});

describe("addDays", () => {
  it("addiert Tage, auch über Monatsgrenzen hinweg", () => {
    const ergebnis = addDays(new Date(2026, 0, 30), 3);
    expect(ergebnis.getMonth()).toBe(1);
    expect(ergebnis.getDate()).toBe(2);
  });
  it("verändert das Ausgangsdatum nicht (keine Mutation)", () => {
    const original = new Date(2026, 0, 30);
    addDays(original, 5);
    expect(original.getDate()).toBe(30);
  });
});

describe("keyOf", () => {
  it("baut einen eindeutigen Schlüssel mit Uhrzeit", () => {
    const d = new Date(2026, 0, 15);
    expect(keyOf(d, "peptid-x", "08:00")).toBe(`${d.toDateString()}__peptid-x__08:00`);
  });
  it("lässt die Uhrzeit weg, wenn keine übergeben wird", () => {
    const d = new Date(2026, 0, 15);
    expect(keyOf(d, "peptid-x")).toBe(`${d.toDateString()}__peptid-x`);
  });
});

describe("toLocalISODate / parseLocalISODate", () => {
  it("sind zueinander invers (Rundreise verliert keinen Tag)", () => {
    const d = new Date(2026, 0, 15);
    expect(parseLocalISODate(toLocalISODate(d)).toDateString()).toBe(d.toDateString());
  });

  it("parseLocalISODate liefert LOKALE Mitternacht, nicht UTC (Bug-Fix, siehe Kommentar in dates.js)", () => {
    // Der eigentliche Bug: new Date("2026-01-15") (ohne Uhrzeit) parst als
    // UTC-Mitternacht, was in jeder Zeitzone westlich von UTC auf den
    // 14.01. lokal zurückfällt. parseLocalISODate() muss das vermeiden.
    const d = parseLocalISODate("2026-01-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it("toLocalISODate füllt Monat/Tag einstellig korrekt mit führender Null", () => {
    expect(toLocalISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("zaehleTageStreak", () => {
  afterEach(() => vi.useRealTimers());

  it("zählt 0, wenn weder heute noch gestern erledigt wurde", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0));
    expect(zaehleTageStreak(() => false)).toBe(0);
  });

  it("zählt rückwärts von heute, solange pruefeTag() true liefert", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0));
    const erledigt = new Set(["2026-01-15", "2026-01-14", "2026-01-13"]);
    expect(zaehleTageStreak((datum) => erledigt.has(datum))).toBe(3);
  });

  it("zählt ab gestern, wenn heute noch nicht erledigt ist (Tag ist ja noch nicht vorbei)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0));
    const erledigt = new Set(["2026-01-14", "2026-01-13"]);
    expect(zaehleTageStreak((datum) => erledigt.has(datum))).toBe(2);
  });
});

describe("verspaetungText", () => {
  it("liefert null ohne geplante Uhrzeit", () => {
    expect(verspaetungText(null)).toBeNull();
  });

  it("liefert null innerhalb der 5-Minuten-Toleranz", () => {
    const jetzt = new Date(2026, 0, 15, 20, 4);
    expect(verspaetungText("20:00", jetzt)).toBeNull();
  });

  it("meldet Minuten bei Verspätung unter einer Stunde", () => {
    const jetzt = new Date(2026, 0, 15, 20, 30);
    expect(verspaetungText("20:00", jetzt)).toBe("30 Min. später als geplant");
  });

  it("meldet Stunden und Minuten bei Verspätung ab einer Stunde", () => {
    const jetzt = new Date(2026, 0, 15, 22, 15);
    expect(verspaetungText("20:00", jetzt)).toBe("2 Std. 15 Min. später als geplant");
  });

  it("lässt volle Stunden ohne Minuten-Zusatz", () => {
    const jetzt = new Date(2026, 0, 15, 22, 0);
    expect(verspaetungText("20:00", jetzt)).toBe("2 Std. später als geplant");
  });
});
