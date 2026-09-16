import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DenkpauseNudge from "./DenkpauseNudge";

// useAppData() gemockt statt über einen echten Provider gerendert — der
// echte AppDataContext-Baum importiert transitiv supabaseClient.js, das
// ohne VITE_SUPABASE_URL/-ANON_KEY (im Vitest-Unit-Test-Lauf nicht
// gesetzt, anders als im Playwright-E2E-Setup) sofort einen Fehler wirft.
// DenkpauseNudge braucht ohnehin nur dieses eine Feld aus dem großen
// AppData-Objekt.
const denkpauseErgebnisVermerken = vi.fn();
vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({ denkpauseErgebnisVermerken }),
}));

function renderMitAppData(ui) {
  denkpauseErgebnisVermerken.mockClear();
  return { ...render(ui), denkpauseErgebnisVermerken };
}

// Kernregeln aus der Nutzerinnen-Vorgabe (16.09.), die hier abgesichert
// werden: "Nee, weiter" muss in JEDER Phase sofort funktionieren (nie eine
// Sackgasse), eine Antwort darf nie blockieren/verlangt werden, und eine
// beantwortete Aufgabe wird (unabhängig von richtig/falsch) genau einmal
// vermerkt — das speist das bestehende Punktesystem + die Erfolge-Statistik.
describe("DenkpauseNudge", () => {
  it("zeigt zuerst das Angebot mit Klar/Nee-weiter", () => {
    renderMitAppData(<DenkpauseNudge onDismiss={() => {}} />);
    expect(screen.getByText("Klar")).toBeInTheDocument();
    expect(screen.getByText("Nee, weiter")).toBeInTheDocument();
  });

  it("ruft onDismiss sofort auf, wenn im Angebot übersprungen wird", () => {
    const onDismiss = vi.fn();
    renderMitAppData(<DenkpauseNudge onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Nee, weiter"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("zeigt nach 'Klar' eine Frage mit genau 4 Antwort-Buttons", () => {
    renderMitAppData(<DenkpauseNudge onDismiss={() => {}} />);
    fireEvent.click(screen.getByText("Klar"));
    // 4 Antwort-Buttons + der weiterhin sichtbare "Nee, weiter"-Link.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("Nee, weiter")).toBeInTheDocument();
  });

  it("ruft onDismiss sofort auf, wenn in der Aufgaben-Phase übersprungen wird, ohne etwas zu vermerken", () => {
    const onDismiss = vi.fn();
    const { denkpauseErgebnisVermerken } = renderMitAppData(<DenkpauseNudge onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Klar"));
    fireEvent.click(screen.getByText("Nee, weiter"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(denkpauseErgebnisVermerken).not.toHaveBeenCalled();
  });

  it("vermerkt die Antwort und ruft onDismiss verzögert auf, unabhängig davon ob richtig oder falsch", async () => {
    const onDismiss = vi.fn();
    const { denkpauseErgebnisVermerken } = renderMitAppData(<DenkpauseNudge onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Klar"));
    const buttons = screen.getAllByRole("button").filter((b) => b.textContent !== "Nee, weiter");
    fireEvent.click(buttons[0]);
    expect(denkpauseErgebnisVermerken).toHaveBeenCalledTimes(1);
    const [kategorie, richtig] = denkpauseErgebnisVermerken.mock.calls[0];
    expect(typeof kategorie).toBe("string");
    expect(typeof richtig).toBe("boolean");
    expect(onDismiss).not.toHaveBeenCalled();
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1), { timeout: 2000 });
  });

  it("zeigt einen eigenen Hinweistext an, wenn `text` übergeben wird", () => {
    renderMitAppData(<DenkpauseNudge text="Noch 12 Min. bis zum Limit." onDismiss={() => {}} />);
    expect(screen.getByText("Noch 12 Min. bis zum Limit.")).toBeInTheDocument();
  });
});
