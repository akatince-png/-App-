import { describe, it, expect } from "vitest";
import { quadrantVon, nachQuadrant, alltagAusMatrix, fristText, warum } from "./matrix";

const heute = new Date(2026, 8, 30, 10, 0); // Mi 30.09.2026

describe("Aufgaben-Matrix", () => {
  it("ordnet nach wichtig + Frist ein", () => {
    expect(quadrantVon({ wichtig: true, frist: "2026-10-01" }, heute)).toBe("jetzt");
    expect(quadrantVon({ wichtig: true, frist: "2026-10-09" }, heute)).toBe("planen");
    expect(quadrantVon({ wichtig: null }, heute)).toBe("planen");
    expect(quadrantVon({ wichtig: false, frist: "2026-09-30" }, heute)).toBe("kurz");
    expect(quadrantVon({ wichtig: false }, heute)).toBe("spaeter");
  });

  it("rutscht automatisch nach Rot, wenn die Frist näher kommt", () => {
    const a = { wichtig: true, frist: "2026-10-05" };
    expect(quadrantVon(a, heute)).toBe("planen");
    expect(quadrantVon(a, new Date(2026, 9, 3))).toBe("jetzt");
  });

  it("eigene Wahl bleibt bestehen", () => {
    expect(quadrantVon({ wichtig: false, quadrantManuell: "jetzt" }, heute)).toBe("jetzt");
    expect(warum({ quadrantManuell: "jetzt" }, heute)).toMatch(/selbst/);
  });

  it("sortiert je Feld nach Frist und Dauer, Erledigtes fällt raus", () => {
    const g = nachQuadrant(
      [
        { id: "a", wichtig: true, frist: "2026-10-01", dauerMin: 30 },
        { id: "b", wichtig: true, frist: "2026-09-30", dauerMin: 60 },
        { id: "c", wichtig: true, frist: "2026-09-30", dauerMin: 10 },
        { id: "d", wichtig: true, frist: "2026-09-30", erledigtAm: "2026-09-30T08:00:00Z" },
      ],
      heute
    );
    expect(g.jetzt.map((a) => a.id)).toEqual(["c", "b", "a"]);
  });

  it("im Alltag nur Rot und das heute eingeplante Grün", () => {
    const l = alltagAusMatrix(
      [
        { id: "rot", wichtig: true, frist: "2026-10-01" },
        { id: "gruen-heute", wichtig: true, geplantAm: "2026-09-30" },
        { id: "gruen-spaeter", wichtig: true, geplantAm: "2026-10-02" },
        { id: "gelb", wichtig: false, frist: "2026-09-30" },
        { id: "grau", wichtig: false },
      ],
      heute
    );
    expect(l.map((a) => a.id)).toEqual(["rot", "gruen-heute"]);
  });

  it("Frist als Wort", () => {
    expect(fristText("2026-09-30", heute)).toBe("heute");
    expect(fristText("2026-10-01", heute)).toBe("morgen");
    expect(fristText("2026-09-28", heute)).toBe("überfällig");
    expect(fristText("2026-10-09", heute)).toBe("9.10.");
  });
});
