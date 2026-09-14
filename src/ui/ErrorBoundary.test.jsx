import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Bombe() {
  throw new Error("Kaboom");
}

describe("ErrorBoundary", () => {
  it("rendert die Kinder normal, solange nichts abstürzt", () => {
    render(
      <ErrorBoundary>
        <div>Alles gut</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Alles gut")).toBeInTheDocument();
  });

  it("fängt einen Absturz ab und zeigt die freundliche Fehleranzeige statt einer leeren Seite", () => {
    // React loggt den Fehler zusätzlich selbst in die Konsole — hier bewusst stummgeschaltet,
    // damit der erwartete Testfehler nicht wie ein echtes Problem im Testlauf aussieht.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bombe />
      </ErrorBoundary>
    );
    expect(screen.getByText("Puh, da ist etwas schiefgelaufen.")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("ruft onReset auf und setzt sich selbst zurück, wenn 'Zurück zur Startseite' angetippt wird", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <Bombe />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText("Zurück zur Startseite"));
    expect(onReset).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
