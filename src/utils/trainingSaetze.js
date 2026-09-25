// Satz-für-Satz-Ergebnisse im Live-Workout (25.09.): Soll-Wiederholungen
// aus dem Plan lesen ("10", "8-12" → obere Zahl) und nach der Übung einen
// ehrlichen Hinweis fürs nächste Mal geben.
export function sollWiederholungen(wdh) {
  const m = String(wdh ?? "").match(/\d+/g);
  if (!m) return null;
  return Math.max(...m.map(Number));
}

export function naechstesMalHinweis(ergebnisse, soll) {
  const liste = (ergebnisse || []).filter(Boolean);
  const zahl = sollWiederholungen(soll);
  if (!liste.length || !zahl) return null;
  const alle = liste.every((e) => e.wdh >= zahl);
  const schwer = liste.some((e) => e.schwere === "sehr schwer");
  const leicht = liste.every((e) => e.schwere === "leicht");
  if (alle && (leicht || !schwer)) return "💡 Alle Sätze geschafft – nächstes Mal darf es etwas mehr sein (Gewicht oder Wiederholungen).";
  if (alle) return "💪 Alle Sätze geschafft, aber sehr schwer – nächstes Mal gleich lassen.";
  const summe = liste.reduce((s, e) => s + e.wdh, 0);
  return `📝 ${summe} von ${zahl * liste.length} Wiederholungen – nächstes Mal gleich lassen oder etwas leichter.`;
}
