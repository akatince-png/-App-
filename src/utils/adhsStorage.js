/**
 * ADHS Storage Utils: LocalStorage für ADHS-Mode-Persistierung
 *
 * Ermöglicht es, dass der Emergency-Mode über Seiten-Reloads erhalten bleibt.
 * Optional zu nutzen — kein Breaking Change.
 *
 * Verwendung:
 *   const [isEmergencyMode, setIsEmergencyMode] = useState(() =>
 *     getADHSMode()
 *   );
 *
 *   const toggleMode = (newState) => {
 *     setIsEmergencyMode(newState);
 *     saveADHSMode(newState);
 *   };
 */

const ADHS_MODE_KEY = "adhsEmergencyMode";
const ADHS_SOUND_KEY = "adhsSoundEnabled";

/**
 * Läd den gespeicherten ADHS-Mode (default: false)
 */
export function getADHSMode() {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(ADHS_MODE_KEY);
    return stored === "true";
  } catch (e) {
    console.warn("LocalStorage nicht verfügbar:", e);
    return false;
  }
}

/**
 * Speichert den ADHS-Mode
 */
export function saveADHSMode(isEmergency) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADHS_MODE_KEY, isEmergency ? "true" : "false");
  } catch (e) {
    console.warn("LocalStorage Speichern fehlgeschlagen:", e);
  }
}

/**
 * Läd Sound-Preference (default: true)
 */
export function getSoundEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(ADHS_SOUND_KEY);
    return stored === null || stored === "true"; // default on
  } catch (e) {
    return true;
  }
}

/**
 * Speichert Sound-Preference
 */
export function saveSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADHS_SOUND_KEY, enabled ? "true" : "false");
  } catch (e) {
    console.warn("LocalStorage Speichern fehlgeschlagen:", e);
  }
}

/**
 * Reset-Funktion für Debugging/Testing
 */
export function clearADHSSettings() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADHS_MODE_KEY);
    localStorage.removeItem(ADHS_SOUND_KEY);
  } catch (e) {
    console.warn("LocalStorage Clear fehlgeschlagen:", e);
  }
}
