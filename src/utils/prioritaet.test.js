import { describe, expect, it } from "vitest";
import { nachPrioritaet, stufeVon } from "./prioritaet";

describe("Ampel für den Tag", () => {
  it("Routinen sind Pflicht, Bausteine wichtig, Zeitblöcke flexibel, Matrix nach Feld", () => {
    expect(stufeVon({ kategorie: "morgenroutine" }).id).toBe("pflicht");
    expect(stufeVon({ kategorie: "abendroutine" }).id).toBe("pflicht");
    expect(stufeVon({ kategorie: "hormon" }).id).toBe("wichtig");
    expect(stufeVon({ kategorie: "training" }).id).toBe("wichtig");
    expect(stufeVon({ kategorie: "zeitblock" }).id).toBe("flexibel");
    expect(stufeVon({ kategorie: "gewohnheit", quadrant: "jetzt" }).id).toBe("pflicht");
    expect(stufeVon({ kategorie: "gewohnheit", quadrant: "spaeter" }).id).toBe("spaeter");
  });
  it("sortiert nach Ampel, dann Uhrzeit", () => {
    const l = nachPrioritaet([
      { name: "Workflow", kategorie: "workflow", uhrzeit: "08:00" },
      { name: "Vitamin", kategorie: "supplement" },
      { name: "Elvanse", kategorie: "hormon", uhrzeit: "08:00" },
      { name: "Abend", kategorie: "abendroutine", uhrzeit: "21:30" },
    ]);
    expect(l.map((i) => i.name)).toEqual(["Abend", "Elvanse", "Vitamin", "Workflow"]);
  });
});
