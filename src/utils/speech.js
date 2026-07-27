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
 * Startet eine fortlaufende Spracherkennung (Deutsch) — bleibt aktiv über
 * mehrere Sätze/Sprechpausen hinweg, statt nach dem ersten Satz von selbst
 * zu stoppen. Ruft onZwischenergebnis(text) laufend mit dem noch
 * unbestätigten aktuellen Satzteil auf (damit z. B. der Senden-Knopf schon
 * während des Sprechens aktiv wird, nicht erst danach), und onErgebnis(text)
 * für jeden fertig erkannten Satzabschnitt. Bewusst kein Auto-Absenden, der
 * erkannte Text landet nur im Eingabefeld, damit Erkennungsfehler vor dem
 * Senden noch korrigiert werden können.
 * @returns {() => void} stop-Funktion
 */
export function starteSprachErkennung({ onZwischenergebnis, onErgebnis, onEnde, onFehler }) {
  const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!Recognition) {
    onFehler?.("Spracherkennung wird von diesem Browser nicht unterstützt.");
    return () => {};
  }
  const erkennung = new Recognition();
  erkennung.lang = "de-DE";
  erkennung.interimResults = true;
  erkennung.continuous = true;
  erkennung.maxAlternatives = 1;
  erkennung.onresult = (e) => {
    let final = "";
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const stueck = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += stueck;
      else interim += stueck;
    }
    if (final) onErgebnis(final.trim());
    onZwischenergebnis?.(interim.trim());
  };
  erkennung.onerror = (e) => onFehler?.(e.error || "Unbekannter Fehler bei der Spracherkennung.");
  erkennung.onend = () => onEnde?.();
  erkennung.start();
  return () => erkennung.stop();
}

// Bevorzugt eine natürlicher klingende deutsche Stimme, falls der
// Browser/das Betriebssystem mehrere anbietet (die Standardstimme ist auf
// vielen Geräten die roboterhafteste verfügbare Option). Wird bei jedem
// Aufruf neu ermittelt, da getVoices() beim ersten Laden der Seite oft noch
// leer ist und sich erst asynchron füllt.
function besteDeutscheStimme() {
  const stimmen = window.speechSynthesis.getVoices().filter((s) => s.lang?.startsWith("de"));
  if (!stimmen.length) return null;
  const bevorzugt = stimmen.find((s) => /Google|Natural|Neural|Premium|Enhanced/i.test(s.name));
  return bevorzugt || stimmen[0];
}

// Bricht eine laufende Ausgabe ab statt sie zu stapeln — sonst würden bei
// mehreren schnellen Coach-Antworten alte Sätze nachträglich noch vorgelesen.
export function sprich(text) {
  if (!sprachausgabeVerfuegbar() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 1.04;
  const stimme = besteDeutscheStimme();
  if (stimme) utterance.voice = stimme;
  window.speechSynthesis.speak(utterance);
}

export function sprachausgabeStoppen() {
  if (sprachausgabeVerfuegbar()) window.speechSynthesis.cancel();
}
