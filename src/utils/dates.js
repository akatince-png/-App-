export function fmtDate(d) {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}
export function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}
export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function keyOf(date, peptid, uhrzeit) {
  return uhrzeit ? `${date.toDateString()}__${peptid}__${uhrzeit}` : `${date.toDateString()}__${peptid}`;
}
export function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Vergleicht "jetzt" mit der geplanten Uhrzeit (z. B. "20:00") am selben Tag
// und liefert einen lesbaren Verspätungs-Text — oder null, wenn's pünktlich
// war (Toleranz: 5 Minuten). Grundlage fürs lückenlose Tagesprotokoll
// (Nutzerinnen-Vorgabe 28.07.: jede Verspätung soll dokumentiert werden).
export function verspaetungText(geplantUhrzeit, jetzt = new Date()) {
  if (!geplantUhrzeit) return null;
  const [h, m] = geplantUhrzeit.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const geplant = new Date(jetzt);
  geplant.setHours(h, m, 0, 0);
  const diffMin = Math.round((jetzt - geplant) / 60000);
  if (diffMin <= 5) return null;
  if (diffMin < 60) return `${diffMin} Min. später als geplant`;
  const stunden = Math.floor(diffMin / 60);
  const restMin = diffMin % 60;
  return `${stunden} Std.${restMin > 0 ? ` ${restMin} Min.` : ""} später als geplant`;
}
