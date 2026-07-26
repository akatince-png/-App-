// Anzeige-Präferenz für die Mini-Plan-Widgets auf der Startseite — unabhängig
// vom ADHS-Notfallmodus (siehe adhsStorage.js): steuert, ob auch Kategorien
// ohne eigene Daten als graues, noch einrichtbares Widget erscheinen, oder ob
// nur tatsächlich genutzte Kategorien angezeigt werden. Default "alle
// anzeigen", da so auch unbenutzte Bereiche als Einstiegspunkt sichtbar
// bleiben (relevant z. B. für eine spätere Freischaltung einzelner Bereiche).
const WIDGETS_ALLE_KEY = "miniWidgetsAlleAnzeigen";

export function getMiniWidgetsAlleAnzeigen() {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(WIDGETS_ALLE_KEY);
    return stored === null || stored === "true";
  } catch {
    return true;
  }
}

export function saveMiniWidgetsAlleAnzeigen(alle) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WIDGETS_ALLE_KEY, alle ? "true" : "false");
  } catch {
    // LocalStorage nicht verfügbar — Präferenz gilt dann nur für diese Sitzung.
  }
}
