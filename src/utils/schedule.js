import { addDays } from "./dates";
import { INTERVALL_OPTIONEN } from "../constants";

const WEEKDAY_INDEX = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };

/** Menschlich lesbare Beschreibung eines Intervalls, unabhängig vom Modus. */
export function describeInterval(d) {
  if (!d) return "?";
  if (d.intervallTyp === "custom") return `Alle ${d.customDays || "?"} Tage`;
  if (d.intervallTyp === "cycle") return `${d.onDays || "?"} Tage on / ${d.offDays ?? "?"} Tage off`;
  if (d.intervallTyp === "weekdays") return d.weekdays?.length ? d.weekdays.join(", ") : "Wochentage wählen";
  return INTERVALL_OPTIONEN.find((o) => o.days === d.intervallDays)?.label || "?";
}

/**
 * Berechnet alle aktiven Kalendertage einer Dosierung innerhalb von totalDays
 * ab Startdatum, je nach Intervall-Typ (fixed/custom/cycle/weekdays).
 * Die Zeitpunkte pro Tag (uhrzeiten) werden separat vom Aufrufer aufgefächert.
 */
export function activeDoseDays(d, startdatum, totalDays) {
  const mode = d?.intervallTyp || "fixed";
  const start = new Date(d?.eigenerStart || startdatum);
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
