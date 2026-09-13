import { describe, it, expect, vi, afterEach } from "vitest";
import {
  berechneErrungenschaften,
  badgeLabel,
  badgeBeschreibung,
  ordenFuerWidgetKategorie,
  alleBadges,
  KATEGORIEN,
  STREAK_SCHWELLEN,
} from "./errungenschaften";

describe("berechneErrungenschaften", () => {
  afterEach(() => vi.useRealTimers());

  it("liefert 0 Punkte/Streaks für leere Quellen", () => {
    const ergebnis = berechneErrungenschaften({});
    expect(ergebnis.gesamtPunkte).toBe(0);
    expect(ergebnis.globalerStreak).toBe(0);
    expect(ergebnis.erreichteBadgeKeys.size).toBe(0);
    expect(ergebnis.kategorien).toHaveLength(KATEGORIEN.length);
  });

  it("zählt erledigte Supplement-Einträge als Punkte in der richtigen Kategorie", () => {
    const quellen = {
      supplementErledigt: {
        "2026-01-10__vitD": true,
        "2026-01-11__vitD": true,
        "2026-01-11__magnesium": false, // false zählt nicht mit
      },
    };
    const ergebnis = berechneErrungenschaften(quellen);
    expect(ergebnis.gesamtPunkte).toBe(2);
    const supplemente = ergebnis.kategorien.find((k) => k.key === "supplemente");
    expect(supplemente.punkte).toBe(2);
  });

  it("erreicht den ersten Streak-Meilenstein (7 Tage) korrekt, einen Tag davor noch nicht", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 20, 12, 0));
    const map = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 0, 20 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}__x`;
      map[key] = true;
    }
    const mit7 = berechneErrungenschaften({ supplementErledigt: map });
    expect(mit7.erreichteBadgeKeys.has("supplemente_streak_7")).toBe(true);
    expect(mit7.erreichteBadgeKeys.has("global_streak_7")).toBe(true);

    delete map["2026-01-14__x"];
    const mit6 = berechneErrungenschaften({ supplementErledigt: map });
    expect(mit6.erreichteBadgeKeys.has("supplemente_streak_7")).toBe(false);
  });

  it("vergibt Punkte-Meilensteine global über alle Kategorien addiert", () => {
    const map = {};
    for (let i = 0; i < 50; i++) map[`2026-01-${String((i % 28) + 1).padStart(2, "0")}__${i}__x`] = true;
    const ergebnis = berechneErrungenschaften({ supplementErledigt: map });
    expect(ergebnis.gesamtPunkte).toBe(50);
    expect(ergebnis.erreichteBadgeKeys.has("global_punkte_50")).toBe(true);
    expect(ergebnis.erreichteBadgeKeys.has("global_punkte_100")).toBe(false);
  });
});

describe("badgeLabel / badgeBeschreibung", () => {
  it("beschriftet globale Streak-/Punkte-Abzeichen", () => {
    expect(badgeLabel("global_streak_28")).toBe("28 Tage am Stück (gesamt)");
    expect(badgeLabel("global_punkte_500")).toBe("500 Punkte (gesamt)");
    expect(badgeBeschreibung("global_streak_28")).toContain("28 Tage in Folge");
    expect(badgeBeschreibung("global_punkte_500")).toContain("500 Punkte");
  });

  it("beschriftet kategoriespezifische Streak-Abzeichen mit dem Kategorie-Label", () => {
    expect(badgeLabel("training_streak_14")).toBe("14 Tage am Stück — Training");
    expect(badgeBeschreibung("training_streak_14")).toContain('"Training"');
  });

  it("liefert den rohen Key zurück, falls unbekannt", () => {
    expect(badgeLabel("irgendwas_unbekanntes")).toBe("irgendwas_unbekanntes");
    expect(badgeBeschreibung("irgendwas_unbekanntes")).toBe("");
  });
});

describe("ordenFuerWidgetKategorie", () => {
  const kategorien = KATEGORIEN.map((k) => ({ key: k.key, label: k.label, icon: k.icon, grad: k.grad, streak: 10 }));

  it("liefert null für Widget-Kategorien ohne Orden-Teilnahme", () => {
    expect(ordenFuerWidgetKategorie("unbekannt", kategorien, {})).toBeNull();
  });

  it("zeigt 'noch nicht freigeschaltet' mit dem ersten Meilenstein, wenn nichts verdient ist", () => {
    const ergebnis = ordenFuerWidgetKategorie("training", kategorien, {});
    expect(ergebnis.freigeschaltet).toBe(false);
    expect(ergebnis.schwelle).toBe(STREAK_SCHWELLEN[0]);
  });

  it("zeigt den höchsten erreichten Meilenstein, wenn freigeschaltet", () => {
    const verdiente = { training_streak_7: true, training_streak_14: true };
    const ergebnis = ordenFuerWidgetKategorie("training", kategorien, verdiente);
    expect(ergebnis.freigeschaltet).toBe(true);
    expect(ergebnis.schwelle).toBe(14);
  });
});

describe("alleBadges", () => {
  it("enthält für jede Kategorie alle Streak-Schwellen plus die globalen Abzeichen", () => {
    const badges = alleBadges();
    const erwartet = KATEGORIEN.length * STREAK_SCHWELLEN.length + STREAK_SCHWELLEN.length /* global streak */ + 6; /* Punkte-Schwellen */
    expect(badges).toHaveLength(erwartet);
    expect(badges.every((b) => b.key)).toBe(true);
  });
});
