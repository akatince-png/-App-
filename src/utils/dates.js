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
