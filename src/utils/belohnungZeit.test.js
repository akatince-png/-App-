import { describe, it, expect } from "vitest";
import { istRechtzeitig } from "./belohnungZeit";

describe("istRechtzeitig", () => {
  it("gilt als rechtzeitig ohne geplante Uhrzeit", () => {
    expect(istRechtzeitig(null, 10)).toBe(true);
    expect(istRechtzeitig("", 10)).toBe(true);
  });

  it("gilt als rechtzeitig bei ungültigem Uhrzeit-Format", () => {
    expect(istRechtzeitig("Mittags", 10)).toBe(true);
  });

  it("früher als geplant zählt immer als rechtzeitig", () => {
    const jetzt = new Date(2026, 0, 15, 7, 55);
    expect(istRechtzeitig("08:00", 10, jetzt)).toBe(true);
  });

  it("exakt zur geplanten Uhrzeit zählt als rechtzeitig", () => {
    const jetzt = new Date(2026, 0, 15, 8, 0);
    expect(istRechtzeitig("08:00", 10, jetzt)).toBe(true);
  });

  it("innerhalb des Puffers zählt als rechtzeitig", () => {
    const jetzt = new Date(2026, 0, 15, 8, 10);
    expect(istRechtzeitig("08:00", 10, jetzt)).toBe(true);
  });

  it("genau am Pufferende zählt noch als rechtzeitig (<=, nicht <)", () => {
    const jetzt = new Date(2026, 0, 15, 8, 10, 0, 0);
    expect(istRechtzeitig("08:00", 10, jetzt)).toBe(true);
  });

  it("eine Minute nach Pufferende zählt als zu spät", () => {
    const jetzt = new Date(2026, 0, 15, 8, 11);
    expect(istRechtzeitig("08:00", 10, jetzt)).toBe(false);
  });

  it("negativer/fehlender Puffer wird wie 0 behandelt, nicht als Freifahrtschein", () => {
    const jetzt = new Date(2026, 0, 15, 8, 1);
    expect(istRechtzeitig("08:00", -5, jetzt)).toBe(false);
    expect(istRechtzeitig("08:00", undefined, jetzt)).toBe(false);
  });

  it("Puffer 0 lässt nur die exakte Uhrzeit als rechtzeitig gelten", () => {
    expect(istRechtzeitig("08:00", 0, new Date(2026, 0, 15, 8, 0))).toBe(true);
    expect(istRechtzeitig("08:00", 0, new Date(2026, 0, 15, 8, 1))).toBe(false);
  });
});
