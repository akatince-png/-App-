import { describe, expect, it } from "vitest";
import { naechsteSchritte, zeitText } from "./naechsteSchritte";

describe("naechsteSchritte", () => {
  const items = [
    { key: "a", kategorie: "morgenroutine", uhrzeit: "06:30", done: false },
    { key: "b", kategorie: "gewohnheit", uhrzeit: "", done: false },
    { key: "c", kategorie: "workflow", uhrzeit: "09:00", done: false },
    { key: "d", kategorie: "supplement", uhrzeit: "08:00", done: false },
    { key: "e", kategorie: "mahlzeit", uhrzeit: "07:30", done: true },
  ];
  it("offene Punkte ohne Routinen, nach Uhrzeit, ohne Uhrzeit am Ende", () => {
    expect(naechsteSchritte(items).map((i) => i.key)).toEqual(["d", "c", "b"]);
    expect(naechsteSchritte(items, 1).map((i) => i.key)).toEqual(["d"]);
  });
  it("Zeittext", () => {
    const jetzt = new Date(2026, 9, 7, 8, 0);
    expect(zeitText({ uhrzeit: "08:03" }, jetzt)).toBe("jetzt dran");
    expect(zeitText({ uhrzeit: "09:30" }, jetzt)).toBe("um 09:30 Uhr");
    expect(zeitText({ uhrzeit: "" }, jetzt)).toBe("heute");
  });
});

describe("nochNichtDran (03.11.)", () => {
  it("Mittagssupplemente um 13 Uhr sind um 7:40 noch nicht dran, um 12:45 schon", async () => {
    const { nochNichtDran } = await import("./naechsteSchritte");
    const mittag = { uhrzeit: "13:00" };
    expect(nochNichtDran(mittag, new Date(2026, 10, 3, 7, 40))).toBe(true);
    expect(nochNichtDran(mittag, new Date(2026, 10, 3, 12, 45))).toBe(false);
    expect(nochNichtDran({ uhrzeit: null }, new Date(2026, 10, 3, 7, 40))).toBe(false);
  });
});
