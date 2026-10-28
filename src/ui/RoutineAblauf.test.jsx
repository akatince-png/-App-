import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let erledigt = {};
const merken = vi.fn();
vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    spotifyVerbunden: false,
    spotifyAnlaesse: {},
    spotifyAbspielen: vi.fn(),
    spotifyPausieren: vi.fn(),
    routineEinstellungen: {},
    belohnungPufferMin: 30,
    tagebuchEintraege: [],
    kernStand: null,
    routineSchrittErledigt: erledigt,
    routineSchrittMerken: merken,
  }),
}));
vi.mock("../data/liveAktualisierung", () => ({ useLiveNeuladenSperre: () => {} }));
vi.mock("../utils/speech", () => ({ spracherkennungVerfuegbar: () => false, starteSprachErkennung: vi.fn() }));
vi.mock("../utils/beep", () => ({ playBeep: vi.fn() }));

import RoutineAblauf from "./RoutineAblauf";
import { toLocalISODate } from "../utils/dates";

const SCHRITTE = [
  { id: "a", name: "Glas Wasser", dauerMin: 1 },
  { id: "b", name: "Duschen", dauerMin: 10 },
  { id: "c", name: "Frühstück", dauerMin: 15 },
];
const heute = toLocalISODate(new Date());

describe("Morgenroutine fortsetzen (28.10.)", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const k of Object.keys(erledigt)) delete erledigt[k];
    merken.mockClear();
  });

  it("merkt jeden fertigen Schritt sofort", () => {
    render(<RoutineAblauf routine="morgen" schritte={SCHRITTE} onAbschluss={() => {}} onAbbrechen={() => {}} />);
    fireEvent.click(screen.getByText("Schritt fertig"));
    expect(merken).toHaveBeenCalledWith("a", heute);
    const lauf = JSON.parse(localStorage.getItem("aka-routine-lauf-morgen"));
    expect(lauf.protokoll.map((p) => p.schrittId)).toEqual(["a"]);
  });

  it("macht nach dem Schließen beim nächsten offenen Schritt weiter", () => {
    localStorage.setItem("aka-routine-lauf-morgen", JSON.stringify({ datum: heute, fassung: "ganz", protokoll: [{ schrittId: "a" }, { schrittId: "b" }], gestartetUm: new Date().toISOString(), gesamtStart: Date.now() }));
    render(<RoutineAblauf routine="morgen" schritte={SCHRITTE} onAbschluss={() => {}} onAbbrechen={() => {}} />);
    expect(screen.getByText(/Schritt 3 von 3/)).toBeTruthy();
    expect(document.querySelector("[data-routine-fortgesetzt]")).not.toBeNull();
  });

  it("überspringt Schritte, die auf der Startseite abgehakt sind", () => {
    erledigt[`${heute}__a`] = true;
    render(<RoutineAblauf routine="morgen" schritte={SCHRITTE} onAbschluss={() => {}} onAbbrechen={() => {}} />);
    expect(screen.getByText(/Schritt 2 von 3/)).toBeTruthy();
  });
});
