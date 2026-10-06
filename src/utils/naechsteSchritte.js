// „Als Nächstes“ (06.10., Nutzerin: „Wenn ‚Aufgeladen‘ steht, soll schon das
// nächste Actionfenster kommen – die nächste Tätigkeit aus dem Tagesplan,
// je nach Lebensbereich mit eigenem Bild und Fenster“). Reine Logik: welche
// offenen Punkte als Nächstes dran sind, in Tagesplan-Reihenfolge.

const ROUTINEN = ["morgenroutine", "abendroutine"];

const minuten = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

/** Offene Punkte (ohne Routinen) nach Uhrzeit; Punkte ohne Uhrzeit am Ende. */
export function naechsteSchritte(items = [], anzahl = 3) {
  return items
    .filter((i) => !i.done && !ROUTINEN.includes(i.kategorie))
    .map((i, idx) => ({ i, idx, min: minuten(i.uhrzeit) }))
    .sort((a, b) => (a.min ?? 9999) - (b.min ?? 9999) || a.idx - b.idx)
    .slice(0, anzahl)
    .map((x) => x.i);
}

/** „jetzt dran“, „um 9:30“ oder „heute“ – für die Ankündigung. */
export function zeitText(item, jetzt = new Date()) {
  const m = minuten(item?.uhrzeit);
  if (m === null) return "heute";
  const jetztMin = jetzt.getHours() * 60 + jetzt.getMinutes();
  return m <= jetztMin + 5 ? "jetzt dran" : `um ${item.uhrzeit.slice(0, 5)} Uhr`;
}
