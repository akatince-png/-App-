import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BildTagesplan from "./BildTagesplan";

vi.mock("../data/useFokusTimer", () => ({ useFokusTimer: () => ({ timer: null, restSek: 0, anteil: 0, starten: () => {}, stoppen: () => {} }) }));

// 25.10. (Nutzerin): gleichzeitige Supplemente als eine aufklappbare Gabe.
describe("BildTagesplan – gebündelte Supplementgabe", () => {
  it("zeigt eine Gabe, klappt auf und hakt einzeln oder alle ab", () => {
    const a = vi.fn();
    const b = vi.fn();
    const items = [
      { key: "s1", kategorie: "supplement", name: "Magnesium", detail: "200 mg", uhrzeit: "21:55", onConfirm: a },
      { key: "s2", kategorie: "supplement", name: "NAC", detail: "600 mg", uhrzeit: "21:55", onConfirm: b },
    ];
    render(<BildTagesplan items={items} heute={false} onBearbeiten={() => {}} />);
    expect(screen.getByText("Supplemente · 2")).toBeTruthy();
    fireEvent.click(screen.getByText("Supplemente · 2"));
    fireEvent.click(screen.getByRole("button", { name: "NAC erledigt" }));
    expect(b).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Supplemente · 2 erledigt" }));
    expect(a).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Magnesium bearbeiten" })).toBeTruthy();
  });
});
