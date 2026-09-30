// Ereignisse (30.09., Nutzerin: „all diese Sachen müssen zu den geschehenen
// Uhrzeiten in die Wochenpläne eingearbeitet werden, als Ereignisse, und
// dokumentiert werden“): was ungeplant passiert ist – Getränk, Snack/Essen,
// Nickerchen, zusätzliche Einnahme – als Block mit Uhrzeit für Kalender,
// Wochenansicht und Startseite. Geplante Punkte kommen weiter aus dem Plan.

const minuten = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const kurz = (t, n = 28) =>
  t && t.length > n ? `${t.slice(0, n - 1)}…` : t || "";

export function ereignisseAmTag(
  tagStr,
  { spontanEintraege = [], essenEintraege = [] } = {},
) {
  const liste = [];
  for (const e of spontanEintraege) {
    if (e.datum !== tagStr) continue;
    const start = minuten(e.uhrzeit);
    if (start == null) continue;
    if (e.art === "nickerchen")
      liste.push({
        key: `s-${e.id}`,
        start,
        ende: start + Math.max(10, e.dauerMin || 20),
        titel: `Nickerchen${e.dauerMin ? ` ${e.dauerMin} Min.` : ""}`,
        kategorie: "schlaf",
        symbol: "nickerchen",
      });
    else if (e.art === "einnahme")
      liste.push({
        key: `s-${e.id}`,
        start,
        ende: start + 10,
        titel: e.name || "Einnahme",
        kategorie: "supplement",
        symbol: "einnahme",
      });
    else if (e.art === "getraenk")
      liste.push({
        key: `s-${e.id}`,
        start,
        ende: start + 10,
        titel: `${e.mengeMl ? `${e.mengeMl} ml ` : ""}${e.name || "Getränk"}`,
        kategorie: "hydration",
        symbol: "trinken",
      });
  }
  for (const e of essenEintraege) {
    if (e.datum !== tagStr) continue;
    const start = minuten(e.uhrzeit);
    if (start == null) continue;
    const kcal = Number(e.werte?.kcal);
    liste.push({
      key: `e-${e.id}`,
      start,
      ende: start + 15,
      titel: `${kurz(e.text)}${kcal > 0 ? ` · ${Math.round(kcal)} kcal` : ""}`,
      kategorie: "mahlzeit",
      symbol: "snack",
    });
  }
  return liste.sort((a, b) => a.start - b.start);
}

// Beginn eines Nickerchens: entweder „von“ direkt, oder jetzt minus Dauer.
export function nickerchenBeginn(jetzt, dauerMin) {
  const d = new Date(jetzt.getTime() - dauerMin * 60000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Dauer aus „von“ und „bis“ (auch über Mitternacht), in Minuten.
export function dauerAusVonBis(von, bis) {
  const a = minuten(von);
  const b = minuten(bis);
  if (a == null || b == null) return null;
  const d = (b - a + 1440) % 1440;
  return d > 0 ? d : null;
}
