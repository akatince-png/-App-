import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithCache, invalidateCache } from "./queryCache";

// React-Anbindung für queryCache.js (siehe dort für die Begründung).
// `key` bestimmt, welche Aufrufe sich einen Cache-Eintrag teilen — `null`
// pausiert das Laden (z. B. solange eine benötigte ID noch fehlt), analog
// zum üblichen Muster bei bedingten Datenabrufen.
export function useCachedQuery(key, fetcher, { ttlMs } = {}) {
  const [zustand, setZustand] = useState({ data: null, loading: key != null, error: null });
  // Ref statt direkter Closure-Nutzung in den Effects: `fetcher` ist bei
  // jedem Render ein neues Funktions-Literal (üblich für Inline-Arrow-
  // Functions an Aufrufstellen) — ohne die Ref würde jeder Render den
  // Lade-Effect erneut auslösen, obwohl sich `key` gar nicht geändert hat.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (key == null) return;
    let verworfen = false;
    setZustand((z) => ({ ...z, loading: true }));
    fetchWithCache(key, () => fetcherRef.current(), { ttlMs })
      .then((data) => {
        if (!verworfen) setZustand({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!verworfen) setZustand({ data: null, loading: false, error: err?.message || String(err) });
      });
    return () => {
      verworfen = true;
    };
  }, [key, ttlMs]);

  const refetch = useCallback(() => {
    if (key == null) return;
    invalidateCache(key);
    setZustand((z) => ({ ...z, loading: true }));
    fetchWithCache(key, () => fetcherRef.current(), { ttlMs })
      .then((data) => setZustand({ data, loading: false, error: null }))
      .catch((err) => setZustand({ data: null, loading: false, error: err?.message || String(err) }));
  }, [key, ttlMs]);

  return { ...zustand, refetch };
}
