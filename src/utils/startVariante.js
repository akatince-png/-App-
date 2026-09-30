// Zwei Varianten der Schnellknöpfe (30.09., Nutzerin: „zeig mir beides“):
// "a" = vier Knöpfe auf der Startseite + runde Glühbirne,
// "b" = Schnellzugriff in der unteren Leiste (Kreis-Menü). Seit 30.09. ist
// "b" Standard – die Nutzerin hat sich für den Kreis entschieden.
const SCHLUESSEL = "mp-start-variante";

export function startVariante() {
  try {
    return localStorage.getItem(SCHLUESSEL) === "a" ? "a" : "b";
  } catch {
    return "b";
  }
}
