import { describe, it, expect } from "vitest";
import { aufnahmeFormat, downloadName, grundTyp, nachweisPfad, restTage, sollGeloeschtWerden } from "./videoNachweis";

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

describe("Archiv: was wird nachts gelöscht?", () => {
  const jetzt = new Date("2026-10-10T12:00:00");
  const alt = "2026-10-01T12:00:00";
  const neu = "2026-10-09T12:00:00";
  const n = (status, created_at = alt) => ({ status, created_at, pfad: "u/x.webm" });
  it("offene Videos nach 7 Tagen, unabhängig vom Einverständnis", () => {
    expect(sollGeloeschtWerden(n("offen"), true, jetzt)).toBe(true);
    expect(sollGeloeschtWerden(n("offen", neu), true, jetzt)).toBe(false);
  });
  it("Archiv bleibt mit Einverständnis, verschwindet beim Widerruf", () => {
    expect(sollGeloeschtWerden(n("archiviert"), true, jetzt)).toBe(false);
    expect(sollGeloeschtWerden(n("archiviert", neu), false, jetzt)).toBe(true);
  });
  it("Zum Besprechen: ohne Einverständnis nach 7 Tagen, mit Einverständnis bis der Coach entscheidet", () => {
    expect(sollGeloeschtWerden(n("besprechen"), null, jetzt)).toBe(true);
    expect(sollGeloeschtWerden(n("besprechen", neu), null, jetzt)).toBe(false);
    expect(sollGeloeschtWerden(n("besprechen"), true, jetzt)).toBe(false);
  });
  it("Download-Name ist lesbar", () => {
    expect(downloadName({ created_at: "2026-10-01T08:00:00Z", titel: "Kniebeugen · Satz 2", pfad: "u/a.webm" }, "Lea")).toBe("Lea_2026-10-01_Kniebeugen_Satz_2.webm");
  });
});
