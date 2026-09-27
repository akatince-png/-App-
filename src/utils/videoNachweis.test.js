import { describe, it, expect } from "vitest";
import { aufnahmeFormat, grundTyp, nachweisPfad, restTage } from "./videoNachweis";

describe("Video-Nachweis-Helfer", () => {
  it("wählt das erste unterstützte Format", () => {
    expect(aufnahmeFormat((m) => m === "video/webm")).toBe("video/webm");
    expect(aufnahmeFormat((m) => m === "video/mp4")).toBe("video/mp4");
    expect(aufnahmeFormat(() => false)).toBe("");
  });
  it("legt Videos im eigenen Ordner mit passender Endung ab", () => {
    expect(nachweisPfad("u1", "abc", "video/webm;codecs=vp8")).toBe("u1/abc.webm");
    expect(nachweisPfad("u1", "abc", "video/mp4")).toBe("u1/abc.mp4");
    expect(grundTyp("video/webm;codecs=vp9")).toBe("video/webm");
  });
  it("zählt die Tage bis zum automatischen Löschen herunter", () => {
    const jetzt = new Date("2026-10-05T12:00:00");
    expect(restTage("2026-10-05T11:00:00", jetzt)).toBe(7);
    expect(restTage("2026-09-30T12:00:00", jetzt)).toBe(2);
    expect(restTage("2026-09-20T12:00:00", jetzt)).toBe(0);
  });
});
