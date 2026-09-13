import { useRef } from "react";

/**
 * Gibt bei jedem Aufruf dasselbe Objekt zurück, solange sich keiner der
 * eigenen (Top-Level-)Werte geändert hat (Object.is-Vergleich je Schlüssel)
 * — auch wenn `obj` selbst bei jedem Aufruf ein frisches Objekt-Literal ist.
 *
 * Hintergrund (13.09., Teil 60): AppDataContext.jsx baut sein `value` aus
 * ~30 Daten-Hooks zusammen, von denen jeder bei jedem Render ein neues
 * Objekt-Literal zurückgibt (React-Hooks tun das grundsätzlich so) — auch
 * wenn sich der eigentliche Inhalt nicht geändert hat. Jede State-Änderung
 * in irgendeinem der 30 Hooks rendert dadurch bisher ALLE useAppData()-
 * Konsumenten neu, selbst wenn deren tatsächlich genutzte Werte gleich
 * geblieben sind. Ein `useMemo` direkt um `value` hilft dabei nicht (dessen
 * Dependency-Array wäre aus denselben, immer neuen Objekt-Referenzen
 * gebaut) — diese flache Prüfung vergleicht stattdessen die ~150
 * einzelnen Werte im fertig zusammengeführten `value`-Objekt direkt
 * (Zustände: nur neue Referenz bei echter Änderung dank durchgängig
 * immutabler setState-Updates in dieser App; Funktionen: bereits über
 * useCallback stabil) und braucht dafür keine einzige der 30 Hook-Dateien
 * oder eine einzige View anzufassen.
 */
export function useShallowStableValue(obj) {
  const ref = useRef(null);
  const vorher = ref.current;
  const keysNeu = Object.keys(obj);
  const geaendert =
    !vorher || Object.keys(vorher).length !== keysNeu.length || keysNeu.some((k) => !Object.is(obj[k], vorher[k]));
  if (geaendert) ref.current = obj;
  return ref.current;
}
