import { describe, expect, it } from "vitest";
import { routineGeschafftFeier } from "./routineFeier";

describe("routineGeschafftFeier", () => {
  it("erscheint immer groß – pünktlich und später mit passendem Text", () => {
    expect(routineGeschafftFeier("morgen", true)).toMatchObject({ text: "Morgenroutine geschafft! 🌅", gross: true, icon: "sunrise" });
    expect(routineGeschafftFeier("morgen", false).untertitel).toMatch(/Auch später zählt/);
    expect(routineGeschafftFeier("abend", true)).toMatchObject({ text: "Abendroutine geschafft! 🌙", icon: "moon" });
  });
  it("verspätet: kleiner Hinweis mit Protokoll-Vermerk, pünktlich ohne", () => {
    expect(routineGeschafftFeier("morgen", false, "Heute 2 Std. 49 Min. später als geplant (06:00)").hinweis).toBe(
      "🕐 Heute 2 Std. 49 Min. später als geplant (06:00). Ist im Protokoll vermerkt."
    );
    expect(routineGeschafftFeier("morgen", true).hinweis).toBeUndefined();
  });
});
