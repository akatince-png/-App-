import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import TagesRueckblick from "./TagesRueckblick";

let daten;
vi.mock("../context/AppDataContext", () => ({ useAppData: () => daten }));

function Huelle({ start }) {
  const [aufgaben, setAufgaben] = useState(start);
  daten = {
    matrixAufgaben: aufgaben,
    projekte: [{ id: "p1", name: "Russisch lernen", sessionTage: ["Mo", "Di"] }],
    matrixAufgabeSpeichern: async (a) => {
      const neu = a.id ? a : { ...a, id: `neu-${Math.random()}` };
      setAufgaben((p) => [...p.filter((x) => x.id !== neu.id), neu]);
      return { ok: true, aufgabe: neu };
    },
  };
  return <TagesRueckblick />;
}

// 25.10. (Nutzerin): erst „heute geschafft?“, dann für morgen planen;
// Projekte einmal, freiwillige Aufgaben nie als MIT.
describe("TagesRueckblick", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 25, 22, 0));
  });
  it("Rückblick → Planung mit ⭐ und freiwillig", async () => {
    const sessions = ["2026-10-26", "2026-10-27"].map((d, i) => ({ id: `s${i}`, titel: "Session: Russisch lernen", art: "projekt", projektId: "p1", wichtig: true, frist: "2026-12-31", geplantAm: d }));
    render(<Huelle start={[{ id: "a", titel: "Wochenplan erstellen", geplantAm: "2026-10-25", wichtig: true }, { id: "b", titel: "Website Papa", geplantAm: "2026-10-25", wichtig: true }, { id: "c", titel: "Steuer", wichtig: true }, ...sessions]} />);
    expect(screen.getByText("✅ Was hast du heute geschafft?")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getAllByText("✓ Geschafft")[0]));
    await act(async () => fireEvent.click(screen.getByText("→ Morgen")));
    await act(async () => fireEvent.click(screen.getByText(/Weiter zur Planung/)));
    expect(screen.getByText("⭐ Was planst du für morgen?")).toBeTruthy();
    // Russisch nur einmal.
    expect(screen.getAllByText(/Session: Russisch lernen/)).toHaveLength(1);
    await act(async () => fireEvent.click(screen.getByLabelText("Session: Russisch lernen als MIT wählen")));
    expect(screen.getByLabelText("Session: Russisch lernen: MIT abwählen")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByLabelText("Steuer freiwillig einplanen")));
    expect(screen.getByText("FREIWILLIG DAZU")).toBeTruthy();
    expect(screen.getAllByText("freiwillig – kein Muss").length).toBeGreaterThan(0);
  });
});
