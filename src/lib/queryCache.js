// Zentrale Datenschicht mit Caching (App-Bauplan-Punkt). Konkreter
// Auslöser: AuthenticatedApp.jsx mountet den aktiven Bildschirm bei jedem
// `view`-Wechsel komplett neu (`key={view}`, für die fadeInUp-Übergangs-
// animation, siehe dort) — jede Komponente mit eigenem `useEffect`-
// Datenabruf (z. B. RanglisteKarte.jsx, unabhängig vom zentralen
// AppDataProvider) lädt ihre Daten dadurch bei jedem erneuten Besuch neu,
// selbst wenn sich seit dem letzten Besuch vor Sekunden nichts geändert
// hat — Home → Mehr → zurück zu Home fragt z. B. die Quest-Rangliste
// jedes Mal erneut komplett ab.
//
// Bewusst ein schlankes, selbst geschriebenes Modul statt einer Library
// wie React Query/SWR: die ~33 Daten-Hooks unter src/data/ haben schon
// eigene, sorgfältig gebaute optimistische Updates samt Rollback bei
// Fehlern (siehe UEBERGABEPROTOKOLL.md, mehrere frühere Teile) — die alle
// auf eine Bibliotheks-eigene Mutations-API umzustellen wäre ein eigener,
// riesiger Umbau für sich. Dieses Modul deckt stattdessen genau den Fall
// ab, für den es hier wirklich gebraucht wird: einfache, seltener
// wechselnde GET-artige Abfragen (Ranglisten, Nachschlagewerte, ...), die
// bei jedem Bildschirmwechsel neu gemountet werden.
const cache = new Map(); // key -> { data, geladenUm, inFlight: Promise|null }

/**
 * Lädt `fetcher()` und cacht das Ergebnis unter `key`. Innerhalb von
 * `ttlMs` seit dem letzten erfolgreichen Laden liefert ein erneuter
 * Aufruf sofort den gecachten Wert zurück, ohne `fetcher` erneut
 * aufzurufen. Mehrere gleichzeitige Aufrufe für denselben Key (z. B. zwei
 * Komponenten, die im selben Render-Zyklus dieselben Daten brauchen)
 * teilen sich dieselbe laufende Anfrage, statt doppelt zu laden.
 * Fehler werden NICHT gecacht — der nächste Aufruf versucht es erneut.
 */
export function fetchWithCache(key, fetcher, { ttlMs = 30000 } = {}) {
  const eintrag = cache.get(key);
  if (eintrag?.inFlight) return eintrag.inFlight;
  if (eintrag && Date.now() - eintrag.geladenUm < ttlMs) {
    return Promise.resolve(eintrag.data);
  }

  const inFlight = fetcher()
    .then((data) => {
      cache.set(key, { data, geladenUm: Date.now(), inFlight: null });
      return data;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { data: eintrag?.data, geladenUm: eintrag?.geladenUm ?? 0, inFlight });
  return inFlight;
}

/** Verwirft den gecachten Wert für `key` — der nächste Aufruf lädt neu. */
export function invalidateCache(key) {
  cache.delete(key);
}

// Nur für Tests: leert den kompletten Cache zwischen Testfällen, damit
// sich Tests nicht gegenseitig über den modul-globalen Cache beeinflussen.
export function _clearCacheForTests() {
  cache.clear();
}
