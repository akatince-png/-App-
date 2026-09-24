import { describe, expect, it } from "vitest";
import { tagesphase } from "./tagesphase";

const um = (h, m = 0) => new Date(2026, 8, 24, h, m);
const schritte = [{ routine: "morgen" }, { routine: "abend" }];

describe("tagesphase", () => {
  it("morgens bis die Morgenroutine geschafft ist, dann Tag", () => {
    expect(tagesphase({ jetzt: um(7), routineSchritte: schritte })).toBe("morgen");
    expect(tagesphase({ jetzt: um(7), routineSchritte: schritte, routineDurchlaeufe: [{ routine: "morgen", datum: "2026-09-24", abgeschlossenUm: "x" }] })).toBe("tag");
    expect(tagesphase({ jetzt: um(12, 30), routineSchritte: schritte })).toBe("tag");
  });
  it("ohne Morgenroutine nur bis 9 Uhr Morgen", () => {
    expect(tagesphase({ jetzt: um(8, 59) })).toBe("morgen");
    expect(tagesphase({ jetzt: um(9, 1) })).toBe("tag");
  });
  it("Nacht ab Beginn der Abendroutine, sonst ab 20 Uhr, bis 4 Uhr früh", () => {
    expect(tagesphase({ jetzt: um(19), routineEinstellungen: { abend: { startZeit: "21:30" } } })).toBe("tag");
    expect(tagesphase({ jetzt: um(21, 30), routineEinstellungen: { abend: { startZeit: "21:30" } } })).toBe("nacht");
    expect(tagesphase({ jetzt: um(20) })).toBe("nacht");
    expect(tagesphase({ jetzt: um(3, 59) })).toBe("nacht");
    expect(tagesphase({ jetzt: um(18), routineDurchlaeufe: [{ routine: "abend", datum: "2026-09-24", abgeschlossenUm: "x" }] })).toBe("nacht");
  });
});
