import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pruefeAusgefalleneEintraege } from "./ausgefallenSweep";

// buildDayItems() gemockt: der Sweep selbst (Dedup, Erster-Lauf-Grenzfall,
// Pro-Person-Schlüssel, Nachhol-Deckel) ist die eigentliche Testfläche
// hier — dayItems.js bekommt eigene Tests.
vi.mock("./dayItems", () => ({
  buildDayItems: vi.fn(() => [{ kategorie: "supplement", name: "Vitamin D", done: false }]),
}));

import { buildDayItems } from "./dayItems";

function baueAppData(overrides = {}) {
  return {
    userId: "user-1",
    protokollEintraege: [],
    aenderungVermerken: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("pruefeAusgefalleneEintraege", () => {
  beforeEach(() => {
    window.localStorage.clear();
    buildDayItems.mockClear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("tut nichts ohne userId", async () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    const appData = baueAppData({ userId: null });
    await pruefeAusgefalleneEintraege(appData);
    expect(appData.aenderungVermerken).not.toHaveBeenCalled();
  });

  it("erster Lauf überhaupt: legt nur die Grundlage, markiert nichts rückwirkend als ausgefallen", async () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    const appData = baueAppData();
    await pruefeAusgefalleneEintraege(appData);
    expect(appData.aenderungVermerken).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("letzterAusfallSweep__user-1")).toBe("2026-01-15");
  });

  it("läuft am selben Tag kein zweites Mal", async () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    window.localStorage.setItem("letzterAusfallSweep__user-1", "2026-01-15");
    const appData = baueAppData();
    await pruefeAusgefalleneEintraege(appData);
    expect(appData.aenderungVermerken).not.toHaveBeenCalled();
  });

  it("trägt am Folgetag nicht erledigte Einträge des Vortags als ausgefallen ein (Regressionstest für den 1-Tage-Lücke-Bug)", async () => {
    window.localStorage.setItem("letzterAusfallSweep__user-1", "2026-01-14");
    vi.setSystemTime(new Date(2026, 0, 15));
    const appData = baueAppData();
    await pruefeAusgefalleneEintraege(appData);
    expect(appData.aenderungVermerken).toHaveBeenCalledWith({
      kategorie: "supplement",
      itemName: "Vitamin D",
      aktion: "ausgefallen",
      detail: "Nicht bestätigt am 2026-01-14",
    });
    expect(window.localStorage.getItem("letzterAusfallSweep__user-1")).toBe("2026-01-15");
  });

  it("überspringt bereits geloggte Einträge (kein Duplikat)", async () => {
    window.localStorage.setItem("letzterAusfallSweep__user-1", "2026-01-14");
    vi.setSystemTime(new Date(2026, 0, 15));
    const appData = baueAppData({
      protokollEintraege: [
        { kategorie: "supplement", itemName: "Vitamin D", aktion: "ausgefallen", detail: "Nicht bestätigt am 2026-01-14" },
      ],
    });
    await pruefeAusgefalleneEintraege(appData);
    expect(appData.aenderungVermerken).not.toHaveBeenCalled();
  });

  it("deckelt lange Abwesenheiten auf MAX_NACHHOL_TAGE (14 Tage)", async () => {
    window.localStorage.setItem("letzterAusfallSweep__user-1", "2025-12-01"); // > 14 Tage her
    vi.setSystemTime(new Date(2026, 0, 15));
    const appData = baueAppData();
    await pruefeAusgefalleneEintraege(appData);
    expect(buildDayItems).toHaveBeenCalledTimes(14);
  });

  it("führt den Sweep pro Person getrennt (Bug-Fix: kein globaler Schlüssel)", async () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    // Person A ist heute schon gelaufen ...
    window.localStorage.setItem("letzterAusfallSweep__user-A", "2026-01-15");
    // ... Person B ("Verwalten als") darf trotzdem noch laufen.
    const appDataB = baueAppData({ userId: "user-B" });
    await pruefeAusgefalleneEintraege(appDataB);
    expect(window.localStorage.getItem("letzterAusfallSweep__user-B")).toBe("2026-01-15");
  });
});
