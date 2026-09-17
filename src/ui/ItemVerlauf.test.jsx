import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemVerlauf from "./ItemVerlauf";

const EINTRAEGE = [
  { id: "1", kategorie: "hormon", itemName: "Testosteron", aktion: "geändert", detail: "Menge: 10mg → 20mg", grund: "", erstelltAm: "2026-09-17T10:00:00.000Z" },
  { id: "2", kategorie: "hormon", itemName: "Testosteron", aktion: "erledigt", detail: "", grund: "", erstelltAm: "2026-09-17T09:00:00.000Z" },
  { id: "3", kategorie: "hormon", itemName: "Anderes Medikament", aktion: "geändert", detail: "Uhrzeit geändert", grund: "", erstelltAm: "2026-09-16T10:00:00.000Z" },
  { id: "4", kategorie: "supplement", itemName: "Testosteron", aktion: "geändert", detail: "sollte nicht auftauchen", grund: "", erstelltAm: "2026-09-15T10:00:00.000Z" },
];

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ protokollEintraege: EINTRAEGE }),
}));

// Nutzerinnen-Vorgabe (17.09.): "Die Veränderung selber ... soll lediglich
// im Protokoll einsehbar sein, nicht im Tagesverlauf". ItemVerlauf ist der
// neue, einzige Ort für genau diese Struktur-Historie EINES Eintrags —
// abgesichert: richtig gefiltert (kategorie+itemName, nur Struktur-Aktionen,
// nicht "erledigt"), leerer Zustand, Auf-/Zuklappen.
describe("ItemVerlauf", () => {
  it("zeigt nur zur kategorie+itemName passende Struktur-Änderungen, nicht 'erledigt' und nicht andere Einträge", () => {
    render(<ItemVerlauf kategorie="hormon" itemName="Testosteron" />);
    fireEvent.click(screen.getByText(/🕐 Verlauf/));
    expect(screen.getByText("Menge: 10mg → 20mg")).toBeInTheDocument();
    expect(screen.queryByText("Uhrzeit geändert")).not.toBeInTheDocument();
    expect(screen.queryByText("sollte nicht auftauchen")).not.toBeInTheDocument();
  });

  it("zeigt die Anzahl im Button-Text", () => {
    render(<ItemVerlauf kategorie="hormon" itemName="Testosteron" />);
    expect(screen.getByText(/🕐 Verlauf \(1\)/)).toBeInTheDocument();
  });

  it("zeigt einen Leer-Hinweis ohne passende Einträge", () => {
    render(<ItemVerlauf kategorie="hormon" itemName="Unbekanntes Mittel" />);
    fireEvent.click(screen.getByText(/🕐 Verlauf/));
    expect(screen.getByText("Noch keine Änderungen protokolliert.")).toBeInTheDocument();
  });
});
