// Sprachein-/ausgabe für den KI-Coach — nutzt ausschließlich im Browser
// eingebaute APIs (Web Speech API), keinen zusätzlichen Dienst und keine
// neuen Kosten. Verfügbarkeit unterscheidet sich je Browser:
// - Spracherkennung (Mikrofon → Text): Chrome/Edge/Safari, NICHT Firefox.
// - Sprachausgabe (Text → Stimme): praktisch überall, auch Firefox.
// Jede Funktion prüft ihre eigene Verfügbarkeit und meldet "nicht
// unterstützt" statt abzustürzen, statt vom Aufrufer verlangt zu werden,
// das vorher zu wissen.

export function spracherkennungVerfuegbar() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function sprachausgabeVerfuegbar() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Startet eine einzelne Spracherkennung (Deutsch). Ruft onErgebnis(text)
 * auf, sobald ein endgültiges Ergebnis vorliegt — bewusst kein
 * Auto-Absenden, der erkannte Text landet nur im Eingabefeld, damit
 * Erkennungsfehler vor dem Senden noch korrigiert werden können.
 * @returns {() => void} stop-Funktion
 */
export function starteSprachErkennung({ onErgebnis, onEnde, onFehler }) {
  const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!Recognition) {
    onFehler?.("Spracherkennung wird von diesem Browser nicht unterstützt.");
    return () => {};
  }
  const erkennung = new Recognition();
  erkennung.lang = "de-DE";
  erkennung.interimResults = false;
  erkennung.maxAlternatives = 1;
  erkennung.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript;
    if (text) onErgebnis(text);
  };
  erkennung.onerror = (e) => onFehler?.(e.error || "Unbekannter Fehler bei der Spracherkennung.");
  erkennung.onend = () => onEnde?.();
  erkennung.start();
  return () => erkennung.stop();
}

// Bricht eine laufende Ausgabe ab statt sie zu stapeln — sonst würden bei
// mehreren schnellen Coach-Antworten alte Sätze nachträglich noch vorgelesen.
export function sprich(text) {
  if (!sprachausgabeVerfuegbar() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  window.speechSynthesis.speak(utterance);
}

export function sprachausgabeStoppen() {
  if (sprachausgabeVerfuegbar()) window.speechSynthesis.cancel();
}
