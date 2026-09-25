import { describe, expect, it } from "vitest";
import { coachVerspaetungen, hinweisRuht, satzVomCoach, verspaetungHinweis, verspaetungMin, verspaetungsMuster } from "./routineVerspaetung";

const heute = new Date(2026, 8, 25, 10);
const um = (tag, h, m) => new Date(2026, 8, tag, h, m).toISOString();
const lauf = (tag, h, m, routine = "morgen") => ({ routine, datum: `2026-09-${String(tag).padStart(2, "0")}`, gestartetUm: um(tag, h, m) });

describe("verspaetungMin + verspaetungHinweis", () => {
  it("rechnet Minuten nach der Startzeit, Hinweis erst jenseits des Puffers", () => {
    expect(verspaetungMin("06:00", um(25, 8, 49))).toBe(169);
    expect(verspaetungMin("06:00", um(25, 5, 50))).toBe(-10);
    expect(verspaetungMin("", um(25, 8, 49))).toBeNull();
    expect(verspaetungHinweis("06:00", um(25, 8, 49), 10)).toBe("Heute 2 Std. 49 Min. später als geplant (06:00)");
    expect(verspaetungHinweis("06:00", um(25, 6, 10), 10)).toBeNull();
    expect(verspaetungHinweis("06:00", um(25, 6, 25), 10)).toBe("Heute 25 Min. später als geplant (06:00)");
  });
});

describe("verspaetungsMuster", () => {
  it("3 von 5 Tagen > 30 Min. später = Muster mit Vorschlag (Median, 15-Min.-Raster)", () => {
    const d = [lauf(25, 8, 49), lauf(24, 8, 40), lauf(23, 6, 5), lauf(22, 9, 0)];
    const m = verspaetungsMuster(d, "morgen", "06:00", heute);
    expect(m).toMatchObject({ label: "Morgenroutine", startZeit: "06:00", spaetAnzahl: 3, vorschlag: "08:45" });
    expect(m.tage.map((t) => t.datum)).toEqual(["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25"]);
    expect(m.tage[0].min).toBeNull();
  });
  it("nur 2 späte Tage oder ≤ 30 Min. = kein Muster; ältere Tage zählen nicht", () => {
    expect(verspaetungsMuster([lauf(25, 8, 0), lauf(24, 8, 0), lauf(23, 6, 30), lauf(19, 9, 0)], "morgen", "06:00", heute)).toBeNull();
    expect(verspaetungsMuster([lauf(25, 8, 0), lauf(24, 8, 0), lauf(23, 8, 0)], "abend", "21:00", heute)).toBeNull();
    expect(verspaetungsMuster([lauf(25, 8, 0), lauf(24, 8, 0), lauf(23, 8, 0)], "morgen", "", heute)).toBeNull();
  });
});

describe("hinweisRuht", () => {
  it("eine Woche Ruhe nach einer Reaktion auf die Karte", () => {
    const e = (tag) => [{ kategorie: "morgenroutine", itemName: "Zeit-Hinweis", erstelltAm: um(tag, 9, 0) }];
    expect(hinweisRuht(e(20), "morgen", heute)).toBe(true);
    expect(hinweisRuht(e(17), "morgen", heute)).toBe(false);
    expect(hinweisRuht(e(20), "abend", heute)).toBe(false);
  });
});

describe("coachVerspaetungen", () => {
  it("fasst RPC-Zeilen je Person zusammen", () => {
    const zeilen = [
      { user_id: "a", routine: "morgen", start_zeit: "06:00:00", datum: "2026-09-25", gestartet_um: um(25, 8, 50) },
      { user_id: "a", routine: "morgen", start_zeit: "06:00:00", datum: "2026-09-24", gestartet_um: um(24, 8, 40) },
      { user_id: "a", routine: "morgen", start_zeit: "06:00:00", datum: "2026-09-23", gestartet_um: um(23, 8, 45) },
      { user_id: "b", routine: "morgen", start_zeit: "07:00:00", datum: "2026-09-25", gestartet_um: um(25, 7, 5) },
    ];
    const r = coachVerspaetungen(zeilen, heute);
    expect(Object.keys(r)).toEqual(["a"]);
    expect(r.a.vorschlag).toBe("08:45");
    expect(satzVomCoach(r.a, "Jonas")).toContain("Hallo Jonas, mir ist aufgefallen, dass deine Morgenroutine meist erst gegen 08:45 klappt statt um 06:00");
  });
});
