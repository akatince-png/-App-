import { describe, expect, it } from "vitest";
import { atemZeitenHeute, taktPosition, uebungFuerKey, bibliotheksUebung } from "./atemBibliothek";

describe("Atem-Bibliothek", () => {
  it("Takt-Position: Seufzer-Atmung (2+1+6 = 9 Sek.)", () => {
    const p = bibliotheksUebung("seufzer").phasen;
    expect(taktPosition(p, 0)).toMatchObject({ index: 0, runde: 1 });
    expect(taktPosition(p, 2500)).toMatchObject({ index: 1 });
    expect(taktPosition(p, 3000)).toMatchObject({ index: 2 });
    expect(taktPosition(p, 9000)).toMatchObject({ index: 0, runde: 2 });
  });
  it("eigene Übung per Schlüssel", () => {
    const u = uebungFuerKey("eigen:x1", [{ id: "x1", name: "Meine", einatmenSek: 4, haltenSek: 0, ausatmenSek: 8, dauerMinuten: 2 }]);
    expect(u.phasen.map((p) => p.art)).toEqual(["ein", "aus"]);
    expect(uebungFuerKey("gibtsnicht")).toBeNull();
  });
  it("feste Zeiten: die ersten n gelten bei n Logs heute als erledigt", () => {
    const heute = new Date(2026, 8, 25, 13);
    const zeiten = [{ id: "b", uhrzeit: "12:30" }, { id: "a", uhrzeit: "07:10" }, { id: "c", uhrzeit: "21:45" }];
    const logs = [{ erstelltAm: new Date(2026, 8, 25, 7, 20).toISOString() }, { erstelltAm: new Date(2026, 8, 24, 21).toISOString() }];
    expect(atemZeitenHeute(zeiten, logs, heute).map((z) => [z.id, z.erledigt])).toEqual([["a", true], ["b", false], ["c", false]]);
  });
});
