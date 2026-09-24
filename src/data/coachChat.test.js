import { describe, expect, it } from "vitest";
import { chatListe, chatTagLabel, chatZeitKurz, nachTagenGruppieren } from "./coachChat";

describe("Chat-Tagestrenner", () => {
  const heute = new Date(2026, 8, 24, 15);
  it("Heute, Gestern, sonst Wochentag + Datum", () => {
    expect(chatTagLabel(new Date(2026, 8, 24, 8).toISOString(), heute)).toBe("Heute");
    expect(chatTagLabel(new Date(2026, 8, 23, 20).toISOString(), heute)).toBe("Gestern");
    expect(chatTagLabel(new Date(2026, 8, 21, 9).toISOString(), heute)).toMatch(/21\.09\./);
  });
  it("gruppiert aufeinanderfolgende Nachrichten desselben Tages", () => {
    const n = (d, h) => ({ id: `${d}-${h}`, erstelltAm: new Date(2026, 8, d, h).toISOString() });
    const g = nachTagenGruppieren([n(23, 18), n(24, 8), n(24, 9)], heute);
    expect(g.map((x) => [x.label, x.nachrichten.length])).toEqual([
      ["Gestern", 1],
      ["Heute", 2],
    ]);
  });
});

describe("chatListe + chatZeitKurz", () => {
  const heute = new Date(2026, 8, 24, 15);
  const z = (user_id, text, absender, d, h, gelesen = true) => ({ id: `${user_id}${d}${h}`, user_id, text, absender, gelesen, erstellt_am: new Date(2026, 8, d, h).toISOString() });
  it("letzte Nachricht je Person, ungelesene eingehende gezählt, neueste Unterhaltung zuerst, ohne Admins", () => {
    const liste = chatListe(
      [
        { id: "j", vorname: "Jonas", is_admin: false },
        { id: "m", vorname: "Mia", is_admin: false },
        { id: "a", vorname: "Admin", is_admin: true },
        { id: "l", vorname: "Lea", is_admin: false },
      ],
      [z("j", "Hi", "coach", 23, 18), z("j", "Danke!", "coachee", 24, 9, false), z("m", "Alles gut?", "coach", 24, 12), z("a", "x", "coach", 24, 14)]
    );
    expect(liste.map((e) => e.proband.vorname)).toEqual(["Mia", "Jonas"]);
    expect(liste[1]).toMatchObject({ ungelesen: 1, letzte: { text: "Danke!" } });
  });
  it("Uhrzeit heute, sonst Gestern / Wochentag / Datum", () => {
    expect(chatZeitKurz(new Date(2026, 8, 24, 9, 5).toISOString(), heute)).toBe("09:05");
    expect(chatZeitKurz(new Date(2026, 8, 23, 9).toISOString(), heute)).toBe("Gestern");
    expect(chatZeitKurz(new Date(2026, 8, 21, 9).toISOString(), heute)).toMatch(/^Mo/);
    expect(chatZeitKurz(new Date(2026, 8, 1, 9).toISOString(), heute)).toBe("01.09.");
  });
});
