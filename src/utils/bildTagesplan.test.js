import { describe, it, expect } from "vitest";
import { blockHoehe, dauerFuer, dauerText, gruppiereBloecke, planBloecke, symbolFuer, zeitInMin } from "./bildTagesplan";

describe("Bild-Tagesplan", () => {
  it("findet passende Bilder am Namen, sonst nach Bereich", () => {
    expect(symbolFuer({ name: "Wäsche machen", kategorie: "gewohnheit" })).toBe("🧺");
    expect(symbolFuer({ name: "Zähne putzen", kategorie: "gewohnheit" })).toBe("🪥");
    expect(symbolFuer({ name: "Krafttraining · Beine", kategorie: "training" })).toBe("🏋️");
    expect(symbolFuer({ name: "Elvanse", kategorie: "hormon" })).toBe("💊");
    expect(symbolFuer({ name: "Irgendwas", kategorie: "gewohnheit" })).toBe("🎯");
    expect(symbolFuer({ name: "Egal", symbol: "🐕" })).toBe("🐕");
  });
  it("nimmt eigene Dauer, sonst Standard je Bereich", () => {
    expect(dauerFuer({ kategorie: "gewohnheit", raw: { dauerMin: 30 } })).toBe(30);
    expect(dauerFuer({ kategorie: "mahlzeit" })).toBe(30);
    expect(dauerFuer({ kategorie: "zeitblock", uhrzeit: "09:00", raw: { startUhrzeit: "09:00", endUhrzeit: "10:30" } })).toBe(90);
    expect(dauerText(90)).toBe("1 Std. 30 Min");
    expect(dauerText(20)).toBe("20 Min");
  });
  it("sortiert nach Zeit, erkennt 'läuft gerade' und setzt die Jetzt-Linie", () => {
    const items = [
      { key: "b", name: "Wäsche", kategorie: "gewohnheit", uhrzeit: "09:30", raw: { dauerMin: 30 } },
      { key: "a", name: "Laufen", kategorie: "gewohnheit", uhrzeit: "07:00", raw: { dauerMin: 20 } },
      { key: "c", name: "Steuer", kategorie: "gewohnheit", uhrzeit: "" },
    ];
    const jetzt = zeitInMin("09:40");
    const p = planBloecke(items, jetzt);
    expect(p.mitZeit.map((b) => b.key)).toEqual(["a", "b"]);
    expect(p.mitZeit[0].vorbei).toBe(true);
    expect(p.mitZeit[1].laeuft).toBe(true);
    expect(p.mitZeit[1].jetztAnteil).toBeCloseTo(1 / 3);
    expect(p.linieVor).toBeNull();
    expect(p.ohneZeit.map((b) => b.key)).toEqual(["c"]);
    // Zwischen zwei Punkten steht die Linie vor dem nächsten.
    expect(planBloecke(items, zeitInMin("08:00")).linieVor).toBe("b");
    expect(planBloecke(items, zeitInMin("22:00")).linieVor).toBe("ende");
    expect(planBloecke(items, null).linieVor).toBeNull();
  });
  it("Blockhöhe wächst mit der Dauer, bleibt aber begrenzt", () => {
    expect(blockHoehe(2)).toBe(62);
    expect(blockHoehe(30)).toBeGreaterThan(blockHoehe(10));
    expect(blockHoehe(600)).toBe(170);
  });
});

// 25.10. (Nutzerin): gleichzeitige Einnahmen als eine aufklappbare Gabe.
describe("gruppiereBloecke", () => {
  const sup = (name, start, extra = {}) => ({ key: `s-${name}`, kategorie: "supplement", name, start, dauer: 2, ende: start + 2, ...extra });
  const inj = (name, start) => ({ key: `h-${name}`, kategorie: "hormon", name, start, dauer: 2, ende: start + 2, raw: { einnahmeart: "Injektion" } });
  it("bündelt Supplemente und Injektionen mit derselben Uhrzeit, Einzelne bleiben", () => {
    const { bloecke } = gruppiereBloecke([sup("Magnesium", 1315), sup("NAC", 1315), inj("Testo", 425), inj("Reta", 425), sup("D3", 480), { key: "w", kategorie: "workflow", name: "Arbeit", start: 480 }]);
    expect(bloecke.map((b) => b.name)).toEqual(["Supplemente · 2", "Injektionen · 2", "D3", "Arbeit"]);
    expect(bloecke[0].teile.map((t) => t.name)).toEqual(["Magnesium", "NAC"]);
    expect(bloecke[0].detail).toBe("Magnesium, NAC");
  });
  it("Gruppe ist erledigt, wenn alle Teile erledigt sind; Jetzt-Linie wandert auf die Gruppe", () => {
    const { bloecke, linieVor } = gruppiereBloecke([sup("A", 600, { done: true }), sup("B", 600)], "s-B");
    expect(bloecke[0].done).toBe(false);
    expect(linieVor).toBe(bloecke[0].key);
    expect(gruppiereBloecke([sup("A", 600, { done: true }), sup("B", 600, { done: true })]).bloecke[0].done).toBe(true);
  });
  it("Workflow-Dauer kommt aus der Vorlage", () => {
    expect(dauerFuer({ kategorie: "workflow", raw: { preset: { gesamtMin: 225 } } })).toBe(225);
  });
});
