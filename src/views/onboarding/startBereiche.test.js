import { describe, expect, it } from "vitest";
import { START_BEREICHE, vorschlaegeAusZielen } from "./startBereiche";
import { CATEGORY_STEPS } from "./categorySteps";

describe("startBereiche", () => {
  it("schlägt ohne Ziele Routinen und Medikamente vor", () => {
    expect(vorschlaegeAusZielen([])).toEqual(["routinen", "medikamente"]);
  });
  it("leitet Vorschläge aus den Zielen ab (höchstens 2)", () => {
    expect(vorschlaegeAusZielen(["Muskelaufbau", "Gewichtsabnahme"])).toEqual(["training", "ernaehrung"]);
  });
  it("jeder Bereich außer Routinen ist ein echter Kategorie-Schritt", () => {
    const schritte = CATEGORY_STEPS.map((s) => s.key);
    START_BEREICHE.filter((b) => b.key !== "routinen").forEach((b) => expect(schritte).toContain(b.key));
    expect(START_BEREICHE.length).toBe(CATEGORY_STEPS.length + 1);
  });
});
