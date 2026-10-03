import { describe, expect, it } from "vitest";
import { parseFarbe, plastikArt } from "./plastikAuto";

describe("plastikArt", () => {
  it("erkennt kräftige Farben, helle Flächen und lässt Durchsichtiges/Verläufe aus", () => {
    expect(plastikArt({ hintergrund: "rgb(224, 53, 43)" })).toBe("farbig");
    expect(plastikArt({ hintergrund: "rgb(255, 255, 255)" })).toBe("hell");
    expect(plastikArt({ hintergrund: "rgba(0, 0, 0, 0)" })).toBe(null);
    expect(plastikArt({ hintergrund: "rgb(224, 53, 43)", bild: "linear-gradient(red, blue)" })).toBe(null);
    expect(plastikArt({ hintergrund: "rgb(40, 44, 70)" })).toBe(null);
  });
  it("liest rgb/rgba mit Komma und Schrägstrich", () => {
    expect(parseFarbe("rgba(1, 2, 3, 0.4)")).toEqual({ r: 1, g: 2, b: 3, a: 0.4 });
    expect(parseFarbe("rgb(1 2 3 / 50%)")).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
  });
});
