import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GetraenkPortion from "./GetraenkPortion";

const schluck = vi.fn(async () => ({ ok: true }));
const wasser = vi.fn();
vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ supplementMengeMl: { "2026-10-26__s1__06:02": 500 }, supplementSchluck: schluck, hydrationHinzufuegen: wasser }),
}));

// 26.10. (Nutzerin): Shaker 1,5 l über den Tag in Portionen statt „erledigt“.
describe("GetraenkPortion", () => {
  it("zeigt den Stand und trägt eine Portion ein, die auch zum Wasser zählt", async () => {
    const dose = { datum: "2026-10-26", id: "s1", zeit: "06:02" };
    render(<GetraenkPortion dose={dose} gesamtMl={1500} />);
    expect(screen.getByText("🥤 500 von 1500 ml")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText("+250 ml")));
    expect(schluck).toHaveBeenCalledWith(dose, 250);
    expect(wasser).toHaveBeenCalledWith(250, { leise: true });
  });
});
