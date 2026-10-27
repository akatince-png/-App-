import { describe, expect, it } from "vitest";
import { zeigeMorgenFenster, zeigeRoutineFenster } from "./morgenFenster";

const offen = { anzahlGesamt: 5, abgeschlossen: false };
const um = (h, m = 0) => new Date(2026, 9, 7, h, m);

describe("zeigeMorgenFenster", () => {
  it("erscheint ab 1 Std. vor der Startzeit bis 14 Uhr", () => {
    expect(zeigeMorgenFenster({ jetzt: um(5, 59), startZeit: "07:00", status: offen, entscheidung: null })).toBe(false);
    expect(zeigeMorgenFenster({ jetzt: um(6, 0), startZeit: "07:00", status: offen, entscheidung: null })).toBe(true);
    expect(zeigeMorgenFenster({ jetzt: um(13, 59), startZeit: "07:00", status: offen, entscheidung: null })).toBe(true);
    expect(zeigeMorgenFenster({ jetzt: um(14, 0), startZeit: "07:00", status: offen, entscheidung: null })).toBe(false);
  });

  it("nicht, wenn heute schon entschieden, erledigt oder keine Schritte", () => {
    expect(zeigeMorgenFenster({ jetzt: um(8), startZeit: "07:00", status: offen, entscheidung: "nicht" })).toBe(false);
    expect(zeigeMorgenFenster({ jetzt: um(8), startZeit: "07:00", status: { anzahlGesamt: 5, abgeschlossen: true }, entscheidung: null })).toBe(false);
    expect(zeigeMorgenFenster({ jetzt: um(8), startZeit: "07:00", status: { anzahlGesamt: 0, abgeschlossen: false }, entscheidung: null })).toBe(false);
  });

  it("per Link (Kurzbefehl) immer, solange die Routine offen ist", () => {
    expect(zeigeMorgenFenster({ jetzt: um(20), startZeit: "07:00", status: offen, entscheidung: "nicht", erzwungen: true })).toBe(true);
  });

  it("ohne Startzeit ab 5 Uhr", () => {
    expect(zeigeMorgenFenster({ jetzt: um(4, 59), status: offen, entscheidung: null })).toBe(false);
    expect(zeigeMorgenFenster({ jetzt: um(5), status: offen, entscheidung: null })).toBe(true);
  });
});

describe("Abendfenster", () => {
  const abend = (h, m = 0) => new Date(2026, 9, 7, h, m);
  it("ab der Abend-Startzeit bis Mitternacht (seit 24.10. ohne Vorlauf)", () => {
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(21, 29), startZeit: "21:30", status: offen, entscheidung: null })).toBe(false);
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(21, 30), startZeit: "21:30", status: offen, entscheidung: null })).toBe(true);
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(23, 59), startZeit: "21:30", status: offen, entscheidung: null })).toBe(true);
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(9, 0), startZeit: "21:30", status: offen, entscheidung: null })).toBe(false);
  });
  it("ohne Startzeit ab 20 Uhr", () => {
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(19, 59), status: offen, entscheidung: null })).toBe(false);
    expect(zeigeRoutineFenster({ art: "abend", jetzt: abend(20, 0), status: offen, entscheidung: null })).toBe(true);
  });
});

describe("routineAusgelassen (27.10.)", () => {
  it("erkennt „heute ausgelassen“ aus dem Protokoll", async () => {
    const { routineAusgelassen } = await import("./morgenFenster");
    const heute = new Date(2026, 9, 27, 8, 30).toISOString();
    const p = [{ kategorie: "morgenroutine", aktion: "ausgefallen", erstelltAm: heute }];
    expect(routineAusgelassen(p, "morgen", "2026-10-27")).toBe(true);
    expect(routineAusgelassen(p, "abend", "2026-10-27")).toBe(false);
    expect(routineAusgelassen(p, "morgen", "2026-10-28")).toBe(false);
  });
});
