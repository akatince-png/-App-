import { describe, it, expect } from "vitest";
import { istMesswoche, messTag, messAuswertung, vorschlagMin, trainingAuswertung } from "./messwoche";

const stand = { aktiv: true, etappe: { art: "einfuehrung", start: "2026-09-28" }, einfuehrungWoche: 1, erhaltung: false };
const lauf = (datum, gesamtMin, schritte) => ({ routine: "morgen", datum, gestartetUm: `${datum}T06:00:00Z`, abgeschlossenUm: new Date(new Date(`${datum}T06:00:00Z`).getTime() + gesamtMin * 60000).toISOString(), schritte });

describe("messwoche", () => {
  it("erkennt die Messwoche und den Tag", () => {
    expect(istMesswoche(stand)).toBe(true);
    expect(messTag(stand, "2026-09-28")).toBe(1);
    expect(messTag(stand, "2026-10-04")).toBe(7);
    expect(istMesswoche({ ...stand, einfuehrungWoche: 2 })).toBe(false);
  });
  it("mittelt Gesamt- und Schrittzeiten, Vorschlag mit 15 % Puffer", () => {
    const d = [
      lauf("2026-09-28", 40, [{ schrittId: "s1", name: "Duschen", tatsaechlichSek: 600 }]),
      lauf("2026-09-29", 50, [{ schrittId: "s1", name: "Duschen", tatsaechlichSek: 720 }]),
      lauf("2026-09-30", 45, [{ schrittId: "s1", name: "Duschen", tatsaechlichSek: 840 }]),
      lauf("2026-09-30", 600, []), // ungültig (über 4 h)
    ];
    const a = messAuswertung(d, "morgen", "2026-09-28", "2026-10-04", [{ id: "s1", name: "Duschen", dauerMin: 10 }]);
    expect(a.anzahl).toBe(3);
    expect(a.bereit).toBe(true);
    expect(a.avgGesamtSek).toBe(2700);
    expect(a.vorschlagGesamtMin).toBe(52);
    expect(a.schritte[0]).toMatchObject({ schrittId: "s1", avgSek: 720, minSek: 600, maxSek: 840, geplantMin: 10, vorschlagMin: 14, bereit: true });
    expect(vorschlagMin(60)).toBe(2);
  });
  it("Training: Ø Dauer erledigter Einheiten", () => {
    expect(trainingAuswertung([{ datum: "2026-09-28", erledigt: true, dauerMin: 40 }, { datum: "2026-09-30", erledigt: true, dauerMin: 50 }, { datum: "2026-09-30", erledigt: false, dauerMin: 90 }], "2026-09-28", "2026-10-04")).toEqual({ anzahl: 2, avgMin: 45 });
  });
});
