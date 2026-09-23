// Automatische Tages-Quests (UX-Ausbau 23.09.): die vom Coach vergebenen
// Quests (Tabelle `quests`) erreichen nur Coachees — diese hier entstehen
// für JEDE Person automatisch aus ihrem eigenen Tag, ohne Datenbank. Kleine,
// sofort erreichbare Etappenziele statt eines einzigen großen "100 %"-Ziels
// (ADHS: kurze Belohnungsschleifen).
const NICHT_ABHAKBAR = ["zeitblock", "workflow"];

export function baueTagesQuests({ items = [], hydrationHeuteMl = 0, hydrationZielMl = 0 }) {
  const abhakbar = items.filter((i) => !NICHT_ABHAKBAR.includes(i.kategorie));
  const erledigt = abhakbar.filter((i) => i.done).length;
  const gesamt = abhakbar.length;
  const quests = [];

  if (gesamt > 0) {
    quests.push({ key: "erster", titel: "Der erste Haken", icon: "👆", aktuell: Math.min(erledigt, 1), ziel: 1 });
    const halb = Math.ceil(gesamt / 2);
    if (gesamt >= 2) quests.push({ key: "halbzeit", titel: "Halbzeit", icon: "🌓", aktuell: Math.min(erledigt, halb), ziel: halb });
    const morgen = abhakbar.filter((i) => i.hour && i.hour < "11");
    if (morgen.length > 0) {
      quests.push({ key: "morgen", titel: "Morgen-Sprint", icon: "🌅", aktuell: morgen.filter((i) => i.done).length, ziel: morgen.length });
    }
  }
  if (hydrationZielMl > 0) {
    quests.push({ key: "trinken", titel: "Trinkziel", icon: "💧", aktuell: Math.min(hydrationHeuteMl, hydrationZielMl), ziel: hydrationZielMl, einheit: "ml" });
  }
  return quests.map((q) => ({ ...q, geschafft: q.aktuell >= q.ziel }));
}
