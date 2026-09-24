import { describe, expect, it } from "vitest";
import { enddatumAus, questFortschritt, statusAufbereiten, tagImProtokoll, werHatHeute } from "./gruppenprotokoll";

const zeilen = [
  { user_id: "a", vorname: "Mia", profilbild_pfad: null, privat: false, baustein_id: "b1", datum: "2026-09-24" },
  { user_id: "a", vorname: "Mia", profilbild_pfad: null, privat: false, baustein_id: "b1", datum: "2026-09-23" },
  { user_id: "c", vorname: "Claude", profilbild_pfad: null, privat: false, baustein_id: "b1", datum: "2026-09-24" },
  { user_id: "c", vorname: "Claude", profilbild_pfad: null, privat: false, baustein_id: "b2", datum: "2026-09-24" },
  { user_id: "c", vorname: "Claude", profilbild_pfad: null, privat: false, baustein_id: null, datum: null },
  { user_id: "x", vorname: null, profilbild_pfad: null, privat: true, baustein_id: null, datum: null },
];

describe("gruppenprotokoll", () => {
  it("bereitet Mitglieder und Treffer auf", () => {
    const s = statusAufbereiten(zeilen);
    expect(s.mitglieder.map((m) => m.userId)).toEqual(["a", "c", "x"]);
    expect(s.erledigt.size).toBe(4);
    expect(werHatHeute(s, "b1", "2026-09-24").map((m) => m.vorname)).toEqual(["Mia", "Claude"]);
  });
  it("Quest-Fortschritt je Baustein und gesamt, mit eigenem Beitrag", () => {
    const s = statusAufbereiten(zeilen);
    expect(questFortschritt({ baustein_id: "b1", ziel_anzahl: 3 }, s, "a")).toEqual({ gesamt: 3, eigen: 2, ziel: 3, geschafft: true });
    expect(questFortschritt({ baustein_id: null, ziel_anzahl: 10 }, s, "c")).toEqual({ gesamt: 4, eigen: 2, ziel: 10, geschafft: false });
  });
  it("Enddatum und Tag im Protokoll", () => {
    expect(enddatumAus("2026-09-24", 21)).toBe("2026-10-14");
    expect(enddatumAus("2026-09-24", null)).toBe(null);
    expect(tagImProtokoll({ startdatum: "2026-09-24", enddatum: "2026-10-14" }, "2026-10-02")).toEqual({ tag: 9, gesamt: 21 });
  });
});
