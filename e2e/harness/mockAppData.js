// Automatischer Mock für useAppData() (~150 Felder aus ~30 Daten-Hooks) —
// für einen echten, handgeschriebenen Mock müsste jeder Hook einzeln
// gelesen werden. Stattdessen ein Proxy, der für jeden angefragten
// Feldnamen anhand des Namens rät, ob es sich um eine Funktion oder um
// Daten handelt, und einen plausiblen leeren/neutralen Wert liefert.
//
// WICHTIG (aus der ersten Version dieses Harness, siehe UEBERGABEPROTOKOLL.md
// Teil 80): jeder Wert MUSS pro Schlüssel gecacht werden (Map unten) — sonst
// liefert jeder Zugriff eine neue Array-/Funktions-Referenz, und
// Komponenten mit `useEffect([irgendeinAppDataFeld])` laufen in eine
// Endlosschleife ("Maximum update depth exceeded"), weil React die
// Dependency bei jedem Render als "verändert" sieht.
//
// Das ist bewusst ein Kompromiss für einen SMOKE-Test (nichts stürzt ab,
// Navigation funktioniert) — kein Ersatz für echte Rendering-Assertions
// mit konkreten Daten. Fehlt ein Muster unten, wirft die betroffene Stelle
// beim Testlauf einen Konsolenfehler ("... is not a function" o. Ä.) statt
// still falsch zu funktionieren — dann hier ergänzen.

// "i"-Flag ist hier Pflicht, nicht Kosmetik: camelCase-Komposita wie
// "spotifyVerbindungTrennen" oder "pushAktivieren" haben den Wortanfang
// großgeschrieben — ohne /i verfehlte diese Heuristik genau solche Fälle
// (beim ersten Testlauf gefunden: spotifyVerbindungTrennen wurde als Daten-
// statt Funktionsfeld erkannt, `onClick={spotifyVerbindungTrennen}` bekam
// dadurch ein Array statt eine Funktion — React-Fehler "Expected onClick
// listener to be a function").
const FUNKTIONS_PRAEFIXE = /^(set|toggle|add|save|skip|complete|clear|reset|update|create|delete|open|close|handle|on)[A-ZÄÖÜ]/;
const FUNKTIONS_SUFFIXE =
  /(hinzufuegen|entfernen|speichern|loeschen|erzeugen|aktualisieren|markieren|bestaetigen|pruefen|vermerken|archivieren|abschliessen|neuLaden|aktivieren|deaktivieren|trennen|kopieren|starten|stoppen|verbinden|anlegen|einladen|umschalten|zuruecksetzen|verwerfen|uebernehmen|ueberarbeiten)$/i;

// Felder, die eine feste, von der Namens-Heuristik abweichende Bedeutung
// haben (Flags, die über Weiterleitung/Sichtbarkeit entscheiden) — werden
// VOR der generischen Heuristik geprüft.
function explizit(userId) {
  return {
    userId,
    loading: false,
    onboardingComplete: true,
    isAdmin: true,
    belohnungPufferMin: 10,
  };
}

function siehtAusWieFunktion(key) {
  return FUNKTIONS_PRAEFIXE.test(key) || FUNKTIONS_SUFFIXE.test(key);
}

function siehtAusWieId(key) {
  return /Id$/.test(key);
}

function siehtAusWieZahl(key) {
  return /(Min|Ml|Prozent|Punkte|Tage|Anzahl|Ziel|Dauer)$/.test(key);
}

function siehtAusWieBoolean(key) {
  return /^(ist|hat|kann|darf)[A-ZÄÖÜ]/.test(key) || /(Aktiv|Verfuegbar|Erledigt|Abgeschlossen)$/.test(key);
}

export function baueMockAppData(userId) {
  const cache = new Map();
  const basis = explizit(userId);

  return new Proxy(basis, {
    get(target, key) {
      if (typeof key !== "string") return target[key];
      if (key in target) return target[key];
      if (cache.has(key)) return cache.get(key);

      let wert;
      if (siehtAusWieFunktion(key)) {
        wert = (..._args) => Promise.resolve();
      } else if (siehtAusWieId(key)) {
        // Bug-Fix (beim ersten Testlauf gefunden): ein generischer
        // Array-/Objekt-Fallback ist zwar leer, aber TRUTHY — jede
        // `if (irgendeineId)`-Weiche in der App hielt so ein nicht wirklich
        // vorhandenes Protokoll/Hauptprotokoll/... fälschlich für
        // "vorhanden" und lief dadurch in Code-Pfade, die echte, hier gar
        // nicht gemockte Werte erwarten (z. B. protocolId truthy ->
        // wochenprotokollFaellig() liest startdatum als String, bekam aber
        // einen Array-Fallback, Absturz bei `.split()`). Id-Felder daher
        // explizit `null` (falsy) statt in den generischen Array-Fallback
        // unten zu fallen.
        wert = null;
      } else if (siehtAusWieBoolean(key)) {
        wert = false;
      } else if (siehtAusWieZahl(key)) {
        wert = 0;
      } else if (/(Map|NachDatum|NachSchluessel)$/.test(key)) {
        // Echte JS-Map — Aufrufer nutzen hier .get(key), nicht
        // Objekt-Zugriff (z. B. trainingNachDatum in dayItems.js).
        wert = new Map();
      } else if (/(Erledigt|Dosierung)$/.test(key)) {
        wert = {};
      } else {
        // Genereller Fallback: Arrays sind das mit Abstand häufigste
        // Feld-Muster (Listen von Einträgen) und werden meist direkt ohne
        // "|| []"-Absicherung durchgereicht (.map/.filter/.forEach) —
        // ein leeres Array bricht dort nichts ab.
        wert = [];
      }
      cache.set(key, wert);
      return wert;
    },
  });
}
