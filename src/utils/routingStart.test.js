import { describe, expect, it } from "vitest";
import { anfangsZielErlaubt } from "./routing";

describe("Start auf der Startseite (07.10.)", () => {
  it("Neuladen öffnet nie die zuletzt offene Seite", () => {
    expect(anfangsZielErlaubt("tagebuch", "reload")).toBe(false);
    expect(anfangsZielErlaubt("kalender", "reload")).toBe(false);
  });
  it("Sprung-Links aus Erinnerungen bleiben erlaubt", () => {
    expect(anfangsZielErlaubt("kalender", "navigate")).toBe(true);
    expect(anfangsZielErlaubt("coach-chat", "navigate")).toBe(true);
  });
  it("andere Seiten beim Öffnen → Startseite", () => {
    expect(anfangsZielErlaubt("tagebuch", "navigate")).toBe(false);
    expect(anfangsZielErlaubt(null, "navigate")).toBe(false);
  });
});
