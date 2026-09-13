import { addDays, parseLocalISODate } from "./dates";
import { INTERVALL_OPTIONEN } from "../constants";

export const WEEKDAY_INDEX = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };

const INTERVALL_LABEL_EN = {
  "Täglich": "Daily",
  "Jeden 2. Tag": "Every 2nd day",
  "2x pro Woche": "2x per week",
  "1x pro Woche": "1x per week",
};
const WEEKDAY_EN = { Mo: "Mon", Di: "Tue", Mi: "Wed", Do: "Thu", Fr: "Fri", Sa: "Sat", So: "Sun" };

/**
 * Menschlich lesbare Beschreibung eines Intervalls, unabhängig vom Modus.
 * `lang` kommt vom Aufrufer (aus useT()), da diese Funktion selbst kein Hook
 * ist und daher nicht direkt auf den Sprachkontext zugreifen kann.
 */
export function describeInterval(d, lang = "de") {
  if (!d) return "?";
  const en = lang === "en";
  if (d.intervallTyp === "custom") return en ? `Every ${d.customDays || "?"} days` : `Alle ${d.customDays || "?"} Tage`;
  if (d.intervallTyp === "cycle") {
    return en ? `${d.onDays || "?"} days on / ${d.offDays ?? "?"} days off` : `${d.onDays || "?"} Tage on / ${d.offDays ?? "?"} Tage off`;
  }
  if (d.intervallTyp === "weekdays") {
    if (!d.weekdays?.length) return en ? "Choose weekdays" : "Wochentage wählen";
    return en ? d.weekdays.map((w) => WEEKDAY_EN[w] || w).join(", ") : d.weekdays.join(", ");
  }
  const label = INTERVALL_OPTIONEN.find((o) => o.days === d.intervallDays)?.label;
  if (!label) return "?";
  return en ? INTERVALL_LABEL_EN[label] || label : label;
}

/**
 * Berechnet alle aktiven Kalendertage einer Dosierung innerhalb von totalDays
 * ab Startdatum, je nach Intervall-Typ (fixed/custom/cycle/weekdays).
 * Die Zeitpunkte pro Tag (uhrzeiten) werden separat vom Aufrufer aufgefächert.
 */
export function activeDoseDays(d, startdatum, totalDays) {
  const mode = d?.intervallTyp || "fixed";
  // Bug-Fix (13.09.): new Date("YYYY-MM-DD") parst als UTC-Mitternacht statt
  // lokaler Mitternacht — siehe parseLocalISODate() in utils/dates.js.
  const start = parseLocalISODate(d?.eigenerStart || startdatum);
  const dates = [];

  if (mode === "weekdays") {
    const wanted = new Set((d.weekdays || []).map((w) => WEEKDAY_INDEX[w]));
    for (let n = 0; n < totalDays; n++) {
      const date = addDays(start, n);
      if (wanted.has(date.getDay())) dates.push(date);
    }
    return dates;
  }

  if (mode === "cycle") {
    const on = Math.max(1, Number(d.onDays) || 1);
    const off = Math.max(0, Number(d.offDays) || 0);
    const cycle = on + off;
    for (let n = 0; n < totalDays; n++) {
      if (n % cycle < on) dates.push(addDays(start, n));
    }
    return dates;
  }

  const days = mode === "custom" ? Math.max(1, Number(d.customDays) || 7) : d.intervallDays || 7;
  for (let n = 0; n < totalDays; n += days) dates.push(addDays(start, n));
  return dates;
}

/**
 * Fällt dieser Eintrag an einem bestimmten Tag an? Gleiche Intervall-Logik
 * wie activeDoseDays, aber für eine einzelne Tagesabfrage statt einer
 * vorberechneten Liste — gedacht für Bereiche ohne eigenen Plan-Vorlauf
 * (z. B. Supplemente im Tagesplan).
 *
 * Ohne Startdatum gilt der Eintrag als dauerhaft aktiv, damit ein
 * unvollständig ausgefüllter Eintrag nicht stillschweigend aus dem
 * Tagesplan verschwindet.
 */
export function faelltAnTag(d, date, startdatum) {
  const mode = d?.intervallTyp || "fixed";
  const tag = new Date(date);
  tag.setHours(0, 0, 0, 0);

  if (mode === "weekdays") {
    const wanted = new Set((d?.weekdays || []).map((w) => WEEKDAY_INDEX[w]));
    return wanted.size === 0 || wanted.has(tag.getDay());
  }

  const startRaw = d?.eigenerStart || startdatum;
  if (!startRaw) return true;
  // Bug-Fix (13.09.): siehe activeDoseDays() oben / parseLocalISODate() in
  // utils/dates.js — startRaw ist ein "YYYY-MM-DD"-String, new Date(string)
  // parst den als UTC-Mitternacht statt lokaler Mitternacht.
  const start = parseLocalISODate(startRaw);
  if (tag < start) return false;

  const n = Math.round((tag - start) / 86400000);

  if (mode === "cycle") {
    const on = Math.max(1, Number(d.onDays) || 1);
    const off = Math.max(0, Number(d.offDays) || 0);
    return n % (on + off) < on;
  }

  const days = mode === "custom" ? Math.max(1, Number(d.customDays) || 1) : Math.max(1, Number(d?.intervallDays) || 1);
  return n % days === 0;
}

// Kanonische Spalten-Zuordnung für alle Dosierungsfelder, die in Supabase
// per Spaltennamen abweichen (camelCase im UI-State vs. snake_case in der
// DB) — Peptide (protocol_peptide) und Hormone/Medikamente (hormones)
// verwenden dieselben Spaltennamen für die Felder, die es in beiden
// Tabellen gibt; hormones hat zusätzlich die Cannabis-Detailspalten, die es
// bei protocol_peptide nicht gibt. Einmalig definiert (13.09., Teil 60),
// damit beide Tabellen nie mehr unabhängig voneinander auseinanderdriften
// können, wie es vor diesem Fix schon mehrfach passiert ist (siehe
// useProtocolData.js/useHormoneData.js Rollback-Fixes).
export const DOSE_SPALTEN_VOLLSTAENDIG = {
  menge: "menge",
  customDays: "custom_days",
  onDays: "on_days",
  offDays: "off_days",
  eigenerStart: "eigener_start",
  weekdays: "weekdays",
  uhrzeiten: "uhrzeiten",
  bacWasser: "bac_wasser_ml",
  spruehstoesse: "spruehstoesse",
  thcProzent: "cannabis_thc_prozent",
  cbdProzent: "cannabis_cbd_prozent",
  tabakMenge: "cannabis_tabak_menge",
  filterTyp: "cannabis_filter",
  temperaturGrad: "cannabis_temperatur_grad",
  tropfenAnzahl: "cannabis_tropfen",
};

export const DOSE_NUMERISCHE_FELDER_VOLLSTAENDIG = new Set([
  "customDays",
  "onDays",
  "offDays",
  "bacWasser",
  "spruehstoesse",
  "thcProzent",
  "cbdProzent",
  "temperaturGrad",
  "tropfenAnzahl",
]);

/** Reduziert die vollständige Spalten-Zuordnung auf eine Teilmenge von Feldern (z. B. für protocol_peptide, das keine Cannabis-Spalten hat). */
export function spaltenTeilmenge(felder) {
  const out = {};
  felder.forEach((f) => {
    if (f in DOSE_SPALTEN_VOLLSTAENDIG) out[f] = DOSE_SPALTEN_VOLLSTAENDIG[f];
  });
  return out;
}

/**
 * Wandelt einen rohen Formularwert für ein Dosierungsfeld in den Wert um,
 * der in der DB-Spalte landen soll — numerische Felder werden zu Number
 * (leer -> null), "eigenerStart" wird bei leerem String zu null, alles
 * andere bleibt unverändert. Gemeinsame Logik aus setDose()/setDoseBatch()
 * (Peptide) und setHormonDose()/setHormonDoseBatch() (Hormone/Medikamente),
 * die dort bisher viermal fast wortgleich vorkam.
 */
export function coerceDoseFeldWert(feld, val, numerischeFelder) {
  if (numerischeFelder.has(feld)) return val === "" ? null : Number(val);
  if (feld === "eigenerStart") return val === "" ? null : val;
  return val;
}

/**
 * Baut die sortierte Liste aller Dosis-Termine (Datum × Uhrzeit) für einen
 * Zeitraum aus einer Liste von Namen + der zugehörigen Dosierungs-Map —
 * gemeinsame Logik aus useProtocolData.plan und useHormoneData.hormonPlan,
 * die sich bisher nur durch die Form des Ausgabe-Objekts unterschieden
 * (peptid vs. name/einnahmeart). `zeileBauen(name, dosierung, date, uhrzeit)`
 * liefert das jeweilige Ausgabe-Objekt.
 */
export function buildDosePlan(namen, dosierungMap, startdatum, dauer, zeileBauen) {
  const totalDays = (parseInt(dauer, 10) || 12) * 7;
  const dosen = [];
  namen.forEach((name) => {
    const d = dosierungMap[name];
    if (!d) return;
    const dates = activeDoseDays(d, startdatum, totalDays);
    const zeiten = d.uhrzeiten?.length ? d.uhrzeiten : ["20:00"];
    dates.forEach((date) => {
      zeiten.forEach((uhrzeit) => {
        dosen.push(zeileBauen(name, d, date, uhrzeit));
      });
    });
  });
  dosen.sort((a, b) => a.date - b.date || a.uhrzeit.localeCompare(b.uhrzeit));
  return dosen;
}
