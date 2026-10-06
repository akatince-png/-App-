import { describe, expect, it } from "vitest";
import { zeigeMorgenFenster } from "./morgenFenster";

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
