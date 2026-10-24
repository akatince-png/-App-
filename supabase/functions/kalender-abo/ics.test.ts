import { describe, expect, it } from "vitest";
import { ersterPassenderTag, falten, kalenderIcs, lokalZeit, textEscapen } from "./ics";

const basis = { heute: "2026-10-24", stempel: "20261024T180000Z" };

describe("Kalender-Abo (24.10.)", () => {
  it("baut einen gültigen Kalender mit Zeitzone", () => {
    const ics = kalenderIcs(basis);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("TZID:Europe/Berlin");
  });

  it("Routinen täglich, Abend bis 23:00", () => {
    const ics = kalenderIcs({ ...basis, routinen: [{ key: "abend", start: "21:38", ende: "23:00" }] });
    expect(ics).toContain("SUMMARY:🌙 Abendroutine");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20261017T213800");
    expect(ics).toContain("DTEND;TZID=Europe/Berlin:20261017T230000");
    expect(ics).toContain("RRULE:FREQ=DAILY");
  });

  it("Alltag einmalig und wöchentlich (Sonntag)", () => {
    const ics = kalenderIcs({
      ...basis,
      alltag: [
        { id: "k1", titel: "👨‍👧 Kinder abholen", datum: "2026-10-30", start: "16:30", ende: "17:00" },
        { id: "d1", titel: "💊 Dosetten stellen", wochentage: ["So"], start: "20:00", ende: "20:30" },
      ],
    });
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20261030T163000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=SU");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20261018T200000");
  });

  it("offene Aufgaben: geplant mit Uhrzeit, ohne Uhrzeit ganztags, nur Frist", () => {
    const ics = kalenderIcs({
      ...basis,
      aufgaben: [
        { id: "a1", titel: "Steuer", geplant_am: "2026-10-26", uhrzeit: "10:00", dauer_min: 45 },
        { id: "a2", titel: "Einkauf", geplant_am: "2026-10-27" },
        { id: "a3", titel: "Antrag", frist: "2026-11-02" },
      ],
    });
    expect(ics).toContain("DTEND;TZID=Europe/Berlin:20261026T104500");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261027");
    expect(ics).toContain("SUMMARY:⏰ Frist: Antrag");
  });

  it("Training wöchentlich am richtigen Tag", () => {
    const ics = kalenderIcs({ ...basis, training: [{ id: "t1", wochentag: "Mo", uhrzeit: "07:30", name: "HIIT" }] });
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20261019T073000");
  });

  it("Hilfsfunktionen: Escapen, Falten, über Mitternacht, Anker", () => {
    expect(textEscapen("a, b; c\nd")).toBe("a\\, b\\; c\\nd");
    const lang = "SUMMARY:" + "ä".repeat(60);
    const gefaltet = falten(lang);
    for (const zeile of gefaltet.split("\r\n")) expect(new TextEncoder().encode(zeile).length).toBeLessThanOrEqual(75);
    expect(gefaltet.split("\r\n").map((z, i) => (i ? z.slice(1) : z)).join("")).toBe(lang);
    expect(lokalZeit("2026-10-24", 24 * 60 + 30)).toBe("20261025T003000");
    expect(ersterPassenderTag("2026-10-17", ["So"])).toBe("2026-10-18");
  });
});
