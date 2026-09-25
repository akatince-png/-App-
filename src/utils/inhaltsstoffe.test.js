import { describe, it, expect } from "vitest";
import { formZuEinnahmeart, inhaltsstoffZeile, inhaltsstoffeText } from "./inhaltsstoffe";

describe("inhaltsstoffe", () => {
  it("formatiert je Einnahme mit Komma und Einheit", () => {
    expect(inhaltsstoffZeile({ name: "Magnesium", menge: 450, einheit: "mg" })).toBe("Magnesium 450 mg");
    expect(inhaltsstoffZeile({ name: "Vitamin D3", menge: 12.5, einheit: "µg" })).toBe("Vitamin D3 12,5 µg");
    expect(inhaltsstoffZeile({ name: "Aroma", menge: 0, einheit: "" })).toBe("Aroma");
  });
  it("kürzt lange Listen (Pre-Workout)", () => {
    const l = Array.from({ length: 8 }, (_, i) => ({ name: `Stoff ${i + 1}`, menge: 1, einheit: "g" }));
    expect(inhaltsstoffeText(l, 6)).toMatch(/Stoff 6 1 g · \+2 weitere$/);
  });
  it("übernimmt nur bekannte Einnahmearten", () => {
    expect(formZuEinnahmeart("Kapsel", ["Kapsel", "Pulver"])).toBe("Kapsel");
    expect(formZuEinnahmeart("Sonstiges", ["Kapsel"])).toBe(null);
  });
});
