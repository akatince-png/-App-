import { describe, it, expect } from "vitest";
import { aktuelleRunde, gradeDabei, heuteErledigt, laeuft, meineOffene, naechsteRunde, restMinuten } from "./fokusGemeinsam";
import { toLocalISODate } from "./dates";

const JETZT = new Date(2026, 8, 27, 10, 0).getTime();
const vor = (min) => new Date(JETZT - min * 60000).toISOString();
const s = (x) => ({ id: x.id, userId: x.userId, ziel: "", dauerMinuten: 25, startUm: vor(5), beendetUm: null, ergebnis: null, teilen: true, ...x });

describe("Gemeinsam fokussieren", () => {
  it("erkennt laufende Sitzungen mit 5 Min. Kulanz", () => {
    expect(laeuft(s({ startUm: vor(10) }), JETZT)).toBe(true);
    expect(laeuft(s({ startUm: vor(28) }), JETZT)).toBe(true); // 3 Min. drüber
    expect(laeuft(s({ startUm: vor(31) }), JETZT)).toBe(false);
    expect(laeuft(s({ startUm: vor(10), beendetUm: vor(1) }), JETZT)).toBe(false);
    expect(restMinuten(s({ startUm: vor(10) }), JETZT)).toBe(15);
  });
  it("zeigt je Person nur die neueste laufende Sitzung, ohne mich", () => {
    const liste = [s({ id: "a", userId: "ich" }), s({ id: "b", userId: "anna", startUm: vor(20) }), s({ id: "c", userId: "anna", startUm: vor(3) }), s({ id: "d", userId: "jonas", startUm: vor(60) })];
    expect(gradeDabei(liste, "ich", JETZT).map((x) => x.id)).toEqual(["c"]);
  });
  it("findet meine offene Sitzung (läuft oder wartet auf Ergebnis)", () => {
    const liste = [s({ id: "alt", userId: "ich", startUm: vor(60 * 13) }), s({ id: "offen", userId: "ich", startUm: vor(40) }), s({ id: "fertig", userId: "ich", startUm: vor(2), ergebnis: "geschafft" })];
    expect(meineOffene(liste, "ich", JETZT)?.id).toBe("offen");
    expect(meineOffene([], "ich", JETZT)).toBeNull();
  });
  it("Runden: 15 Min. vorher bis Ende 'dran', sonst die nächste", () => {
    const runden = [
      { id: "r1", dauerMinuten: 25, startUm: new Date(JETZT + 10 * 60000).toISOString() },
      { id: "r2", dauerMinuten: 25, startUm: new Date(JETZT + 120 * 60000).toISOString() },
    ];
    expect(aktuelleRunde(runden, JETZT)?.id).toBe("r1");
    expect(aktuelleRunde(runden, JETZT - 30 * 60000)).toBeNull();
    expect(naechsteRunde(runden, JETZT + 20 * 60000)?.id).toBe("r2");
  });
  it("heute geschafft: nur geteilte mit Ergebnis von heute", () => {
    const heute = toLocalISODate(new Date(JETZT));
    const liste = [s({ id: "a", ergebnis: "geschafft" }), s({ id: "b", ergebnis: "nicht", teilen: false }), s({ id: "c" }), s({ id: "d", ergebnis: "teilweise", startUm: vor(60 * 30) })];
    expect(heuteErledigt(liste, heute).map((x) => x.id)).toEqual(["a"]);
  });
});
