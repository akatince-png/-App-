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
