import { describe, it, expect } from "vitest";
import { winkel, gelenkWinkel, neuerZaehler, zaehlerSchritt, kameraUebungFuer } from "./wiederholungZaehler";

describe("wiederholungZaehler", () => {
  it("berechnet Winkel", () => {
    expect(Math.round(winkel({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }))).toBe(90);
    expect(Math.round(winkel({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }))).toBe(180);
  });
  it("ordnet Übungsnamen zu", () => {
    expect(kameraUebungFuer("Kniebeugen")).toBe("kniebeuge");
    expect(kameraUebungFuer("Push-ups")).toBe("liegestuetz");
    expect(kameraUebungFuer("Kettlebell Swing")).toBe("swing");
    expect(kameraUebungFuer("Plank")).toBe(null);
  });
  it("zählt nur volle Bewegungen (unten → oben) mit Mindestabstand", () => {
    let z = neuerZaehler();
    const folge = [170, 150, 95, 90, 120, 165, 170, 100, 160, 90, 170];
    folge.forEach((w, i) => (z = zaehlerSchritt(z, w, "kniebeuge", i * 400)));
    expect(z.anzahl).toBe(3);
    // halbe Bewegung zählt nicht
    let h = neuerZaehler();
    [170, 130, 170, 125, 170].forEach((w, i) => (h = zaehlerSchritt(h, w, "kniebeuge", i * 400)));
    expect(h.anzahl).toBe(0);
    // zu schnelles Wackeln zählt nicht doppelt
    let s = neuerZaehler();
    [170, 90, 170, 90, 170].forEach((w, i) => (s = zaehlerSchritt(s, w, "kniebeuge", i * 50)));
    expect(s.anzahl).toBe(1);
  });
  it("ignoriert schlecht sichtbare Punkte", () => {
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.2 }));
    expect(gelenkWinkel(lm, "kniebeuge")).toBe(null);
  });
});
