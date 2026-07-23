import { keyOf, sameDay, toLocalISODate } from "./dates";
import { accent, accentDark, accentSoft, blue } from "../ui/theme";

// getDay()-indexiert (0 = Sonntag), passend zu JS' Date#getDay().
const GETDAY_TO_LABEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

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
  training: { bg: "#F1EDF8", text: "#786198", dot: "#9B85B8", label: "Training" },
  gewohnheit: { bg: "#EAF3EA", text: "#3F6B46", dot: "#5E9468", label: "Gewohnheit" },
  hydration: { bg: "#EAF3F8", text: "#2F6E8C", dot: "#4A93B8", label: "Hydration" },
};

// Zusammenfassung einer Trainingseinheit für Tagesplan-/Home-/Verlauf-Zeilen —
// bei Krafttraining mit echten Übungsnamen + Sätzen×Wiederholungen statt nur
// einer Anzahl, damit auf einen Blick erkennbar ist, was konkret ansteht.
export function trainingDetail(t) {
  if (t.art === "Krafttraining") {
    return (t.uebungen || [])
      .filter((u) => u.name)
      .map((u) => `${u.name} ${u.saetze || "?"}×${u.wiederholungen || "?"}${u.gewicht ? ` ${u.gewicht}` : ""}`)
      .join(", ");
  }
  const teile = [];
  if (t.dauerMin) teile.push(`${t.dauerMin} min`);
  if (t.distanzKm) teile.push(`${t.distanzKm} km`);
  return teile.join(" · ");
}

// Baut die reine Datenliste eines Tages aus allen Trackern zusammen — ohne
// Bestätigen-Callbacks, damit Tagesplan und Startseite dieselbe Grundlage
// nutzen können, aber jeweils ihr eigenes Bestätigen-Verhalten anhängen.
export function buildDayItems(
  date,
  {
    plan,
    erledigt,
    dosierung,
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    trainingEintraege = [],
    trainingWochenplan = [],
    trainingTemplates = [],
    gewohnheiten = [],
    gewohnheitErledigt = {},
  }
) {
  const tagStr = toLocalISODate(date);
  const items = [];

  plan
    .filter((d) => sameDay(d.date, date))
    .forEach((d) => {
      const k = keyOf(d.date, d.peptid, d.uhrzeit);
      items.push({
        kategorie: "peptid",
        key: `p-${k}`,
        refId: dosierung?.[d.peptid]?.id ?? null,
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
        refId: hormonDosierung?.[d.name]?.id ?? null,
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
        refId: s.id,
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
        refId: m.id,
        hour: TAGESZEIT_STUNDE[zeit] || null,
        uhrzeit: zeit,
        name: m.name,
        detail: m.hinweis,
        done: !!mahlzeitErledigt[k],
        raw: m,
      });
    });
  });

  const heutigeTrainings = trainingEintraege.filter((t) => t.datum === tagStr);
  heutigeTrainings.forEach((t) => {
    items.push({
      kategorie: "training",
      key: `t-${t.id}`,
      refId: t.id,
      hour: t.uhrzeit ? t.uhrzeit.slice(0, 2) : null,
      uhrzeit: t.uhrzeit || "",
      name: t.name ? `${t.art} · ${t.name}` : t.art,
      detail: trainingDetail(t),
      done: !!t.erledigt,
      raw: t,
    });
  });

  // Noch kein echter Eintrag für heute? Dann zeigt der Wochenplan (falls für
  // diesen Wochentag etwas hinterlegt ist) ein virtuelles, noch nicht
  // gespeichertes Training — wird erst beim Antippen zu einer echten Zeile.
  if (heutigeTrainings.length === 0) {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    const zuweisung = trainingWochenplan.find((w) => w.wochentag === wochentagLabel);
    if (zuweisung) {
      const template = trainingTemplates.find((tpl) => tpl.id === zuweisung.templateId) || null;
      const uhrzeit = zuweisung.uhrzeit || template?.uhrzeit || "";
      items.push({
        kategorie: "training",
        key: `t-virtual-${tagStr}`,
        refId: null,
        hour: uhrzeit ? uhrzeit.slice(0, 2) : null,
        uhrzeit,
        name: template ? `${zuweisung.art} · ${template.name}` : zuweisung.art,
        detail: template ? trainingDetail(template) : "Laut Wochenplan",
        done: false,
        raw: { virtuell: true, datum: tagStr, art: zuweisung.art, template, uhrzeit },
      });
    }
  }

  gewohnheiten.forEach((g) => {
    const k = `${tagStr}__${g.id}`;
    items.push({
      kategorie: "gewohnheit",
      key: `g-${k}`,
      refId: g.id,
      hour: g.uhrzeit ? g.uhrzeit.slice(0, 2) : null,
      uhrzeit: g.uhrzeit || "",
      name: g.name,
      detail: "",
      done: !!gewohnheitErledigt[k],
      raw: g,
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
