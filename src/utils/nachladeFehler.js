// Ein Teil der App (lazy geladene Ansicht) konnte nicht nachgeladen werden —
// typischerweise, weil seit dem Öffnen eine neue Version veröffentlicht
// wurde (alte Dateinamen existieren nicht mehr) oder die Verbindung kurz
// weg war. Gefunden im Dauertest 23.09.: statt des Absturz-Bildschirms
// lädt die App dann einmal neu und ist wieder auf dem aktuellen Stand.
const MUSTER = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed/i;
const SCHLUESSEL = "aka_nachlade_reload_um";
const SPERRE_MS = 30000;

export function istNachladeFehler(fehler) {
  return MUSTER.test(String(fehler?.message || fehler || ""));
}

// Lädt höchstens einmal pro 30 s neu (verhindert eine Neulade-Schleife, falls
// die Datei wirklich dauerhaft fehlt). Gibt zurück, ob neu geladen wird.
export function einmalNeuLaden(jetzt = Date.now(), speicher = globalThis.sessionStorage, neuLaden = () => globalThis.location.reload()) {
  try {
    const zuletzt = Number(speicher?.getItem(SCHLUESSEL) || 0);
    if (jetzt - zuletzt < SPERRE_MS) return false;
    speicher?.setItem(SCHLUESSEL, String(jetzt));
  } catch {
    // ohne sessionStorage trotzdem einmal versuchen
  }
  neuLaden();
  return true;
}
