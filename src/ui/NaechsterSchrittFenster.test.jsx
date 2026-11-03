import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NaechsterSchrittFenster from "./NaechsterSchrittFenster";

// 26.10. (Nutzerin): Supplemente als eine Abfrage mit Liste, einzelne abwählbar.
describe("NaechsterSchrittFenster – Bündel", () => {
  it("hakt nur die ausgewählten Teile ab", () => {
    const teile = [
      { key: "a", kategorie: "supplement", name: "Milgamma", detail: "1 Tablette" },
      { key: "b", kategorie: "supplement", name: "Ginkgo", detail: "125 mg" },
      { key: "c", kategorie: "supplement", name: "Jod" },
    ];
    const onErledigt = vi.fn();
    render(<NaechsterSchrittFenster schritte={[{ key: "x", kategorie: "supplement", name: "Supplemente", uhrzeit: "06:40", teile }]} direkt={() => true} onErledigt={onErledigt} onOeffnen={() => {}} onSpaeter={() => {}} />);
    expect(screen.getByText("✓ Genommen (3)")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Ginkgo/ }));
    fireEvent.click(screen.getByText("✓ Genommen (2)"));
    expect(onErledigt.mock.calls[0][1].map((t) => t.key)).toEqual(["a", "c"]);
  });
});

// 03.11. (Nutzerin): Nach der Morgenroutine nicht schon die Mittagssupplemente
// zum Einnehmen anbieten – nur ankündigen und „Bis später“.
describe("NaechsterSchrittFenster – noch nicht dran", () => {
  it("kündigt einen späteren Punkt nur an", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 7, 40));
    const onSpaeter = vi.fn();
    const onErledigt = vi.fn();
    render(<NaechsterSchrittFenster schritte={[{ key: "m", kategorie: "supplement", name: "Mittagssupplemente", uhrzeit: "13:00" }]} direkt={() => true} onErledigt={onErledigt} onOeffnen={() => {}} onSpaeter={onSpaeter} />);
    expect(screen.getByText("DEIN NÄCHSTER SCHRITT HEUTE")).toBeTruthy();
    expect(screen.queryByText("✓ Erledigt")).toBeNull();
    fireEvent.click(screen.getByText("Bis später 👋"));
    expect(onSpaeter).toHaveBeenCalled();
    expect(onErledigt).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
  it("bietet Abhaken an, wenn es gleich dran ist", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 12, 50));
    render(<NaechsterSchrittFenster schritte={[{ key: "m", kategorie: "supplement", name: "Mittagssupplemente", uhrzeit: "13:00" }]} direkt={() => true} onErledigt={() => {}} onOeffnen={() => {}} onSpaeter={() => {}} />);
    expect(screen.getByText("✓ Erledigt")).toBeTruthy();
    vi.useRealTimers();
  });
});
