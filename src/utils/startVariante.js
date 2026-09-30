// Zwei Varianten der Schnellknöpfe (30.09., Nutzerin: „zeig mir beides“):
// "a" = vier Knöpfe auf der Startseite + runde Glühbirne,
// "b" = Schnellzugriff in der unteren Leiste. Bis zur Entscheidung "a".
const SCHLUESSEL = "mp-start-variante";

export function startVariante() {
  try {
    return localStorage.getItem(SCHLUESSEL) === "b" ? "b" : "a";
  } catch {
    return "a";
  }
}
