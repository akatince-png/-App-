import { useCallback, useEffect, useState } from "react";
import { timerHinweisLoeschen, timerHinweisPlanen } from "./nativeTimerHinweis";

// Fokus-Timer (27.09., Tiimo-Idee "Countdown-Ring"): ein laufender Timer für
// einen Punkt aus dem Tagesplan. Liegt im Browser-Speicher, damit er beim
// Seitenwechsel weiterläuft; alle Stellen (Tagesplan, Startseite) hören auf
// dasselbe Ereignis. Nur ein Timer gleichzeitig – ADHS-freundlich.
const SCHLUESSEL = "mp-fokus-timer";
const EREIGNIS = "mp-fokus-timer";

function lesen() {
  try {
    const t = JSON.parse(localStorage.getItem(SCHLUESSEL) || "null");
    return t && t.ende ? t : null;
  } catch {
    return null;
  }
}
function schreiben(t) {
  try {
    if (t) localStorage.setItem(SCHLUESSEL, JSON.stringify(t));
    else localStorage.removeItem(SCHLUESSEL);
  } catch {
    /* privates Fenster o. Ä. – Timer lebt dann nur im Speicher */
  }
  window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: t }));
  // In der iPhone-App: Mitteilung zum Timer-Ende, auch bei gesperrtem Handy.
  if (t) timerHinweisPlanen(t);
  else timerHinweisLoeschen();
}

export function useFokusTimer() {
  const [timer, setTimer] = useState(lesen);
  const [jetzt, setJetzt] = useState(() => Date.now());

  useEffect(() => {
    const neu = (e) => setTimer(e.detail ?? lesen());
    window.addEventListener(EREIGNIS, neu);
    window.addEventListener("storage", neu);
    return () => {
      window.removeEventListener(EREIGNIS, neu);
      window.removeEventListener("storage", neu);
    };
  }, []);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const starten = useCallback(({ key, name, symbol, minuten }) => {
    const dauerSek = Math.max(1, Math.round((Number(minuten) || 15) * 60));
    const t = { key, name, symbol, dauerSek, start: Date.now(), ende: Date.now() + dauerSek * 1000 };
    setTimer(t);
    schreiben(t);
  }, []);

  const stoppen = useCallback(() => {
    setTimer(null);
    schreiben(null);
  }, []);

  const verlaengern = useCallback((minuten = 5) => {
    const t = lesen();
    if (!t) return;
    const basis = Math.max(t.ende, Date.now());
    const neu = { ...t, ende: basis + minuten * 60000, dauerSek: t.dauerSek + minuten * 60 };
    setTimer(neu);
    schreiben(neu);
  }, []);

  const restSek = timer ? Math.max(0, Math.round((timer.ende - jetzt) / 1000)) : 0;
  const anteil = timer ? Math.min(1, Math.max(0, restSek / timer.dauerSek)) : 0;
  return { timer, restSek, anteil, abgelaufen: !!timer && restSek === 0, starten, stoppen, verlaengern };
}

export const restText = (sek) => (sek >= 60 ? `${Math.ceil(sek / 60)} Min` : `${sek} Sek`);
