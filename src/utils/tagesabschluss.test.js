import { describe, it, expect } from "vitest";
import { abschlussTag, alsGeschafft, aufMorgen, heuteFaellig, inDenPool, kandidatenFuer, stand, aufgabeFuerTag } from "./tagesabschluss";

const heute = new Date(2026, 9, 25, 22, 0);
const morgen = "2026-10-26";

describe("Tagesabschluss (25.10.)", () => {
  it("heute fällig: eingeplant, ⭐ oder Frist heute, auch Liegengebliebenes", () => {
    const a = [
      { id: "1", titel: "Geplant", geplantAm: "2026-10-25" },
      { id: "2", titel: "Alt", geplantAm: "2026-10-23" },
      { id: "3", titel: "Frist", frist: "2026-10-25" },
      { id: "4", titel: "Morgen", geplantAm: morgen },
      { id: "5", titel: "Fertig", geplantAm: "2026-10-25", erledigtAm: "x" },
    ];
    expect(heuteFaellig(a, heute).map((x) => x.id).sort()).toEqual(["1", "2", "3"]);
  });
  it("geschafft, auf morgen, in den Pool", () => {
    const a = { id: "1", titel: "X", geplantAm: "2026-10-25", mitAm: "2026-10-25", uhrzeit: "09:00" };
    expect(alsGeschafft(a, heute).erledigtAm).toBeTruthy();
    expect(aufMorgen(a, heute)).toMatchObject({ geplantAm: morgen, mitAm: null, verschoben: 1 });
    expect(inDenPool(a)).toMatchObject({ geplantAm: null, uhrzeit: null, mitAm: null, verschoben: 1 });
  });
  it("nach Mitternacht zählt noch der Vortag", () => {
    expect(abschlussTag(new Date(2026, 9, 26, 1, 30)).getDate()).toBe(25);
    expect(abschlussTag(heute).getDate()).toBe(25);
  });
  it("ein Projekt steht nur einmal zur Wahl, nach Priorität sortiert", () => {
    const sessions = ["2026-10-26", "2026-10-27", "2026-10-28"].map((d, i) => ({ id: `s${i}`, titel: "Session: Russisch lernen", art: "projekt", projektId: "p1", wichtig: true, frist: "2026-12-31", geplantAm: d }));
    const aufgaben = [...sessions, { id: "a", titel: "Schuldenberatung", wichtig: true, frist: "2026-10-25" }, { id: "b", titel: "Irgendwann", wichtig: false }];
    const k = kandidatenFuer(aufgaben, [{ id: "p1", name: "Russisch lernen", sessionTage: ["Mo"] }], new Date(2026, 9, 26));
    expect(k.map((x) => x.titel)).toEqual(["Schuldenberatung", "Session: Russisch lernen", "Irgendwann"]);
    expect(k[1].aufgabe.id).toBe("s0");
  });
  it("laufendes Projekt ohne offene Session ist trotzdem wählbar und bekommt eine neue Session", () => {
    const p = { id: "p1", name: "Russisch lernen", sessionTage: ["Di"], sessionUhrzeit: "20:00", sessionDauerMin: 30 };
    const [k] = kandidatenFuer([], [p], new Date(2026, 9, 26));
    expect(k.titel).toBe("Session: Russisch lernen");
    expect(aufgabeFuerTag(k, morgen)).toMatchObject({ art: "projekt", projektId: "p1", geplantAm: morgen, uhrzeit: "20:00" });
  });
  it("Stand: ⭐ oder freiwillig eingeplant", () => {
    const k = { key: "a" };
    expect(stand(k, [{ id: "a", mitAm: morgen }], morgen)).toBe("mit");
    expect(stand(k, [{ id: "a", geplantAm: morgen }], morgen)).toBe("geplant");
    expect(stand(k, [{ id: "a" }], morgen)).toBe(null);
  });
});
