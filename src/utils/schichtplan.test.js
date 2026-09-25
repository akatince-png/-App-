import { describe, expect, it } from "vitest";
import { einstellungenFuer, planErzeugen, planFuer, puenktlichkeitJeVariante, rollenZuordnung, schritteFuer } from "./schichtplan";
import { verspaetungsMuster, startZeitAufloeser, coachVerspaetungen, satzVomCoach } from "./routineVerspaetung";

const F = { id: "f", name: "Frühschicht", icon: "🌅", morgenStart: "04:30", abendStart: "21:00" };
const S = { id: "s", name: "Spätschicht", icon: "🌆", morgenStart: "09:30", abendStart: "23:45" };
const X = { id: "x", name: "Frei", icon: "🌿", morgenStart: "08:00", abendStart: "22:30" };
const standard = { morgen: { startZeit: "06:00", endZeit: "08:00" }, abend: { startZeit: "22:00", endZeit: "" } };
const ctx = {
  varianten: [F, S, X],
  standard,
  plan: {
    "2026-09-28": { datum: "2026-09-28", varianteId: "f", art: "variante" },
    "2026-09-29": { datum: "2026-09-29", varianteId: null, art: "krank" },
    "2026-09-30": { datum: "2026-09-30", varianteId: null, art: "eigen", morgenStart: "07:15", abendStart: "" },
  },
};

describe("planFuer + einstellungenFuer", () => {
  it("Variante, krank, eigene Zeit, ohne Eintrag normal", () => {
    expect(planFuer("2026-09-28", ctx)).toMatchObject({ art: "variante", label: "Frühschicht", morgen: "04:30", abend: "21:00", key: "f" });
    expect(planFuer("2026-09-29", ctx)).toMatchObject({ art: "krank", morgen: "", abend: "" });
    expect(planFuer("2026-09-30", ctx)).toMatchObject({ art: "eigen", morgen: "07:15", abend: "22:00" });
    expect(planFuer("2026-10-01", ctx)).toMatchObject({ art: "standard", morgen: "06:00" });
  });
  it("Ende des Zeitrahmens wandert mit", () => {
    expect(einstellungenFuer("2026-09-28", ctx).morgen).toEqual({ routine: "morgen", startZeit: "04:30", endZeit: "06:30" });
    expect(einstellungenFuer("2026-10-01", ctx).morgen).toEqual({ routine: "morgen", startZeit: "06:00", endZeit: "08:00" });
    expect(einstellungenFuer("2026-09-29", ctx).morgen.startZeit).toBe("");
  });
});

describe("schritteFuer", () => {
  it("Varianten-Schritte nur an passenden Tagen, 'ab Datum' erst ab dann", () => {
    const schritte = [{ id: 1 }, { id: 2, nurVarianten: ["f"] }, { id: 3, gueltigAb: "2026-10-12" }];
    expect(schritteFuer("2026-09-28", schritte, "f").map((s) => s.id)).toEqual([1, 2]);
    expect(schritteFuer("2026-09-28", schritte, "s").map((s) => s.id)).toEqual([1]);
    expect(schritteFuer("2026-10-12", schritte, null).map((s) => s.id)).toEqual([1, 3]);
  });
});

describe("planErzeugen", () => {
  const rollen = rollenZuordnung([F, S, X]);
  it("wochenweise: ab Montag der Startwoche, Mo–Fr Schicht, Wochenende frei, dann Wechsel", () => {
    const t = planErzeugen({ rhythmus: "wochenweise", start: "2026-09-30", wochen: 4, rollen });
    expect(t).toHaveLength(28);
    expect(t[0]).toEqual({ datum: "2026-09-28", varianteId: "f" });
    expect(t[5].varianteId).toBe("x");
    expect(t[7]).toEqual({ datum: "2026-10-05", varianteId: "s" });
    expect(t[14].varianteId).toBe("f");
  });
  it("2-2-2 und eigenes Muster wiederholen sich ab dem Starttag", () => {
    expect(planErzeugen({ rhythmus: "2-2-2", start: "2026-09-30", wochen: 1, rollen }).map((x) => x.varianteId)).toEqual(["f", "f", "s", "s", "x", "x", "f"]);
    expect(planErzeugen({ rhythmus: "eigen", start: "2026-09-30", wochen: 1, rollen, eigenesMuster: ["s", null] }).map((x) => x.varianteId)).toEqual(["s", null, "s", null, "s", null, "s"]);
  });
});

describe("Verspätung je Schicht", () => {
  const um = (iso, h, m) => { const [j, mo, t] = iso.split("-").map(Number); return new Date(j, mo - 1, t, h, m).toISOString(); };
  const plan = {};
  const tage = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25"];
  ["f", "f", "f", "s", "s"].forEach((v, i) => (plan[tage[i]] = { datum: tage[i], varianteId: v, art: "variante" }));
  const c = { varianten: [F, S, X], standard, plan };
  const laeufe = [
    { routine: "morgen", datum: "2026-09-21", gestartetUm: um("2026-09-21", 5, 45) },
    { routine: "morgen", datum: "2026-09-22", gestartetUm: um("2026-09-22", 5, 30) },
    { routine: "morgen", datum: "2026-09-23", gestartetUm: um("2026-09-23", 5, 40) },
    { routine: "morgen", datum: "2026-09-24", gestartetUm: um("2026-09-24", 9, 35) },
    { routine: "morgen", datum: "2026-09-25", gestartetUm: um("2026-09-25", 9, 30) },
  ];
  const heute = new Date(2026, 8, 25, 12);
  it("Spätschicht um 09:30 ist pünktlich, Frühschicht meist später → Muster nur für Frühschicht", () => {
    const m = verspaetungsMuster(laeufe, "morgen", startZeitAufloeser(c, "morgen"), heute);
    expect(m).toMatchObject({ labelLang: "Morgenroutine bei Frühschicht", startZeit: "04:30", spaetAnzahl: 3, vorschlag: "05:45" });
    expect(satzVomCoach(m, "Jonas")).toContain("deine Morgenroutine bei Frühschicht meist erst gegen 05:45 klappt statt um 04:30");
  });
  it("Pünktlichkeit je Schicht", () => {
    const p = puenktlichkeitJeVariante(laeufe, "morgen", c, heute, 28, 10);
    expect(p).toEqual([
      { key: "f", label: "Frühschicht", icon: "🌅", puenktlich: 0, gesamt: 3 },
      { key: "s", label: "Spätschicht", icon: "🌆", puenktlich: 2, gesamt: 2 },
    ]);
  });
  it("Coach-Übersicht nutzt den Schichtplan der Person", () => {
    const zeilen = [{ user_id: "j", routine: "morgen", start_zeit: "06:00:00" }, ...laeufe.map((l) => ({ user_id: "j", routine: "morgen", datum: l.datum, gestartet_um: l.gestartetUm }))];
    const varianten = [F, S].map((v) => ({ user_id: "j", id: v.id, name: v.name, icon: v.icon, morgen_start: v.morgenStart, abend_start: v.abendStart }));
    const planZeilen = Object.values(plan).map((t) => ({ user_id: "j", datum: t.datum, variante_id: t.varianteId, art: "variante" }));
    expect(coachVerspaetungen(zeilen, heute, { varianten, plan: planZeilen }).j.labelLang).toBe("Morgenroutine bei Frühschicht");
  });
});
