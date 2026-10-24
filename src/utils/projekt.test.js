import { describe, expect, it } from "vitest";
import { projektStand, sessionAufgaben, sessionTermine } from "./projekt";

const p = { id: "p1", name: "Webseite Papa", start: "2026-10-26", deadline: "2026-12-15", sessionTage: ["Mo", "Do"], sessionUhrzeit: "18:00", sessionDauerMin: 45, sessionsZiel: 14 };
const mo = new Date(2026, 9, 26); // Montag

describe("Projekt-Sessions (24.10.)", () => {
  it("Termine an den Wochentagen der nächsten 2 Wochen, ohne schon belegte", () => {
    expect(sessionTermine(p, [], mo, 14)).toEqual(["2026-10-26", "2026-10-29", "2026-11-02", "2026-11-05"]);
    const belegt = [{ art: "projekt", projektId: "p1", geplantAm: "2026-10-29" }];
    expect(sessionTermine(p, belegt, mo, 14)).toEqual(["2026-10-26", "2026-11-02", "2026-11-05"]);
  });
  it("nicht nach der Deadline, nicht vor dem Start, ohne Wochentage nichts", () => {
    expect(sessionTermine({ ...p, deadline: "2026-10-30" }, [], mo, 14)).toEqual(["2026-10-26", "2026-10-29"]);
    expect(sessionTermine({ ...p, start: "2026-11-01" }, [], mo, 14)).toEqual(["2026-11-02", "2026-11-05"]);
    expect(sessionTermine({ ...p, sessionTage: [] }, [], mo)).toEqual([]);
  });
  it("Sessions werden Matrix-Aufgaben mit Uhrzeit, Dauer, Deadline und Erinnerung", () => {
    expect(sessionAufgaben(p, ["2026-10-26"])[0]).toEqual({ titel: "Session: Webseite Papa", art: "projekt", projektId: "p1", wichtig: true, frist: "2026-12-15", geplantAm: "2026-10-26", uhrzeit: "18:00", dauerMin: 45, erinnerung: "15" });
  });
  it("Stand: erledigt, geplant, im Plan oder dahinter", () => {
    const a = [
      { art: "projekt", projektId: "p1", erledigtAm: "x" },
      { art: "projekt", projektId: "p1", geplantAm: "2026-11-02" },
      { art: "aufgabe", projektId: "p1", erledigtAm: "x" },
    ];
    expect(projektStand(p, a, new Date(2026, 9, 28))).toMatchObject({ fertig: 1, geplant: 1, ziel: 14, imPlan: true });
    expect(projektStand(p, a, new Date(2026, 11, 1)).imPlan).toBe(false);
  });
});
