import { describe, expect, it } from "vitest";
import { durchschnitt, messungPruefen, neuesteZuerst } from "./blutdruck";
import { befehlBereinigen } from "./akaBefehl";

describe("messungPruefen", () => {
  it("nimmt gültige Werte, Puls optional", () => {
    expect(messungPruefen({ systolisch: "125", diastolisch: "82", puls: "70" })).toEqual({ ok: true, werte: { systolisch: 125, diastolisch: 82, puls: 70 } });
    expect(messungPruefen({ systolisch: "118", diastolisch: "76", puls: "" })).toEqual({ ok: true, werte: { systolisch: 118, diastolisch: 76, puls: null } });
  });
  it("meldet fehlende, vertauschte oder unplausible Werte", () => {
    expect(messungPruefen({ systolisch: "", diastolisch: "80" }).ok).toBe(false);
    expect(messungPruefen({ systolisch: "80", diastolisch: "120" }).ok).toBe(false);
    expect(messungPruefen({ systolisch: "120", diastolisch: "80", puls: "500" }).ok).toBe(false);
  });
});

describe("durchschnitt", () => {
  const heute = new Date(2026, 9, 11);
  const m = [
    { datum: "2026-10-11", systolisch: 120, diastolisch: 80, puls: 70 },
    { datum: "2026-10-08", systolisch: 130, diastolisch: 84, puls: null },
    { datum: "2026-09-20", systolisch: 140, diastolisch: 90, puls: 80 },
  ];
  it("rechnet je Zeitraum", () => {
    expect(durchschnitt(m, 7, heute)).toEqual({ anzahl: 2, systolisch: 125, diastolisch: 82, puls: 70 });
    expect(durchschnitt(m, 30, heute)).toEqual({ anzahl: 3, systolisch: 130, diastolisch: 85, puls: 75 });
    expect(durchschnitt([], 7, heute)).toBeNull();
  });
  it("sortiert neueste zuerst", () => {
    expect(neuesteZuerst([{ datum: "2026-10-01", uhrzeit: "08:00" }, { datum: "2026-10-01", uhrzeit: "20:00" }])[0].uhrzeit).toBe("20:00");
  });
});

describe("Aka-Befehl blutdruck", () => {
  it("braucht oberen > unteren Wert", () => {
    expect(befehlBereinigen({ art: "blutdruck", systolisch: 125, diastolisch: 82, puls: 70 })).toEqual({ art: "blutdruck", systolisch: 125, diastolisch: 82, puls: 70 });
    expect(befehlBereinigen({ art: "blutdruck", systolisch: 82, diastolisch: 125 })).toEqual({ art: "keine" });
  });
});
