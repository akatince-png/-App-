import { describe, expect, it } from "vitest";
import { ligaHighlights, ranglisteAufbereiten, tagLabel, tageRuhig, zeitraumGrenzen } from "./teamStatistik";

describe("teamStatistik", () => {
  it("Woche läuft von Montag bis Sonntag", () => {
    expect(zeitraumGrenzen("woche", new Date(2026, 8, 24))).toEqual({ von: "2026-09-21", bis: "2026-09-27", tage: 7 });
    expect(zeitraumGrenzen("woche", new Date(2026, 8, 27))).toMatchObject({ von: "2026-09-21", bis: "2026-09-27" });
  });
  it("Monat umfasst den ganzen Kalendermonat", () => {
    expect(zeitraumGrenzen("monat", new Date(2026, 1, 10))).toEqual({ von: "2026-02-01", bis: "2026-02-28", tage: 28 });
  });
  it("zählt ruhige Tage nach örtlichem Datum", () => {
    expect(tageRuhig("2026-09-22", new Date(2026, 8, 24, 23, 30))).toBe(2);
    expect(tageRuhig(null)).toBe(null);
  });
  it("Highlights nur auf Team-Ebene", () => {
    const teams = [
      { name: "A", schnitt: 60, schnittVorher: 40, aktiveTageSchnitt: 5, raetselTage: 0 },
      { name: "B", schnitt: 70, schnittVorher: 65, aktiveTageSchnitt: 6, raetselTage: 3 },
    ];
    expect(ligaHighlights(teams).map((h) => h.wert)).toEqual(["A +20 Ø", "B (Ø 6 Tage)", "B"]);
  });
});

describe("tagLabel", () => {
  it("heute, gestern, vorgestern, sonst Datum", () => {
    const heute = new Date(2026, 8, 24, 15);
    expect(tagLabel("2026-09-24", heute)).toBe("heute");
    expect(tagLabel("2026-09-23", heute)).toBe("gestern");
    expect(tagLabel("2026-09-22", heute)).toBe("vorgestern");
    expect(tagLabel("2026-09-01", heute)).toBe("am 01.09.");
  });
});

describe("ranglisteAufbereiten", () => {
  it("nur Teilende, nach Punkten absteigend, Nicht-Teilende gezählt", () => {
    const r = ranglisteAufbereiten([
      { user_id: "a", teilt: true, vorname: "Mia", punkte: 5 },
      { user_id: "b", teilt: false, vorname: null, punkte: null },
      { user_id: "c", teilt: true, vorname: "Lea", punkte: 9 },
      { user_id: "d", teilt: true, vorname: "Anna", punkte: 5 },
    ]);
    expect(r.personen.map((p) => p.vorname)).toEqual(["Lea", "Anna", "Mia"]);
    expect(r.nichtTeilend).toBe(1);
    expect(ranglisteAufbereiten(null)).toEqual({ personen: [], nichtTeilend: 0 });
  });
});
