import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestsKarte } from "./QuestsKarte";

// Video-Nachweis lädt Supabase – für diesen Test unnötig.
vi.mock("./VideoNachweis", () => ({ VideoNachweisKnopf: () => null }));

const quest = (id, titel, erledigt) => ({ id, titel, typ: "einfach", fortschritt: { angenommen: true, erledigt } });

describe("QuestsKarte", () => {
  it("zeigt offene Quests sofort und erledigte erst nach Antippen", () => {
    render(<QuestsKarte quests={[quest(1, "Offene Quest", false), quest(2, "Alte Quest", true), quest(3, "Ältere Quest", true)]} onFortschritt={vi.fn()} />);
    expect(screen.getByText("Offene Quest")).toBeInTheDocument();
    expect(screen.queryByText("Alte Quest")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /2 Quests geschafft/ }));
    expect(screen.getByText("Alte Quest")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Zurücksetzen" })).toHaveLength(2);
  });
});
