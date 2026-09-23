import { describe, expect, it } from "vitest";
import { levelAusPunkten, levelFortschritt } from "./level";

describe("levelAusPunkten", () => {
  it("startet bei Level 1 und steigt an den Punkte-Schwellen", () => {
    expect(levelAusPunkten(0)).toMatchObject({ level: 1, start: 0, ziel: 50 });
    expect(levelAusPunkten(49).level).toBe(1);
    expect(levelAusPunkten(50)).toMatchObject({ level: 2, start: 50, ziel: 100 });
    expect(levelAusPunkten(260)).toMatchObject({ level: 4, start: 250, ziel: 500 });
  });
  it("zählt nach der letzten Schwelle alle 1000 Punkte weiter", () => {
    expect(levelAusPunkten(2500)).toMatchObject({ level: 7, start: 2500, ziel: 3500 });
    expect(levelAusPunkten(3600)).toMatchObject({ level: 8, start: 3500, ziel: 4500 });
  });
  it("berechnet den Fortschritt zum nächsten Level", () => {
    expect(levelFortschritt(levelAusPunkten(75))).toBeCloseTo(0.5);
    expect(levelFortschritt(levelAusPunkten(undefined))).toBe(0);
  });
});
