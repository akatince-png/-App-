import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LiveWorkout from "./LiveWorkout";

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ spotifyVerbunden: false, spotifyAnlaesse: {}, spotifyPausieren: () => {}, uebungsBilder: {} }),
}));
vi.mock("../utils/speech", () => ({ spracherkennungVerfuegbar: () => false, starteSprachErkennung: vi.fn() }));
vi.mock("../data/useIntervallMusikSync", () => ({ useIntervallMusikSync: () => {} }));

const SESSION = { id: "t1", art: "Krafttraining", uebungen: [{ name: "Kniebeugen", saetze: 1, wiederholungen: 10, pauseSekunden: 60 }] };

// 25.09.: Die Frage nach dem letzten Satz ist ein Angebot – man darf nie
// dort festhängen (Dauertest blieb genau dort stehen, Training nicht gespeichert).
describe("LiveWorkout – Frage nach dem letzten Satz", () => {
  it("lässt sich mit 'Weiter ohne Angabe' überspringen", () => {
    render(<LiveWorkout session={SESSION} onFertig={() => {}} onSchliessen={() => {}} />);
    fireEvent.click(screen.getByText("Satz fertig"));
    expect(screen.getByText("Alle 10 Wiederholungen geschafft?")).toBeTruthy();
    fireEvent.click(screen.getByText("Weiter ohne Angabe"));
    expect(screen.getByText("Tatsächlich durchgeführt:")).toBeTruthy();
  });
});
