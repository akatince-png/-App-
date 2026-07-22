import { keyOf, sameDay, toLocalISODate } from "./dates";
import { accent, accentDark, accentSoft, blue } from "../ui/theme";

// Feste Tageszeiten bekommen eine repräsentative Stunde, damit sie sich
// sinnvoll neben exakten Uhrzeiten (Peptide/Medikamente) einsortieren.
export const TAGESZEIT_STUNDE = { Morgens: "08", Mittags: "13", Abends: "20" };

// Eine kleine, harmonische Farbfamilie statt eines Regenbogens: zwei kühle
// Töne (Peptide/Medikamente) und zwei warme (Supplemente/Mahlzeiten) — so
// bleibt jede Kategorie auf einen Blick unterscheidbar, ohne unruhig zu wirken.
export const KATEGORIE_META = {
  peptid: { bg: accentSoft, text: accentDark, dot: accent, label: "Peptid" },
  hormon: { bg: "#EAF0F8", text: "#3A5A87", dot: blue, label: "Medikament" },
  supplement: { bg: "#F6EFE1", text: "#8C651F", dot: "#B8863D", label: "Supplement" },
  mahlzeit: { bg: "#F5E9E2", text: "#94502F", dot: "#C17A54", label: "Mahlzeit" },
};

// Baut die reine Datenliste eines Tages aus allen Trackern zusammen — ohne
// Bestätigen-Callbacks, damit Tagesplan und Startseite dieselbe Grundlage
// nutzen können, aber jeweils ihr eigenes Bestätigen-Verhalten anhängen.
export function buildDayItems(date, { plan, erledigt, hormonPlan, hormonErledigt, supplemente, supplementErledigt, mahlzeiten, mahlzeitErledigt }) {
  const tagStr = toLocalISODate(date);
  const items = [];

  plan
    .filter((d) => sameDay(d.date, date))
    .forEach((d) => {
      const k = keyOf(d.date, d.peptid, d.uhrzeit);
      items.push({
        kategorie: "peptid",
        key: `p-${k}`,
        hour: d.uhrzeit.slice(0, 2),
        uhrzeit: d.uhrzeit,
        name: d.peptid,
        detail: d.menge,
        done: !!erledigt[k],
        raw: d,
      });
    });

  hormonPlan
    .filter((d) => sameDay(d.date, date))
    .forEach((d) => {
      const k = `${tagStr}__${d.name}__${d.uhrzeit}`;
      items.push({
        kategorie: "hormon",
        key: `h-${k}`,
        hour: d.uhrzeit.slice(0, 2),
        uhrzeit: d.uhrzeit,
        name: d.name,
        detail: d.menge,
        done: !!hormonErledigt[k],
        raw: d,
      });
    });

  supplemente.forEach((s) => {
    s.tageszeiten.forEach((zeit) => {
      const k = `${tagStr}__${s.id}__${zeit}`;
      items.push({
        kategorie: "supplement",
        key: `s-${k}`,
        hour: TAGESZEIT_STUNDE[zeit] || null,
        uhrzeit: zeit,
        name: s.name,
        detail: s.hinweis,
        done: !!supplementErledigt[k],
        raw: s,
      });
    });
  });

  mahlzeiten.forEach((m) => {
    m.tageszeiten.forEach((zeit) => {
      const k = `${tagStr}__${m.id}__${zeit}`;
      items.push({
        kategorie: "mahlzeit",
        key: `m-${k}`,
        hour: TAGESZEIT_STUNDE[zeit] || null,
        uhrzeit: zeit,
        name: m.name,
        detail: m.hinweis,
        done: !!mahlzeitErledigt[k],
        raw: m,
      });
    });
  });

  items.sort((a, b) => {
    const ha = a.hour ?? "99";
    const hb = b.hour ?? "99";
    if (ha !== hb) return ha.localeCompare(hb);
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });
  return items;
}
