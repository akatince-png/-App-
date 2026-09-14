import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useDiktat } from "./useDiktat";
import { starteSprachErkennung } from "../utils/speech";

// Reine Web-Speech-API, keine KI beteiligt (siehe useDiktat.js) — hier wird
// nur starteSprachErkennung() selbst gemockt (kein echtes Mikrofon im
// Testrunner), NICHT AIService — der wird von useDiktat gar nicht
// importiert, was dieser Test indirekt auch belegt (kein entsprechender
// Mock nötig, damit die Tests grün sind).
vi.mock("../utils/speech", () => ({
  spracherkennungVerfuegbar: () => true,
  starteSprachErkennung: vi.fn(),
}));

function Testfeld() {
  const [wert, setWert] = useState("");
  const diktat = useDiktat({ value: wert, onChange: setWert });
  return (
    <div>
      <span data-testid="wert">{wert}</span>
      <span data-testid="interim">{diktat.interim}</span>
      <span data-testid="hoert">{diktat.hoert ? "an" : "aus"}</span>
      <button onClick={diktat.umschalten}>umschalten</button>
    </div>
  );
}

describe("useDiktat", () => {
  let callbacks;
  let stopFn;

  beforeEach(() => {
    vi.clearAllMocks();
    stopFn = vi.fn();
    starteSprachErkennung.mockImplementation((cb) => {
      callbacks = cb;
      return stopFn;
    });
  });

  it("zeigt Zwischenergebnisse getrennt an, ohne sie schon in den Feldwert zu übernehmen", () => {
    render(<Testfeld />);
    fireEvent.click(screen.getByText("umschalten"));
    expect(screen.getByTestId("hoert").textContent).toBe("an");

    act(() => callbacks.onZwischenergebnis("Hallo Wel"));
    expect(screen.getByTestId("interim").textContent).toBe("Hallo Wel");
    expect(screen.getByTestId("wert").textContent).toBe("");
  });

  it("hängt fertig erkannte Satzstücke an den bestehenden Feldwert an und leert danach das Zwischenergebnis", () => {
    render(<Testfeld />);
    fireEvent.click(screen.getByText("umschalten"));

    act(() => callbacks.onZwischenergebnis("Hallo Wel"));
    act(() => callbacks.onErgebnis("Hallo Welt."));
    expect(screen.getByTestId("wert").textContent).toBe("Hallo Welt.");
    expect(screen.getByTestId("interim").textContent).toBe("");

    act(() => callbacks.onErgebnis("Zweiter Satz."));
    expect(screen.getByTestId("wert").textContent).toBe("Hallo Welt. Zweiter Satz.");
  });

  it("stoppt die laufende Erkennung, wenn während des Zuhörens nochmal umgeschaltet wird", () => {
    render(<Testfeld />);
    fireEvent.click(screen.getByText("umschalten"));
    fireEvent.click(screen.getByText("umschalten"));
    expect(stopFn).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("hoert").textContent).toBe("aus");
  });

  it("setzt hoert zurück und zeigt die Fehlermeldung, wenn die Erkennung einen Fehler meldet", () => {
    render(<Testfeld />);
    fireEvent.click(screen.getByText("umschalten"));
    act(() => callbacks.onFehler("Kein Mikrofon gefunden."));
    expect(screen.getByTestId("hoert").textContent).toBe("aus");
  });
});
