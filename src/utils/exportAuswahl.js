import { toLocalISODate } from "./dates";
import { alltagAmTag, bereichMeta } from "./kalender";

// Auswahl für Druck/PDF der Wochenübersicht (28.09., Nutzerin): Gesundheit
// und Alltag trennen können, einzelne Bereiche rausnehmen, vorher in einer
// Vorschau kontrollieren. Nichts wird geschwärzt – was nicht gewählt ist,
// landet gar nicht erst im Dokument.

export const EXPORT_BEREICHE = [
  { key: "medikation", label: "Medikation", icon: "💊", gruppe: "gesundheit", kategorien: ["hormon", "peptid"] },
  { key: "supplemente", label: "Supplemente", icon: "🟡", gruppe: "gesundheit", kategorien: ["supplement"] },
  { key: "training", label: "Training & Bewegung", icon: "🏋️", gruppe: "gesundheit", kategorien: ["training", "workflow"] },
  { key: "ernaehrung", label: "Ernährung", icon: "🍽️", gruppe: "gesundheit", kategorien: ["mahlzeit"] },
  { key: "wasser", label: "Wasser", icon: "💧", gruppe: "gesundheit", kategorien: ["hydration"] },
  { key: "tageslicht", label: "Tageslicht", icon: "☀️", gruppe: "gesundheit", kategorien: ["tageslicht"] },
  { key: "schlaf", label: "Schlaf", icon: "🌙", gruppe: "gesundheit", kategorien: ["schlaf"] },
  { key: "routinen", label: "Morgen- & Abendroutine", icon: "🌅", gruppe: "gesundheit", kategorien: ["morgenroutine", "abendroutine"] },
  { key: "gewohnheiten", label: "Gewohnheiten", icon: "🎯", gruppe: "gesundheit", kategorien: ["gewohnheit"] },
  { key: "bildschirm", label: "Bildschirmzeit", icon: "📱", gruppe: "gesundheit", kategorien: ["bildschirmzeit"] },
  { key: "arbeit", label: "Arbeit", icon: "💼", gruppe: "alltag", kategorien: ["alltag:arbeit"] },
  { key: "haushalt", label: "Haushalt", icon: "🧹", gruppe: "alltag", kategorien: ["alltag:haushalt"] },
  { key: "hobby", label: "Hobby", icon: "🎨", gruppe: "alltag", kategorien: ["alltag:hobby"] },
  { key: "metime", label: "Me-Time", icon: "🛁", gruppe: "alltag", kategorien: ["alltag:metime"] },
  { key: "termine", label: "Termine", icon: "📅", gruppe: "alltag", kategorien: ["alltag:termin"] },
  { key: "sozial", label: "Freunde & Familie", icon: "👥", gruppe: "alltag", kategorien: ["alltag:sozial"] },
  { key: "eigene", label: "Eigene Bereiche", icon: "⭐", gruppe: "alltag", kategorien: ["alltag:eigen"] },
  { key: "projekte", label: "Projekte & Zeitblöcke", icon: "📁", gruppe: "alltag", kategorien: ["zeitblock"] },
];

export const EXPORT_TEILE = [
  { key: "wochenraster", label: "Wochenplan (Mo–So)" },
  { key: "dosierung", label: "Dosierintervalle" },
  { key: "fortschritt", label: "Fortschritt je Bereich" },
  { key: "wochenverlauf", label: "Wochenverlauf (Diagramme)" },
  { key: "aenderungen", label: "Änderungen im Zeitraum" },
];

const alleBereiche = EXPORT_BEREICHE.map((b) => b.key);
export const VORLAGEN = {
  gesundheit: { label: "🩺 Nur Gesundheit", bereiche: EXPORT_BEREICHE.filter((b) => b.gruppe === "gesundheit").map((b) => b.key), teile: EXPORT_TEILE.map((t) => t.key) },
  komplett: { label: "🗓️ Kompletter Wochenplan", bereiche: alleBereiche, teile: EXPORT_TEILE.map((t) => t.key) },
};

export const standardAuswahl = () => ({ bereiche: new Set(VORLAGEN.gesundheit.bereiche), teile: new Set(VORLAGEN.gesundheit.teile) });

const KATEGORIE_ZU_BEREICH = Object.fromEntries(EXPORT_BEREICHE.flatMap((b) => b.kategorien.map((k) => [k, b.key])));
export const bereichVonKategorie = (kategorie) => KATEGORIE_ZU_BEREICH[kategorie] || null;

// Gehört ein Eintrag (dayItem oder Änderung) zur Auswahl? Unbekannte
// Kategorien bleiben draußen – lieber zu wenig als etwas Privates.
export const imExport = (kategorie, auswahl) => {
  const b = bereichVonKategorie(kategorie);
  return !!b && auswahl.bereiche.has(b);
};

// Kalender-Einträge eines Tages als Tagesplan-Zeilen (für Wochenplan & Druck).
export function alltagItems(date, eintraege = [], eigeneBereiche = [], erledigt = {}) {
  const tag = toLocalISODate(date);
  return eintraege
    .filter((e) => alltagAmTag(e, date))
    .map((e) => {
      const meta = bereichMeta(e, eigeneBereiche);
      return {
        kategorie: `alltag:${e.bereichId ? "eigen" : e.bereich}`,
        key: `alltag-${e.id}`,
        hour: e.start.slice(0, 2),
        uhrzeit: e.start,
        name: `${meta.icon} ${e.titel}`,
        detail: [e.ende ? `bis ${e.ende} Uhr` : "", meta.label].filter(Boolean).join(" · "),
        done: !!erledigt[`${e.id}|${tag}`],
        farbe: meta.dot,
        raw: e,
      };
    });
}
