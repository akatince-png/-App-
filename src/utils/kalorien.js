// Alter in vollen Jahren aus einem ISO-Geburtsdatum — Grundlage für die
// Mifflin-St-Jeor-Berechnung.
export function berechneAlter(geburtsdatum) {
  if (!geburtsdatum) return null;
  const heute = new Date();
  const geboren = new Date(geburtsdatum);
  if (Number.isNaN(geboren.getTime())) return null;
  let alter = heute.getFullYear() - geboren.getFullYear();
  const geburtstagNochNicht =
    heute.getMonth() < geboren.getMonth() || (heute.getMonth() === geboren.getMonth() && heute.getDate() < geboren.getDate());
  if (geburtstagNochNicht) alter--;
  return alter > 0 ? alter : null;
}

// Grundumsatz (BMR) nach Mifflin-St-Jeor — repräsentiert den "Ist"-Kalorien-
// bedarf, um das aktuelle Gewicht zu halten (ohne Aktivitätsfaktor, da noch
// kein Aktivitätslevel erfasst wird). Für "Divers"/unbekanntes Geschlecht:
// Mittelwert aus der männlichen (+5) und weiblichen (−161) Konstante.
export function berechneGrundumsatz({ geschlecht, geburtsdatum, groesse, gewicht }) {
  const alter = berechneAlter(geburtsdatum);
  const g = Number(groesse);
  const w = Number(gewicht);
  if (!alter || !g || !w) return null;
  const basis = 10 * w + 6.25 * g - 5 * alter;
  if (geschlecht === "Männlich") return Math.round(basis + 5);
  if (geschlecht === "Weiblich") return Math.round(basis - 161);
  return Math.round(basis - 78);
}
