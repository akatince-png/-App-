import { describe, expect, it } from "vitest";
import { kategorieWechseln, neuesMedikamentStart } from "./medikamentVorgaben";

describe("Medikamenten-Vorgaben", () => {
  it("neues Medikament startet als ADHS-Medikation, Tablette, täglich 08:00", () => {
    expect(neuesMedikamentStart()).toEqual({ kategorie: "ADHS-Medikation", einnahmeart: "Tablette (oral)", intervallTyp: "fixed", intervallDays: 1, uhrzeiten: ["08:00"] });
  });
  it("Wechsel zu Hormone (TRT) schlägt Injektion 1× pro Woche vor", () => {
    expect(kategorieWechseln(neuesMedikamentStart(), "Hormone")).toMatchObject({ kategorie: "Hormone", einnahmeart: "Injektion", intervallDays: 7, uhrzeiten: ["08:00"] });
  });
  it("selbst Geändertes bleibt beim Kategorie-Wechsel erhalten", () => {
    const m = { ...neuesMedikamentStart(), einnahmeart: "Kapsel", uhrzeiten: ["07:15"] };
    expect(kategorieWechseln(m, "Hormone")).toMatchObject({ einnahmeart: "Kapsel", uhrzeiten: ["07:15"], intervallDays: 7 });
    const gel = { ...kategorieWechseln(neuesMedikamentStart(), "Hormone"), einnahmeart: "Gel / Creme", intervallDays: 1 };
    expect(kategorieWechseln(gel, "Blutdruck")).toMatchObject({ einnahmeart: "Gel / Creme", intervallDays: 1 });
  });
});
