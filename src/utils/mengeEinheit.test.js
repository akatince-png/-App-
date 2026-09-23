import { describe, expect, it } from "vitest";
import { mengeMitEinheit, mengeOhneEinheit } from "./mengeEinheit";

describe("mengeOhneEinheit", () => {
  it("erkennt nackte Zahlen", () => {
    expect(mengeOhneEinheit("250")).toBe(true);
    expect(mengeOhneEinheit(" 0,25 ")).toBe(true);
    expect(mengeOhneEinheit("2.5")).toBe(true);
  });
  it("lässt Angaben mit Einheit und leere Felder durch", () => {
    expect(mengeOhneEinheit("250 mcg")).toBe(false);
    expect(mengeOhneEinheit("1 Tablette")).toBe(false);
    expect(mengeOhneEinheit("")).toBe(false);
    expect(mengeOhneEinheit(undefined)).toBe(false);
  });
});

describe("mengeMitEinheit", () => {
  it("hängt die Einheit mit Leerzeichen an", () => {
    expect(mengeMitEinheit(" 250 ", "mcg")).toBe("250 mcg");
  });
});
