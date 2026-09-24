import { describe, it, expect } from "vitest";
import { routineTagesStatus, routinePseudoItems, mitRoutinePseudoItems } from "./routineStatus";

const SCHRITTE = [
  { id: "s1", routine: "morgen", reihenfolge: 0, name: "Duschen", dauerMin: 10 },
  { id: "s2", routine: "morgen", reihenfolge: 1, name: "Frühstück", dauerMin: 15 },
  { id: "s3", routine: "abend", reihenfolge: 0, name: "Zähne putzen", dauerMin: 5 },
];

// Nutzerinnen-Vorgabe (17.09.): "die ganze Routine pro Tag sehen, aber
// draufklicken und die Einzelschritte einsehen" — abgesichert: der
// geführte Ablauf (RoutineAblauf.jsx) schreibt keine einzelnen
// routine_schritt_logs, nur den fertigen Durchlauf — ein solcher Tag muss
// trotzdem ALLE Schritte als erledigt zeigen.
describe("routineTagesStatus", () => {
  it("zählt per Direkt-Bestätigung erledigte Schritte, ohne fertigen Durchlauf", () => {
    const status = routineTagesStatus("morgen", "2026-09-17", {
      routineSchritte: SCHRITTE,
      routineDurchlaeufe: [],
      routineSchrittErledigt: { "2026-09-17__s1": true },
    });
    expect(status.anzahlGesamt).toBe(2);
    expect(status.anzahlErledigt).toBe(1);
    expect(status.abgeschlossen).toBe(false);
    expect(status.schrittIstErledigt("s1")).toBe(true);
    expect(status.schrittIstErledigt("s2")).toBe(false);
  });

  it("zählt bei einem fertigen Durchlauf (geführter Ablauf) ALLE Schritte als erledigt, auch ohne einzelne Logs", () => {
    const status = routineTagesStatus("morgen", "2026-09-17", {
      routineSchritte: SCHRITTE,
      routineDurchlaeufe: [{ routine: "morgen", datum: "2026-09-17" }],
      routineSchrittErledigt: {},
    });
    expect(status.abgeschlossen).toBe(true);
    expect(status.anzahlErledigt).toBe(2);
    expect(status.schrittIstErledigt("s2")).toBe(true);
  });

  it("liefert 0/0 für eine Routine ohne konfigurierte Schritte", () => {
    const status = routineTagesStatus("abend", "2026-09-17", {
      routineSchritte: [],
      routineDurchlaeufe: [],
      routineSchrittErledigt: {},
    });
    expect(status.anzahlGesamt).toBe(0);
    expect(status.anzahlErledigt).toBe(0);
  });
});

describe("routinePseudoItems", () => {
  it("erzeugt für jede Routine mit Schritten genau einen Pseudo-Punkt", () => {
    const items = routinePseudoItems("2026-09-17", {
      routineSchritte: SCHRITTE,
      routineDurchlaeufe: [],
      routineSchrittErledigt: {},
      routineEinstellungen: {},
    });
    expect(items).toHaveLength(2);
    expect(items[0].kategorie).toBe("morgenroutine");
    expect(items[0].detail).toBe("0/2 Schritte");
    expect(items[1].kategorie).toBe("abendroutine");
  });

  it("lässt eine Routine ohne Schritte aus (nichts zum Reingucken da)", () => {
    const items = routinePseudoItems("2026-09-17", {
      routineSchritte: SCHRITTE.filter((s) => s.routine === "morgen"),
      routineDurchlaeufe: [],
      routineSchrittErledigt: {},
      routineEinstellungen: {},
    });
    expect(items.map((i) => i.kategorie)).toEqual(["morgenroutine"]);
  });

  it("nutzt den konfigurierten Zeitrahmen-Start statt des Richtwerts, wenn vorhanden", () => {
    const items = routinePseudoItems("2026-09-17", {
      routineSchritte: SCHRITTE,
      routineDurchlaeufe: [],
      routineSchrittErledigt: {},
      routineEinstellungen: { morgen: { startZeit: "07:30" } },
    });
    expect(items[0].uhrzeit).toBe("07:30");
  });
});

describe("mitRoutinePseudoItems", () => {
  it("fügt die Routine-Punkte sortiert nach Uhrzeit in eine bestehende Liste ein", () => {
    const bestehend = [{ kategorie: "hormon", key: "h1", hour: "08", uhrzeit: "08:00", name: "Testosteron" }];
    const kombiniert = mitRoutinePseudoItems(bestehend, "2026-09-17", {
      routineSchritte: SCHRITTE,
      routineDurchlaeufe: [],
      routineSchrittErledigt: {},
      routineEinstellungen: {},
    });
    // morgenroutine (Richtwert 06:00) vor dem Testosteron um 08:00, beide vor abendroutine (20:00).
    expect(kombiniert.map((i) => i.kategorie)).toEqual(["morgenroutine", "hormon", "abendroutine"]);
  });
});
