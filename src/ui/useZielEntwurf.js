import { useCallback, useEffect, useRef, useState } from "react";

// Gemeinsame Tagesziel-Entwurf-Logik für Hydration/Tageslicht (13.09.,
// Teil 60 der App-weiten Durchsuchung) — beide Views hatten unabhängig
// voneinander dasselbe Sync-Muster eingebaut, inklusive desselben Bugs
// (siehe Teil 60, Hauptdurchsuchung): der jeweilige Zielwert
// (hydrationZielMl/tageslichtZielMinuten) startet in der Datenschicht hart
// auf einen Standardwert, bevor der asynchrone Fetch den echten Wert
// liefert — ohne Sync konnte ein versehentlicher Tap auf "Speichern" in
// diesem kurzen Moment das echte Ziel stillschweigend zurücksetzen.
//
// @param echterWert - der aktuell geladene Zielwert (z. B. hydrationZielMl)
// @returns [zielEntwurf, setZielEntwurf] — zielEntwurf ist ein String-
//   Entwurfswert fürs Eingabefeld, synchronisiert sich mit echterWert,
//   solange die Nutzerin ihn nicht selbst angefasst hat.
export function useZielEntwurf(echterWert) {
  const [zielEntwurf, setZielEntwurfState] = useState(() => String(echterWert));
  const bearbeitetRef = useRef(false);
  useEffect(() => {
    if (!bearbeitetRef.current) setZielEntwurfState(String(echterWert));
  }, [echterWert]);
  const setZielEntwurf = useCallback((v) => {
    bearbeitetRef.current = true;
    setZielEntwurfState(v);
  }, []);
  return [zielEntwurf, setZielEntwurf];
}
