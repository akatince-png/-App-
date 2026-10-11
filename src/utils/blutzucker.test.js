import { describe, expect, it } from "vitest";
import { durchschnitt, inMmol, messungPruefen, wertText, zeitpunktVorschlag } from "./blutzucker";
import { befehlBereinigen } from "./akaBefehl";

describe("Blutzucker messungPruefen", () => {
  it("mg/dl und mmol/l (umgerechnet)", () => {
    expect(messungPruefen({ wert: "95", zeitpunkt: "nuechtern" })).toEqual({ ok: true, werte: { wertMgdl: 95, zeitpunkt: "nuechtern" } });
    expect(messungPruefen({ wert: "5,4", einheit: "mmol", zeitpunkt: "abends" })).toEqual({ ok: true, werte: { wertMgdl: 97, zeitpunkt: "abends" } });
  });
  it("leer, unplausibel, unbekannter Zeitpunkt", () => {
    expect(messungPruefen({ wert: "" }).ok).toBe(false);
    expect(messungPruefen({ wert: "5,4" }).ok).toBe(false); // mg/dl gewählt, mmol getippt
    expect(messungPruefen({ wert: "100", zeitpunkt: "irgendwann" }).werte.zeitpunkt).toBe("zwischendurch");
  });
});

describe("Blutzucker Anzeige und Durchschnitt", () => {
  it("rechnet in mmol/l um", () => {
    expect(inMmol(90)).toBe(5);
    expect(wertText(97, "mmol")).toBe("5,4 mmol/l");
    expect(wertText(97)).toBe("97 mg/dl");
  });
  it("Ø gesamt und nur nüchtern", () => {
    const heute = new Date(2026, 9, 11);
    const m = [
      { datum: "2026-10-11", wertMgdl: 90, zeitpunkt: "nuechtern" },
      { datum: "2026-10-10", wertMgdl: 140, zeitpunkt: "nach_essen" },
      { datum: "2026-10-09", wertMgdl: 100, zeitpunkt: "nuechtern" },
    ];
    expect(durchschnitt(m, 7, { heute })).toEqual({ anzahl: 3, wertMgdl: 110 });
    expect(durchschnitt(m, 7, { heute, zeitpunkt: "nuechtern" })).toEqual({ anzahl: 2, wertMgdl: 95 });
  });
  it("schlägt den Zeitpunkt nach Uhrzeit vor", () => {
    expect(zeitpunktVorschlag(new Date(2026, 9, 11, 7))).toBe("nuechtern");
    expect(zeitpunktVorschlag(new Date(2026, 9, 11, 14))).toBe("zwischendurch");
    expect(zeitpunktVorschlag(new Date(2026, 9, 11, 21))).toBe("abends");
  });
});

describe("Aka-Befehl blutzucker", () => {
  it("mg/dl direkt, mmol/l umgerechnet", () => {
    expect(befehlBereinigen({ art: "blutzucker", wert: 95, zeitpunkt: "nuechtern" })).toEqual({ art: "blutzucker", wertMgdl: 95, zeitpunkt: "nuechtern" });
    expect(befehlBereinigen({ art: "blutzucker", wert: "5,4", zeitpunkt: null })).toEqual({ art: "blutzucker", wertMgdl: 97, zeitpunkt: null });
    expect(befehlBereinigen({ art: "blutzucker", wert: 0 })).toEqual({ art: "keine" });
  });
});
