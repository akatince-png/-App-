import { describe, expect, it } from "vitest";
import { coacheeStatus, coacheesSortiert, letzteSiebenTage, uebersichtZahlen } from "./coachAufmerksamkeit";

const heute = new Date(2026, 8, 24, 15);
const basis = { onboarding_complete: true, is_admin: false, ungelesene_nachrichten: 0, punkte_7_tage: 0 };

describe("coacheeStatus", () => {
  it("heute/gestern aktiv = grün, ab 2 Tagen ruhig = rot, nie aktiv = rot", () => {
    expect(coacheeStatus({ ...basis, letzte_aktivitaet: "2026-09-24" }, heute)).toMatchObject({ ampel: "gruen", text: "heute aktiv", brauchtDich: false });
    expect(coacheeStatus({ ...basis, letzte_aktivitaet: "2026-09-23" }, heute)).toMatchObject({ ampel: "gruen", text: "gestern aktiv" });
    expect(coacheeStatus({ ...basis, letzte_aktivitaet: "2026-09-21" }, heute)).toMatchObject({ ampel: "rot", text: "seit 3 Tagen ruhig", brauchtDich: true });
    expect(coacheeStatus({ ...basis, letzte_aktivitaet: null }, heute)).toMatchObject({ ampel: "rot", text: "noch nicht aktiv", brauchtDich: true });
  });
  it("Onboarding offen = gelb; ungelesene Nachricht braucht dich auch bei grün", () => {
    expect(coacheeStatus({ ...basis, onboarding_complete: false, erstellt_am: "2026-09-22T10:00:00Z" }, heute)).toMatchObject({ ampel: "gelb", zusatz: "seit 2 Tagen", brauchtDich: true });
    expect(coacheeStatus({ ...basis, letzte_aktivitaet: "2026-09-24", ungelesene_nachrichten: 1 }, heute)).toMatchObject({ ampel: "gruen", brauchtDich: true });
  });
});

describe("coacheesSortiert + uebersichtZahlen", () => {
  it("Admins raus, wer dich braucht zuerst (ungelesen, dann am längsten ruhig), Rest nach Punkten", () => {
    const liste = coacheesSortiert(
      [
        { ...basis, vorname: "Mia", letzte_aktivitaet: "2026-09-24", punkte_7_tage: 41 },
        { ...basis, vorname: "Admin", is_admin: true },
        { ...basis, vorname: "Jonas", letzte_aktivitaet: "2026-09-21" },
        { ...basis, vorname: "Lea", letzte_aktivitaet: "2026-09-24", ungelesene_nachrichten: 2, punkte_7_tage: 30 },
        { ...basis, vorname: "Tom", letzte_aktivitaet: null },
        { ...basis, vorname: "Claude", letzte_aktivitaet: "2026-09-23", punkte_7_tage: 50 },
      ],
      heute
    );
    expect(liste.map((p) => p.vorname)).toEqual(["Lea", "Tom", "Jonas", "Claude", "Mia"]);
    expect(uebersichtZahlen(liste)).toEqual({ brauchenDich: 3, neueNachrichten: 2, laufenGut: 2 });
  });
});

describe("letzteSiebenTage", () => {
  it("7 Tage, älteste zuerst, aktive markiert", () => {
    const t = letzteSiebenTage(["2026-09-24", "2026-09-20"], heute);
    expect(t).toHaveLength(7);
    expect(t[0].iso).toBe("2026-09-18");
    expect(t[6]).toMatchObject({ iso: "2026-09-24", aktiv: true });
    expect(t.filter((x) => x.aktiv).map((x) => x.iso)).toEqual(["2026-09-20", "2026-09-24"]);
  });
});
