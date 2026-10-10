import { describe, expect, it } from "vitest";
import { ANSICHTEN, ansichtName, ansichtenListe, befehlBereinigen, nameFinden, punktFinden } from "./akaBefehl";

describe("befehlBereinigen", () => {
  it("lässt nur bekannte Seiten zu", () => {
    expect(befehlBereinigen({ art: "oeffnen", ansicht: "denksport" })).toEqual({ art: "oeffnen", ansicht: "denksport" });
    expect(befehlBereinigen({ art: "oeffnen", ansicht: "gibtsnicht" })).toEqual({ art: "keine" });
  });
  it("prüft Mengen auf Plausibilität", () => {
    expect(befehlBereinigen({ art: "wasser", ml: "200" })).toEqual({ art: "wasser", ml: 200 });
    expect(befehlBereinigen({ art: "wasser", ml: 0 })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "wasser", ml: 50000 })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "tageslicht", minuten: 20 })).toEqual({ art: "tageslicht", minuten: 20 });
  });
  it("abhaken braucht mindestens einen Namen", () => {
    expect(befehlBereinigen({ art: "abhaken", namen: ["Vitamin D3", ""] })).toEqual({ art: "abhaken", namen: ["Vitamin D3"] });
    expect(befehlBereinigen({ art: "abhaken", namen: [] })).toEqual({ art: "keine" });
  });
  it("Unbekanntes oder Kaputtes wird zu keine", () => {
    expect(befehlBereinigen(null)).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "loeschen" })).toEqual({ art: "keine" });
  });
});

describe("punktFinden", () => {
  const items = [
    { name: "Vitamin D3", done: false },
    { name: "Frühstück", done: true },
    { name: "Frühstück", done: false, key: "zwei" },
    { name: "10 Minuten Spaziergang", done: false },
  ];
  it("findet exakt, ohne Groß-/Kleinschreibung", () => {
    expect(punktFinden(items, "vitamin d3").name).toBe("Vitamin D3");
  });
  it("findet über Teilwörter in beide Richtungen", () => {
    expect(punktFinden(items, "Vitamin D").name).toBe("Vitamin D3");
    expect(punktFinden(items, "Spaziergang").name).toBe("10 Minuten Spaziergang");
  });
  it("nimmt nur offene Punkte", () => {
    expect(punktFinden(items, "Frühstück").key).toBe("zwei");
    expect(punktFinden(items, "Yoga")).toBeNull();
  });
});

describe("Seitenliste", () => {
  it("hat eindeutige ids und lesbare Namen", () => {
    expect(new Set(ANSICHTEN.map((a) => a.id)).size).toBe(ANSICHTEN.length);
    expect(ansichtName("denksport")).toBe("Spiele");
    expect(ansichtenListe()).toContain("wochenuebersicht = Wochenübersicht (Wochenplan)");
  });
});

describe("Ausbau 10.10.: starten, löschen, verschieben, Startzeit", () => {
  it("starten nur mit bekanntem Ziel", () => {
    expect(befehlBereinigen({ art: "starten", ziel: "morgenroutine" })).toEqual({ art: "starten", ziel: "morgenroutine", name: null, minuten: null });
    expect(befehlBereinigen({ art: "starten", ziel: "fokus", name: "Steuer", minuten: 25 })).toEqual({ art: "starten", ziel: "fokus", name: "Steuer", minuten: 25 });
    expect(befehlBereinigen({ art: "starten", ziel: "rakete" })).toEqual({ art: "keine" });
  });
  it("löschen braucht bekannten Typ und Namen", () => {
    expect(befehlBereinigen({ art: "loeschen", typ: "gewohnheit", name: " Lesen " })).toEqual({ art: "loeschen", typ: "gewohnheit", name: "Lesen" });
    expect(befehlBereinigen({ art: "loeschen", typ: "konto", name: "x" })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "loeschen", typ: "aufgabe", name: "" })).toEqual({ art: "keine" });
  });
  it("verschieben braucht ein gültiges Datum", () => {
    expect(befehlBereinigen({ art: "verschieben", name: "Steuer", datum: "2026-10-16" })).toEqual({ art: "verschieben", name: "Steuer", datum: "2026-10-16" });
    expect(befehlBereinigen({ art: "verschieben", name: "Steuer", datum: "Freitag" })).toEqual({ art: "keine" });
  });
  it("Startzeit nur für Morgen/Abend mit HH:MM", () => {
    expect(befehlBereinigen({ art: "startzeit", routine: "morgen", uhrzeit: "06:30" })).toEqual({ art: "startzeit", routine: "morgen", uhrzeit: "06:30" });
    expect(befehlBereinigen({ art: "startzeit", routine: "morgen", uhrzeit: "25:00" })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "startzeit", routine: "mittag", uhrzeit: "12:00" })).toEqual({ art: "keine" });
  });
  it("nameFinden sucht im gewählten Feld", () => {
    const aufgaben = [{ titel: "Steuererklärung machen" }, { titel: "Mama anrufen" }];
    expect(nameFinden(aufgaben, "mama anrufen", "titel").titel).toBe("Mama anrufen");
    expect(nameFinden(aufgaben, "Steuererklärung", "titel").titel).toBe("Steuererklärung machen");
    expect(nameFinden(aufgaben, "Wäsche", "titel")).toBeNull();
  });
});
