import { sameDay, toLocalISODate } from "./dates";
import { faelltAnTag } from "./schedule";
import { uebungGewichtText, uebungWiederholungenText } from "../ui/UebungenEditor";

// getDay()-indexiert (0 = Sonntag), passend zu JS' Date#getDay().
const GETDAY_TO_LABEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Feste Tageszeiten bekommen eine repräsentative Stunde, damit sie sich
// sinnvoll neben exakten Uhrzeiten (Peptide/Medikamente) einsortieren.
export const TAGESZEIT_STUNDE = { Morgens: "08", Mittags: "13", Abends: "20" };

// Jeder Lebensbereich bekommt eine eigene, klar erkennbare Farbe statt
// überall derselben Marken-Akzentfarbe (Nutzerinnen-Vorgabe, 27.07.):
// Tageslicht = Gelb, Training = Rot, Medikamente = Lila, Hydration = Blau,
// Schlaf = Indigo (nachtnahes Dunkelblau, unterscheidbar von Medikamente-
// Lila), Supplemente = Gold, Ernährung = Terrakotta, Gewohnheiten = Teal.
// `dot` ist die kräftige Version (Icons, Ringe, Buttons), `bg`/`text` die
// helle Variante für Badges/Chips. Peptide sind seit der Datenzusammen-
// legung (13.08., Migration 0042) Teil von "hormon" (Medikamente) und
// haben keine eigene Kategorie mehr.
export const KATEGORIE_META = {
  hormon: { bg: "#F1E9F6", text: "#6B3F91", dot: "#8B5CB0", label: "Medikament" },
  supplement: { bg: "#F6EFE1", text: "#8C651F", dot: "#B8863D", label: "Supplement" },
  mahlzeit: { bg: "#F5E9E2", text: "#94502F", dot: "#C17A54", label: "Mahlzeit" },
  training: { bg: "#FBEAE7", text: "#A63B32", dot: "#CC5145", label: "Training" },
  gewohnheit: { bg: "#E6F3F2", text: "#286661", dot: "#3E8E8A", label: "Gewohnheit" },
  hydration: { bg: "#EAF3F8", text: "#2F6E8C", dot: "#4A93B8", label: "Hydration" },
  tageslicht: { bg: "#FDF3E3", text: "#8C6A1F", dot: "#D9A62E", label: "Tageslicht" },
  schlaf: { bg: "#ECEDF7", text: "#3F4380", dot: "#5B5FA6", label: "Schlaf" },
  notfallmodus: { bg: "#FBEAE7", text: "#A63B32", dot: "#C24545", label: "Notfallmodus" },
};

// Kurzbeschreibung der Übungen einer Wochenplan-Einheit (WochenplanEditor.jsx)
// — neue Einheiten haben je Übung eigene Sätze/Wiederholungen/Gewicht
// (uebungenListe, seit 13.08.), ältere, davor gespeicherte Einheiten nur
// einen Freitext + ein einzelnes Sätze/Wiederholungen-Paar für die ganze
// Einheit (uebungen/saetze/wiederholungen) — beide Formate bleiben lesbar.
export function wochenplanUebungenText(zuweisung) {
  if (zuweisung.uebungenListe?.length) {
    return zuweisung.uebungenListe
      .filter((u) => u.name)
      .map((u) => {
        const gewichtText = uebungGewichtText(u);
        return `${u.name} ${u.saetze || "?"}×${uebungWiederholungenText(u) || "?"}${gewichtText ? ` ${gewichtText}` : ""}`;
      })
      .join(", ");
  }
  if (zuweisung.uebungen) {
    return zuweisung.saetze && zuweisung.wiederholungen ? `${zuweisung.uebungen} (${zuweisung.saetze}×${zuweisung.wiederholungen})` : zuweisung.uebungen;
  }
  return "";
}

// Kompakte Zusammenfassung einer Trainingseinheit für Tagesplan-/Home-Zeilen
// (14.08., Nutzerin-Vorgabe: die volle Übungsliste als eine lange
// Kommaliste wirkte dort wie "wirrer Buchstabensalat") — nur Anzahl statt
// aller Namen/Sätze/Wiederholungen. Die volle Liste gibt's stattdessen als
// Tabelle in der antippbaren Trainings-Vorschau (siehe TrainingVorschau.jsx).
export function trainingKompaktDetail(t) {
  if (t.art === "Krafttraining" || (t.art === "Bodyweight" && (t.uebungen || t.uebungenListe || []).length > 0)) {
    const anzahl = (t.uebungen || t.uebungenListe || []).filter((u) => u.name).length;
    return anzahl ? `${anzahl} Übung${anzahl === 1 ? "" : "en"}` : "";
  }
  const teile = [];
  if (t.art === "Cardio" && t.cardioArt) teile.push(t.cardioArt);
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
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan = [],
    trainingEintraege = [],
    trainingWochenplan = [],
    gewohnheiten = [],
    gewohnheitErledigt = {},
  }
) {
  const tagStr = toLocalISODate(date);
  const items = [];

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

  // Supplemente kennen seit Migration 0029 dasselbe Intervall-/Uhrzeit-
  // Modell wie Medikamente und Peptide. Einträge mit konkreten Uhrzeiten
  // laufen darüber (inkl. Wochentag-/Zyklus-Prüfung); ältere Einträge ohne
  // Uhrzeiten fallen weiterhin auf die groben Tageszeiten zurück, damit sie
  // nicht aus dem Tagesplan verschwinden.
  supplemente.forEach((s) => {
    const uhrzeiten = s.uhrzeiten || [];
    if (uhrzeiten.length > 0) {
      if (!faelltAnTag(s, date, s.eigenerStart)) return;
      uhrzeiten.forEach((zeit) => {
        const k = `${tagStr}__${s.id}__${zeit}`;
        items.push({
          kategorie: "supplement",
          key: `s-${k}`,
          refId: s.id,
          hour: zeit.slice(0, 2),
          uhrzeit: zeit,
          name: s.name,
          detail: s.menge || s.hinweis,
          done: !!supplementErledigt[k],
          raw: s,
        });
      });
      return;
    }
    (s.tageszeiten || []).forEach((zeit) => {
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

  // Mahlzeiten erscheinen nur an den Wochentagen, denen sie im
  // Ernährungsplan tatsächlich zugewiesen wurden (meal_wochenplan) — nicht
  // mehr bedingungslos an jedem Tag. `meals.tageszeiten` dient nur noch als
  // Anzeige-Vorbelegung, nicht mehr als Quelle für "wann".
  {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    mealWochenplan
      .filter((w) => w.wochentag === wochentagLabel)
      .forEach((w) => {
        const m = mahlzeiten.find((mm) => mm.id === w.mealId);
        if (!m) return;
        const zeit = w.tageszeit || "Mahlzeit";
        const k = `${tagStr}__${m.id}__${zeit}`;
        items.push({
          kategorie: "mahlzeit",
          key: `m-${w.id}`,
          refId: m.id,
          hour: w.uhrzeit ? w.uhrzeit.slice(0, 2) : TAGESZEIT_STUNDE[zeit] || null,
          uhrzeit: w.uhrzeit || zeit,
          logZeit: zeit,
          name: m.name,
          detail: m.hinweis,
          done: !!mahlzeitErledigt[k],
          raw: m,
        });
      });
  }

  const heutigeTrainings = trainingEintraege.filter((t) => t.datum === tagStr);
  heutigeTrainings.forEach((t) => {
    items.push({
      kategorie: "training",
      key: `t-${t.id}`,
      refId: t.id,
      hour: t.uhrzeit ? t.uhrzeit.slice(0, 2) : null,
      uhrzeit: t.uhrzeit || "",
      name: t.name ? `${t.art} · ${t.name}` : t.art,
      detail: trainingKompaktDetail(t),
      done: !!t.erledigt,
      raw: t,
    });
  });

  // Noch kein echter Eintrag für heute? Dann zeigt der Wochenplan (falls für
  // diesen Wochentag etwas hinterlegt ist) je Einheit ein virtuelles, noch
  // nicht gespeichertes Training — wird erst beim Antippen zu einer echten
  // Zeile. Mehrere Einheiten am selben Tag zu unterschiedlichen Uhrzeiten
  // sind möglich (siehe WochenplanEditor).
  if (heutigeTrainings.length === 0) {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    trainingWochenplan
      .filter((w) => w.wochentag === wochentagLabel)
      .forEach((zuweisung) => {
        const uhrzeit = zuweisung.uhrzeit || "";
        const anzahlUebungen = (zuweisung.uebungenListe || []).filter((u) => u.name).length;
        const detailTeile = [
          anzahlUebungen ? `${anzahlUebungen} Übung${anzahlUebungen === 1 ? "" : "en"}` : "",
          zuweisung.warmup?.aktiv ? `Warm-up${zuweisung.warmup.dauerMin ? ` ${zuweisung.warmup.dauerMin} Min.` : ""}` : "",
          zuweisung.cooldown?.aktiv ? `Cool-down${zuweisung.cooldown.dauerMin ? ` ${zuweisung.cooldown.dauerMin} Min.` : ""}` : "",
        ].filter(Boolean);
        items.push({
          kategorie: "training",
          key: `t-virtual-${tagStr}-${zuweisung.id}`,
          refId: null,
          hour: uhrzeit ? uhrzeit.slice(0, 2) : null,
          uhrzeit,
          name: zuweisung.arten?.length ? zuweisung.arten.join(" + ") : "Training",
          detail: detailTeile.length ? detailTeile.join(" · ") : "Laut Wochenplan",
          done: false,
          raw: {
            virtuell: true,
            datum: tagStr,
            arten: zuweisung.arten,
            uhrzeit,
            uebungenListe: zuweisung.uebungenListe,
            warmup: zuweisung.warmup,
            cooldown: zuweisung.cooldown,
          },
        });
      });
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
