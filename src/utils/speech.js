// Sprachein-/ausgabe für den ADHS Coach.
// - Spracherkennung (Mikrofon → Text): Web Speech API, Chrome/Edge/Safari,
//   NICHT Firefox — keine Kosten, rein im Browser eingebaut.
// - Sprachausgabe (Text → Stimme): läuft primär über eine Cloud-Sprachausgabe
//   (Google Cloud Text-to-Speech, WaveNet-Stimme — deutlich natürlicher als
//   die robotisch klingende, geräteeigene Stimme). Falls die dafür nötige
//   Supabase Edge Function (noch) nicht deployt ist, kein Netz da ist, oder
//   sonst irgendwas schiefgeht, weicht sprich() automatisch und lückenlos auf
//   die geräteeigene Web-Speech-Sprachausgabe aus — die App bleibt so in
//   jedem Zustand nutzbar, nie stumm.
import { supabase } from "../lib/supabaseClient";

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
// vielen Geräten die roboterhafteste verfügbare Option). Nur noch für den
// Notfall-Rückweg (Web Speech) relevant, nicht für die Cloud-Sprachausgabe.
function besteDeutscheStimme() {
  const stimmen = window.speechSynthesis.getVoices().filter((s) => s.lang?.startsWith("de"));
  if (!stimmen.length) return null;
  const bevorzugt = stimmen.find((s) => /Google|Natural|Neural|Premium|Enhanced/i.test(s.name));
  return bevorzugt || stimmen[0];
}

// Zerlegt Text in einzelne Sätze (an . ! ? getrennt, Satzzeichen bleibt
// erhalten). Keine Lookbehind-Regex (breiterer Browser-Support).
function saetzeAufteilen(text) {
  return text
    .replace(/([.!?])\s+/g, "$1|||")
    .split("|||")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Gruppiert Sätze zu Textblöcken bis zu einer Zeichen-Obergrenze: eine
// einzelne Anfrage an die Cloud-Sprachausgabe darf laut Google nicht beliebig
// lang sein, und kleinere Blöcke lassen den ersten Ton schneller erklingen,
// statt erst auf die komplette (oft lange) Antwort zu warten.
function saetzeZuBloecken(saetze, maxLaenge = 800) {
  const bloecke = [];
  let aktuell = "";
  for (const satz of saetze) {
    const kandidat = aktuell ? `${aktuell} ${satz}` : satz;
    if (kandidat.length > maxLaenge && aktuell) {
      bloecke.push(aktuell);
      aktuell = satz;
    } else {
      aktuell = kandidat;
    }
  }
  if (aktuell) bloecke.push(aktuell);
  return bloecke;
}

// `generation` unterscheidet die jeweils aktuelle sprich()-Anfrage von
// früheren — verhindert, dass eine noch laufende, alte Netzwerkantwort nach
// einem Barge-in/einer neuen Antwort trotzdem noch losspielt (Ersatz für das
// bei Web Speech eingebaute automatische "neu spricht = alt wird verworfen").
let generation = 0;
let laufendeAudios = [];

function audioAbspielen(audio, meineGeneration) {
  return new Promise((resolve) => {
    if (meineGeneration !== generation) {
      resolve();
      return;
    }
    laufendeAudios.push(audio);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

// Spielt Text über die Google-Cloud-Sprachausgabe ab, blockweise
// nacheinander. Wirft einen Fehler, sobald irgendein Schritt fehlschlägt
// (nicht angemeldet, Funktion nicht deployt, Google-Fehler, ...) — sprich()
// fängt das ab und weicht dann komplett auf die Browser-eigene Sprachausgabe
// aus, statt mittendrin hängen zu bleiben.
async function cloudSprich(text, meineGeneration) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Nicht angemeldet.");

  const bloecke = saetzeZuBloecken(saetzeAufteilen(text));
  for (const block of bloecke) {
    if (meineGeneration !== generation) return;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ text: block }),
    });
    const data = await res.json();
    if (!res.ok || data.error || !data.audioContent) {
      throw new Error(data.error || `Cloud-Sprachausgabe fehlgeschlagen (${res.status})`);
    }
    if (meineGeneration !== generation) return;
    const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
    await audioAbspielen(audio, meineGeneration);
  }
}

// Web-Speech-Rückweg (bisheriges Verhalten) — läuft nur, wenn die
// Cloud-Sprachausgabe fehlschlägt oder die Funktion serverseitig noch nicht
// eingerichtet ist.
function webSpeechSprich(text, { onEnde } = {}) {
  if (!sprachausgabeVerfuegbar()) {
    onEnde?.();
    return;
  }
  const saetze = saetzeAufteilen(text);
  if (saetze.length === 0) {
    onEnde?.();
    return;
  }
  const stimme = besteDeutscheStimme();
  saetze.forEach((satz, i) => {
    const utterance = new SpeechSynthesisUtterance(satz);
    utterance.lang = "de-DE";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (stimme) utterance.voice = stimme;
    if (i === saetze.length - 1) {
      utterance.onend = () => onEnde?.();
      utterance.onerror = () => onEnde?.();
    }
    window.speechSynthesis.speak(utterance);
  });
}

// Bricht eine laufende Ausgabe ab statt sie zu stapeln — sonst würden bei
// mehreren schnellen Coach-Antworten alte Sätze nachträglich noch vorgelesen.
// onEnde (optional) feuert, sobald der letzte Satz/Block fertig gesprochen
// ist (oder bei einem Fehler) — z. B. um danach automatisch das Mikrofon zu
// starten.
export function sprich(text, { onEnde } = {}) {
  sprachausgabeStoppen();
  if (!text) {
    onEnde?.();
    return;
  }
  const meineGeneration = generation;
  cloudSprich(text, meineGeneration)
    .then(() => {
      if (meineGeneration === generation) onEnde?.();
    })
    .catch(() => {
      if (meineGeneration === generation) webSpeechSprich(text, { onEnde });
    });
}

export function sprachausgabeStoppen() {
  generation++;
  if (sprachausgabeVerfuegbar()) window.speechSynthesis.cancel();
  laufendeAudios.forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
  laufendeAudios = [];
}
