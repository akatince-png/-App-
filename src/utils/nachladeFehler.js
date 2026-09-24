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

// Für lazy(): einen fehlgeschlagenen Nachlade-Versuch (kurzer Verbindungs-
// fehler, 502) still bis zu zweimal wiederholen, bevor das Auffangnetz
// eingreift (Admin-Livetest 24.09.: ein einzelner 502 auf einer
// Teil-Datei ließ den ganzen Tagesplan abstürzen). Scheitert es endgültig,
// kommt ein Fehler, den istNachladeFehler erkennt → einmal neu laden.
export function ladeMitWiederholung(importFn, versuche = 3, warte = (ms) => new Promise((r) => setTimeout(r, ms))) {
  return async () => {
    let letzter = null;
    for (let i = 0; i < versuche; i++) {
      try {
        const modul = await importFn();
        if (modul?.default) return modul;
        letzter = new Error("leeres Modul");
      } catch (e) {
        letzter = e;
      }
      if (i < versuche - 1) await warte(800 * (i + 1));
    }
    throw istNachladeFehler(letzter) ? letzter : new Error(`Failed to fetch dynamically imported module (${letzter?.message || "unbekannt"})`);
  };
}
