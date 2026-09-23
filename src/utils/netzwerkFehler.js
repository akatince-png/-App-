// Verbindungsabbrüche (Funkloch, LTE-Wechsel, WLAN weg) melden die Browser
// je unterschiedlich und technisch: Safari "Load failed", Chrome "Failed to
// fetch", Firefox "NetworkError when attempting to fetch resource". Die
// Anfrage erreicht den Server dann gar nicht — kein App- oder Datenbank-
// fehler, deshalb eine verständliche Meldung statt "TypeError: Load failed"
// (UX-Review 23.09., Screenshot der Nutzerin im Admin-Dashboard).
const NETZWERK_MUSTER = /load failed|failed to fetch|networkerror|network request failed|fetch failed/i;

export function istNetzwerkFehler(meldung) {
  return NETZWERK_MUSTER.test(String(meldung || ""));
}

export function verstaendlicheFehlermeldung(meldung) {
  if (istNetzwerkFehler(meldung)) return "Keine Verbindung zum Server — bitte kurz die Internetverbindung prüfen und erneut laden.";
  return meldung;
}
