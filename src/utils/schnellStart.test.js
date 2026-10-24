import { afterEach, describe, expect, it } from "vitest";
import { _zuruecksetzen, kamUeberSchnell, nimmSchnellStart, SCHNELL_AUF_STARTSEITE } from "./schnellStart";

describe("Schnell-Abkürzung (24.10.)", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    _zuruecksetzen();
  });
  it("liest ?schnell= einmal und entfernt es aus der Adresse", () => {
    window.history.replaceState(null, "", "/?schnell=snack&x=1#/home");
    expect(kamUeberSchnell()).toBe(true);
    expect(window.location.search).toBe("?x=1");
    expect(window.location.hash).toBe("#/home");
    expect(nimmSchnellStart(SCHNELL_AUF_STARTSEITE)).toBeNull();
    expect(nimmSchnellStart(["snack"])).toBe("snack");
    expect(nimmSchnellStart(["snack"])).toBeNull();
  });
  it("ignoriert unbekannte Werte", () => {
    window.history.replaceState(null, "", "/?schnell=quatsch#/home");
    expect(kamUeberSchnell()).toBe(false);
  });
});
