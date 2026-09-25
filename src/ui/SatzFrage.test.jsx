import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SatzFrage from "./SatzFrage";

describe("SatzFrage", () => {
  it("Ja = alle Wiederholungen, sonst Zahl antippen, Schwere optional", () => {
    const onAntwort = vi.fn();
    render(<SatzFrage soll="10" satz={2} onAntwort={onAntwort} />);
    fireEvent.click(screen.getByRole("button", { name: "passt" }));
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    expect(onAntwort).toHaveBeenCalledWith({ wdh: 8, schwere: "passt", geschafft: false });
    fireEvent.click(screen.getByRole("button", { name: "✅ Ja, alle 10" }));
    expect(onAntwort).toHaveBeenLastCalledWith({ wdh: 10, schwere: "passt", geschafft: true });
  });
  it("zeigt nach der Antwort nur noch die Bestätigung", () => {
    render(<SatzFrage soll="10" satz={1} antwort={{ wdh: 9, schwere: null }} onAntwort={() => {}} />);
    expect(screen.getByRole("status").textContent).toContain("9 Wdh. notiert");
  });
});
