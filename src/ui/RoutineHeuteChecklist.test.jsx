import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toLocalISODate } from "../utils/dates";
import RoutineHeuteChecklist from "./RoutineHeuteChecklist";

const aenderungVermerken = vi.fn();
const routineSchrittErledigtUmschalten = vi.fn();
const tagebuchSpeichern = vi.fn(async (e) => ({ ok: true, eintrag: e }));

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    routineSchritte: [
      { id: "s1", routine: "morgen", reihenfolge: 0, name: "Duschen", dauerMin: 10 },
      { id: "s2", routine: "morgen", reihenfolge: 1, name: "Frühstück", dauerMin: 15 },
      { id: "a1", routine: "abend", reihenfolge: 0, name: "Tagebuch: Wie war dein Tag?", dauerMin: 3, kernKey: "tagebuch" },
    ],
    tagebuchEintraege: [],
    tagebuchSpeichern,
    routineSchrittErledigt: { [`${toLocalISODate(new Date())}__s2`]: true },
    routineSchrittZeit: () => "",
    routineSchrittErledigtUmschalten,
    aenderungVermerken,
  }),
}));
// Card (primitives.jsx) importiert transitiv useDiktat.js -> utils/speech.js
// -> supabaseClient.js, das ohne VITE_SUPABASE_URL im Unit-Test-Lauf sofort
// wirft (siehe RoutineSchritteListe.test.jsx für dasselbe Muster).
vi.mock("../utils/speech", () => ({
  spracherkennungVerfuegbar: () => false,
  starteSprachErkennung: vi.fn(),
}));

// Nutzerinnen-Vorgabe (17.09.): "Alle Veränderungen sollen immer im
// Tagesverlauf mit auftauchen" — Bestätigen eines Routine-Schritts rief
// bisher nirgends aenderungVermerken() auf. Hier abgesichert: nur das
// Bestätigen eines offenen Schritts protokolliert, ein bereits erledigter
// Schritt (kein "Bestätigen"-Knopf mehr, siehe RoutineHeuteChecklist.jsx)
// löst nichts aus.
describe("RoutineHeuteChecklist", () => {
  it("protokolliert das Bestätigen eines offenen Schritts im Tagesverlauf", () => {
    render(<RoutineHeuteChecklist routine="morgen" />);
    fireEvent.click(screen.getByText("Bestätigen"));
    expect(routineSchrittErledigtUmschalten).toHaveBeenCalledWith("s1", toLocalISODate(new Date()));
    expect(aenderungVermerken).toHaveBeenCalledWith({ kategorie: "morgenroutine", itemName: "Duschen", aktion: "erledigt", detail: "" });
  });

  it("zeigt für den bereits erledigten Schritt keinen Bestätigen-Knopf (nichts zu protokollieren)", () => {
    render(<RoutineHeuteChecklist routine="morgen" />);
    expect(screen.getAllByText("Bestätigen")).toHaveLength(1);
  });

  // 25.09.: "Wie war dein Tag?" nicht mehr als Karte auf der Startseite,
  // sondern beim Tagebuch-Schritt der Abendroutine.
  it("Tagebuch-Schritt öffnet 'Wie war dein Tag?' und hakt erst nach dem Speichern ab", async () => {
    routineSchrittErledigtUmschalten.mockClear();
    render(<RoutineHeuteChecklist routine="abend" />);
    fireEvent.click(screen.getByText("Bestätigen"));
    expect(routineSchrittErledigtUmschalten).not.toHaveBeenCalled();
    expect(screen.getByText("📓 Wie war dein Tag?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "gut", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    await waitFor(() => expect(routineSchrittErledigtUmschalten).toHaveBeenCalledWith("a1", toLocalISODate(new Date())));
    expect(tagebuchSpeichern.mock.calls[0][0]).toMatchObject({ stimmung: 4 });
  });
});
