import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Belohnungsfenster from "./Belohnungsfenster";
import { feuereBelohnung } from "../utils/belohnungBus";

afterEach(() => vi.useRealTimers());

describe("Belohnungsfenster", () => {
  it("große Feier bleibt stehen, bis sie weggetippt wird", () => {
    vi.useFakeTimers();
    render(<Belohnungsfenster />);
    act(() => feuereBelohnung({ text: "Morgenroutine geschafft!", punkte: 1, gross: true }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByText("Morgenroutine geschafft!")).toBeInTheDocument();
    expect(screen.getByText("⚡ +1 Punkt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Juhu, weiter/ }));
    expect(screen.queryByText("Morgenroutine geschafft!")).not.toBeInTheDocument();
  });

  it("kleine Meldung schließt nach 5 s von selbst oder per Tipp", () => {
    vi.useFakeTimers();
    render(<Belohnungsfenster />);
    act(() => feuereBelohnung({ text: "„Magnesium\" genommen", punkte: 1 }));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("„Magnesium\" genommen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.queryByText("„Magnesium\" genommen")).not.toBeInTheDocument();

    act(() => feuereBelohnung({ text: "Zweite", punkte: 1 }));
    fireEvent.click(screen.getByRole("status"));
    expect(screen.queryByText("Zweite")).not.toBeInTheDocument();
  });

  it("was während einer großen Feier kommt, wartet und erscheint danach", () => {
    render(<Belohnungsfenster />);
    act(() => {
      feuereBelohnung({ text: "Tag geschafft", gross: true });
      feuereBelohnung({ text: "Level 2 erreicht", gross: true });
    });
    expect(screen.queryByText("Level 2 erreicht")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Juhu, weiter/ }));
    expect(screen.getByText("Level 2 erreicht")).toBeInTheDocument();
  });
});
