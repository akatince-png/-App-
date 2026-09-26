import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LiveWorkout from "./LiveWorkout";

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ spotifyVerbunden: false, spotifyAnlaesse: {}, spotifyPausieren: () => {}, uebungsBilder: {} }),
}));
vi.mock("../utils/speech", () => ({ spracherkennungVerfuegbar: () => false, starteSprachErkennung: vi.fn() }));
vi.mock("../data/useIntervallMusikSync", () => ({ useIntervallMusikSync: () => {} }));
// Kamera-Zählung: echte Erkennung braucht Kamera + MediaPipe → hier ersetzt.
vi.mock("./KameraZaehler", () => ({ default: ({ onFertig }) => <button onClick={() => onFertig(8)}>Kamera fertig 8</button> }));

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

  // 26.09.: Kamera-Zählung ersetzt die Frage – gezählte Wiederholungen werden direkt übernommen.
  it("übernimmt per Kamera gezählte Wiederholungen", () => {
    render(<LiveWorkout session={SESSION} onFertig={() => {}} onSchliessen={() => {}} />);
    fireEvent.click(screen.getByText("📷 Mit Kamera zählen"));
    fireEvent.click(screen.getByText("Kamera fertig 8"));
    expect(screen.getByText("Tatsächlich durchgeführt:")).toBeTruthy();
    expect(screen.getByText(/Satz 1: 8/)).toBeTruthy();
  });
});
