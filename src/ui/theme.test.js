import { describe, it, expect, beforeEach } from "vitest";
import { abendDunkelErlaubt, hexZuRgba, setzeAbendDunkelErlaubt, setzeTagesphasenFarben } from "./theme";

// Abendmodus (Design 2.0, 29.09.): nur in der Phase „nacht“ dunkel, abschaltbar.
describe("Abendmodus", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.dunkel;
  });

  it("ist abends an und tagsüber aus", () => {
    setzeTagesphasenFarben("nacht");
    expect(document.documentElement.dataset.dunkel).toBe("1");
    setzeTagesphasenFarben("tag");
    expect(document.documentElement.dataset.dunkel).toBeUndefined();
    setzeTagesphasenFarben("morgen");
    expect(document.documentElement.dataset.dunkel).toBeUndefined();
  });

  it("lässt sich abschalten und wieder einschalten", () => {
    setzeTagesphasenFarben("nacht");
    setzeAbendDunkelErlaubt(false);
    expect(abendDunkelErlaubt()).toBe(false);
    expect(document.documentElement.dataset.dunkel).toBeUndefined();
    setzeAbendDunkelErlaubt(true);
    expect(abendDunkelErlaubt()).toBe(true);
    expect(document.documentElement.dataset.dunkel).toBe("1");
  });

  it("meldet Änderungen, damit der Schalter in Mehr mitzieht", () => {
    let gemeldet = 0;
    const zaehlen = () => gemeldet++;
    window.addEventListener("mp-aussehen", zaehlen);
    setzeAbendDunkelErlaubt(false);
    window.removeEventListener("mp-aussehen", zaehlen);
    expect(gemeldet).toBe(1);
  });

  it("Farbmischungen (color-mix) werden wie Variablen behandelt", () => {
    const mix = "color-mix(in srgb, #5E2A8A var(--mp-schrift), var(--mp-schrift-hell))";
    expect(hexZuRgba(mix, 0.2)).toBe(`color-mix(in srgb, ${mix} 20%, transparent)`);
    expect(hexZuRgba("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });
});
