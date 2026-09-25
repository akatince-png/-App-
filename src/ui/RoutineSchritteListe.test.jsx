import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoutineSchritteListe from "./RoutineSchritteListe";

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ routineSchrittZeit: (id) => (id === "s1" ? "06:30" : "") }),
}));
// Card (primitives.jsx) importiert transitiv useDiktat.js -> utils/speech.js
// -> supabaseClient.js, das ohne VITE_SUPABASE_URL im Unit-Test-Lauf sofort
// wirft (siehe DenkpauseNudge.test.jsx für dasselbe Muster bei useAppData).
vi.mock("../utils/speech", () => ({
  spracherkennungVerfuegbar: () => false,
  starteSprachErkennung: vi.fn(),
}));

const SCHRITTE = [
  { id: "s2", routine: "morgen", reihenfolge: 1, name: "Frühstück", dauerMin: 15 },
  { id: "s1", routine: "morgen", reihenfolge: 0, name: "Duschen", dauerMin: 10 },
];

// Nutzerinnen-Vorgabe (16.09.): die Schritte-Liste soll separat, größer
// lesbar und chronologisch sortiert erscheinen (nicht mehr klein, ganz oben
// im Editor) — hier abgesichert: Sortierung nach reihenfolge (nicht nach
// Array-Reihenfolge), errechnete Uhrzeit wird angezeigt, und Auf/Ab/
// Löschen bleiben weiterhin bedienbar.
describe("RoutineSchritteListe", () => {
  it("zeigt die Schritte chronologisch nach reihenfolge sortiert", () => {
    render(<RoutineSchritteListe routine="morgen" schritte={SCHRITTE} onEntfernen={() => {}} onVerschieben={() => {}} />);
    const namen = screen.getAllByText(/Duschen|Frühstück/).map((el) => el.textContent);
    expect(namen[0]).toContain("Duschen");
    expect(namen[1]).toContain("Frühstück");
  });

  it("zeigt die errechnete Uhrzeit vor dem Namen, wenn vorhanden", () => {
    const { container } = render(<RoutineSchritteListe routine="morgen" schritte={SCHRITTE} onEntfernen={() => {}} onVerschieben={() => {}} />);
    // Zeit und Name stehen in getrennten <span>s im selben Zeilen-Div —
    // per textContent statt getByText prüfen, das nicht über Knotengrenzen matcht.
    expect(container.textContent).toMatch(/06:30\s*·\s*Duschen/);
  });

  it("ruft onVerschieben mit der richtigen Richtung auf", () => {
    const onVerschieben = vi.fn();
    render(<RoutineSchritteListe routine="morgen" schritte={SCHRITTE} onEntfernen={() => {}} onVerschieben={onVerschieben} />);
    fireEvent.click(screen.getAllByText("▼")[0]);
    expect(onVerschieben).toHaveBeenCalledWith("s1", "runter");
  });

  it("fragt vor dem Entfernen nach und ruft dann onEntfernen auf", () => {
    const onEntfernen = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<RoutineSchritteListe routine="morgen" schritte={SCHRITTE} onEntfernen={onEntfernen} onVerschieben={() => {}} />);
    fireEvent.click(screen.getAllByText("×")[0]);
    expect(onEntfernen).toHaveBeenCalledWith("s1");
    window.confirm.mockRestore();
  });

  it("zeigt einen Leer-Hinweis, wenn noch keine Schritte da sind", () => {
    render(<RoutineSchritteListe routine="morgen" schritte={[]} onEntfernen={() => {}} onVerschieben={() => {}} />);
    expect(screen.getByText(/Noch keine Schritte/)).toBeInTheDocument();
  });
});

describe("RoutineSchritteListe – Kernprogramm", () => {
  it("Pflicht-Baustein: 🔒 statt Löschen, Name/Dauer einstellbar", () => {
    render(
      <RoutineSchritteListe
        routine="morgen"
        schritte={[{ id: "k1", routine: "morgen", reihenfolge: 0, name: "💧 Glas Wasser", dauerMin: 1, kernKey: "wasser" }, ...SCHRITTE]}
        onEntfernen={() => {}}
        onVerschieben={() => {}}
        zeigeVerlauf={false}
      />
    );
    expect(screen.getByText(/gehört zum Kernprogramm/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "×" }).length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "💧 Glas Wasser einstellen" }));
    expect(screen.getByLabelText("Dauer in Minuten").value).toBe("1");
  });
});
