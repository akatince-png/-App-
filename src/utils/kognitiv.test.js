import { describe, it, expect } from "vitest";
import { naechstesLevel, stoppAuswerten, wechselAufgaben, wechselRichtig, zufallsZiffern, kognitivTage, ballParameter } from "./kognitiv";

describe("kognitiv", () => {
  it("Level: Start, hoch bei ≥ 80 %, runter unter 50 %, mit Grenzen", () => {
    expect(naechstesLevel([], "zahlen")).toBe(5);
    expect(naechstesLevel([{ spiel: "stopp", level: 3, richtig: 22, gesamt: 24, erstelltAm: "1" }], "stopp")).toBe(4);
    expect(naechstesLevel([{ spiel: "stopp", level: 3, richtig: 10, gesamt: 24, erstelltAm: "1" }], "stopp")).toBe(2);
    expect(naechstesLevel([{ spiel: "ball", level: 10, richtig: 5, gesamt: 5, erstelltAm: "1" }], "ball")).toBe(10);
  });
  it("Stopp-Spiel wertet Grün getippt / Rot ausgelassen als richtig", () => {
    const e = stoppAuswerten([
      { rot: false, getippt: true, ms: 300 },
      { rot: false, getippt: true, ms: 500 },
      { rot: true, getippt: true, ms: 200 },
      { rot: true, getippt: false, ms: null },
      { rot: false, getippt: false, ms: null },
    ]);
    expect(e).toEqual({ richtig: 3, gesamt: 5, reaktionMs: 400, zuFrueh: 1 });
  });
  it("Regel-Wechsel: nie die 5, Regeln richtig geprüft", () => {
    const a = wechselAufgaben(200, 5);
    expect(a.every((x) => x.zahl >= 1 && x.zahl <= 9 && x.zahl !== 5)).toBe(true);
    expect(wechselRichtig({ zahl: 4, regel: "paritaet" }, "gerade")).toBe(true);
    expect(wechselRichtig({ zahl: 7, regel: "groesse" }, "groesser")).toBe(true);
    expect(wechselRichtig({ zahl: 3, regel: "groesse" }, "groesser")).toBe(false);
  });
  it("Ziffern ohne direkte Wiederholung, Parameter wachsen", () => {
    const z = zufallsZiffern(50);
    expect(z.every((n, i) => i === 0 || n !== z[i - 1])).toBe(true);
    expect(ballParameter(8).ziele).toBeGreaterThan(ballParameter(1).ziele);
    expect(kognitivTage([{ erstelltAm: "2026-09-26T08:00:00" }, { erstelltAm: "2026-09-26T19:00:00" }])).toHaveLength(1);
  });
});
