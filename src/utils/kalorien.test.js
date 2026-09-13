import { describe, it, expect, vi, afterEach } from "vitest";
import { berechneAlter, berechneGrundumsatz } from "./kalorien";

describe("berechneAlter", () => {
  afterEach(() => vi.useRealTimers());

  it("liefert null ohne Geburtsdatum", () => {
    expect(berechneAlter(null)).toBeNull();
  });

  it("berechnet das Alter korrekt, wenn der Geburtstag dieses Jahr schon war", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15)); // 15. Juni 2026
    expect(berechneAlter("2000-01-01")).toBe(26);
  });

  it("zieht ein Jahr ab, wenn der Geburtstag dieses Jahr noch nicht war", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // 15. Januar 2026
    expect(berechneAlter("2000-06-01")).toBe(25);
  });

  it("zählt den Geburtstag selbst schon als erreicht", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1)); // exakt am Geburtstag
    expect(berechneAlter("2000-06-01")).toBe(26);
  });
});

describe("berechneGrundumsatz", () => {
  afterEach(() => vi.useRealTimers());

  it("liefert null, wenn Pflichtangaben fehlen", () => {
    expect(berechneGrundumsatz({ geschlecht: "Männlich", geburtsdatum: null, groesse: 180, gewicht: 80 })).toBeNull();
    expect(berechneGrundumsatz({ geschlecht: "Männlich", geburtsdatum: "2000-01-01", groesse: null, gewicht: 80 })).toBeNull();
  });

  it("rechnet nach Mifflin-St-Jeor für Männer (+5)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    // Alter 26, Größe 180, Gewicht 80: 10*80 + 6.25*180 - 5*26 + 5 = 800+1125-130+5 = 1800
    expect(berechneGrundumsatz({ geschlecht: "Männlich", geburtsdatum: "2000-01-01", groesse: 180, gewicht: 80 })).toBe(1800);
  });

  it("rechnet nach Mifflin-St-Jeor für Frauen (-161)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    // 10*80 + 6.25*180 - 5*26 - 161 = 1925 - 130 - 161 = 1634
    expect(berechneGrundumsatz({ geschlecht: "Weiblich", geburtsdatum: "2000-01-01", groesse: 180, gewicht: 80 })).toBe(1634);
  });

  it("nutzt den Mittelwert (-78) für Divers/unbekannt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    expect(berechneGrundumsatz({ geschlecht: "Divers", geburtsdatum: "2000-01-01", groesse: 180, gewicht: 80 })).toBe(1717);
  });
});
