// Wann eine Matrix-Aufgabe erinnert wird (24.10., Migration 0132). Reine
// Logik, damit sie mit vitest geprüft werden kann (matrix.test.ts).
export type MatrixAufgabe = { geplant_am?: string | null; frist?: string | null; uhrzeit?: string | null; erinnerung?: string | null; erledigt_am?: string | null };

export const MORGENS = "08:00";

const minuten = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const alsZeit = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Erinnerungszeit „HH:MM“ am Tag `heute`, oder null.
export function erinnerungsZeit(a: MatrixAufgabe, heute: string): string | null {
  if (!a.erinnerung || a.erledigt_am) return null;
  const tag = a.geplant_am || a.frist || null;
  if (tag !== heute) return null;
  if (a.erinnerung === "morgens") return MORGENS;
  const uhrzeit = String(a.uhrzeit || "").slice(0, 5);
  if (!a.geplant_am || !uhrzeit) return null;
  const vorher = a.erinnerung === "15" ? 15 : a.erinnerung === "60" ? 60 : 0;
  const ziel = minuten(uhrzeit) - vorher;
  return ziel < 0 ? null : alsZeit(ziel);
}

export function matrixText(a: MatrixAufgabe & { titel?: string | null }): string {
  const uhrzeit = String(a.uhrzeit || "").slice(0, 5);
  const wann = a.erinnerung === "15" ? " in 15 Min." : a.erinnerung === "60" ? " in 1 Std." : "";
  return `${a.titel || "Aufgabe"}${uhrzeit ? ` · ${uhrzeit} Uhr` : ""}${wann}`;
}
