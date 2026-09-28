import { describe, expect, it } from "vitest";
import { diensteAusZellen, diensteAusText, kalenderEintragFuerTag, routineZeitenFuerDienst, standardWochenStart, tageAusDiensten, varianteFuerTag } from "./dienstplanFoto";

describe("diensteAusText", () => {
  it("liest Zeitspannen in verschiedenen Schreibweisen", () => {
    expect(diensteAusText("Aka 06:00-14:00 | 6.00 – 14.00 | 14 bis 22 Uhr | 22:00-06:00")).toEqual([
      { art: "arbeit", von: "06:00", bis: "14:00" },
      { art: "arbeit", von: "06:00", bis: "14:00" },
      { art: "arbeit", von: "14:00", bis: "22:00" },
      { art: "arbeit", von: "22:00", bis: "06:00" },
    ]);
  });
  it("erkennt Kürzel für Früh, Spät, Nacht, Frei, Urlaub und Krank", () => {
    expect(diensteAusText("Müller F S N X U K frei").map((d) => d.rolle || d.art)).toEqual(["F", "S", "N", "frei", "urlaub", "krank", "frei"]);
  });
  it("ignoriert Namen und sonstigen Text", () => {
    expect(diensteAusText("Station 3 Pflege Aka Test")).toEqual([]);
  });
});

describe("diensteAusZellen", () => {
  it("liest je Zelle einen Dienst, leere Zellen bleiben offen", () => {
    expect(diensteAusZellen(["06:00- 14:00", "SS", "", "?!", "frei", "", "7.30-16.00"])).toEqual([
      { art: "arbeit", von: "06:00", bis: "14:00" },
      { art: "rolle", rolle: "S" },
      null,
      null,
      { art: "frei" },
      null,
      { art: "arbeit", von: "07:30", bis: "16:00" },
    ]);
  });
});

describe("tageAusDiensten", () => {
  const varianten = [{ id: "f", name: "Frühschicht", arbeitVon: "05:45", arbeitBis: "13:45" }];
  it("legt Dienste ab dem Starttag auf die Tage und füllt bis 7 auf", () => {
    const tage = tageAusDiensten([{ art: "rolle", rolle: "F" }, { art: "frei" }], "2026-10-05", 7, { F: "f" }, varianten);
    expect(tage).toHaveLength(7);
    expect(tage[0]).toEqual({ datum: "2026-10-05", art: "arbeit", von: "05:45", bis: "13:45" });
    expect(tage[1].art).toBe("frei");
    expect(tage[6]).toEqual({ datum: "2026-10-11", art: "leer", von: "", bis: "" });
  });
});

describe("Zuordnung", () => {
  const standard = { morgen: { startZeit: "07:00" }, abend: { startZeit: "22:00" } };
  it("berechnet Routine-Zeiten je Dienst", () => {
    expect(routineZeitenFuerDienst("06:00", "14:00", standard)).toEqual({ morgenStart: "04:30", abendStart: "22:00" });
    expect(routineZeitenFuerDienst("14:00", "22:00", standard)).toEqual({ morgenStart: "07:00", abendStart: "23:30" });
    expect(routineZeitenFuerDienst("22:00", "06:00", standard)).toEqual({ morgenStart: "14:00", abendStart: "07:00" });
  });
  it("nimmt vorhandene Varianten mit gleicher Zeit, sonst eine neue", () => {
    const v = [{ id: "a", name: "Frühschicht", arbeitVon: "06:00", arbeitBis: "14:00" }, { id: "x", name: "Frei" }];
    expect(varianteFuerTag({ art: "arbeit", von: "06:00", bis: "14:00" }, v, standard).variante.id).toBe("a");
    expect(varianteFuerTag({ art: "frei" }, v, standard).variante.id).toBe("x");
    expect(varianteFuerTag({ art: "arbeit", von: "07:30", bis: "16:00" }, v, standard).neu).toMatchObject({ name: "Frühdienst 07:30–16:00", morgenStart: "06:00" });
  });
  it("macht aus einem Dienst einen einmaligen Kalender-Eintrag", () => {
    expect(kalenderEintragFuerTag({ datum: "2026-10-05", art: "arbeit", von: "22:00", bis: "06:00" })).toMatchObject({ bereich: "arbeit", start: "22:00", ende: "23:59", datum: "2026-10-05" });
    expect(kalenderEintragFuerTag({ datum: "2026-10-05", art: "frei" })).toBeNull();
  });
  it("schlägt ab Freitag die nächste Woche vor", () => {
    expect(standardWochenStart("2026-09-29")).toBe("2026-09-28");
    expect(standardWochenStart("2026-10-02")).toBe("2026-10-05");
  });
});
