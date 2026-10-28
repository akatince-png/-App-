import { useEffect, useState } from "react";
import { wetterUrl } from "../utils/wetter";

// Wettervorhersage (Open-Meteo), höchstens alle 3 Stunden neu geladen und im
// Browser zwischengespeichert. In automatischen Tests (navigator.webdriver)
// und Unit-Tests bewusst aus, damit die Läufe nicht vom Internet abhängen.
const SCHLUESSEL = "aka-wetter";
const GUELTIG_MS = 3 * 3600000;

const lesen = () => {
  try {
    const x = JSON.parse(localStorage.getItem(SCHLUESSEL) || "null");
    return x && Date.now() - x.geladen < GUELTIG_MS ? x.daten : null;
  } catch {
    return null;
  }
};

export function useWetter() {
  const [daten, setDaten] = useState(lesen);
  useEffect(() => {
    if (daten || typeof fetch !== "function" || navigator.webdriver || import.meta.env.MODE === "test") return;
    let aus = false;
    fetch(wetterUrl())
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (aus || !d?.hourly) return;
        setDaten(d);
        try {
          localStorage.setItem(SCHLUESSEL, JSON.stringify({ geladen: Date.now(), daten: d }));
        } catch {
          /* Speicher voll oder gesperrt – dann eben ohne Zwischenspeicher */
        }
      })
      .catch(() => {});
    return () => {
      aus = true;
    };
  }, [daten]);
  return daten;
}
