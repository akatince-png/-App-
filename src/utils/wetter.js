// Wetter für Tageslicht (28.10., Nutzerin: „einen Blick im Internet auf die
// Prognosen“). Quelle: Open-Meteo (frei, ohne Konto). Geschickt werden nur
// die festen Koordinaten (Hannover), keine Daten der Nutzerin.
import { HANNOVER, sonnenaufgang, sonnenuntergang } from "./sonne";

export const wetterUrl = ({ breite, laenge } = HANNOVER) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${breite}&longitude=${laenge}&hourly=cloud_cover,precipitation_probability&timezone=Europe%2FBerlin&forecast_days=2`;

// Stunden eines Tages ("YYYY-MM-DD") aus der Open-Meteo-Antwort.
export function stundenFuerTag(daten, datumIso) {
  const h = daten?.hourly;
  if (!h?.time) return [];
  return h.time
    .map((t, i) => ({ datum: t.slice(0, 10), stunde: Number(t.slice(11, 13)), wolken: h.cloud_cover?.[i] ?? null, regen: h.precipitation_probability?.[i] ?? 0 }))
    .filter((s) => s.datum === datumIso && s.wolken != null);
}

export function himmel(wolken, regen = 0) {
  if (regen >= 50) return "Regen wahrscheinlich";
  if (wolken < 25) return "sonnig";
  if (wolken < 60) return "teils bewölkt";
  if (wolken < 85) return "bewölkt";
  return "bedeckt";
}

// Bestes 2-Stunden-Fenster zwischen Sonnenauf- und -untergang (heute erst ab
// der aktuellen Stunde): wenig Wolken, Regen zählt doppelt.
export function besteLichtZeit(stunden, datum = new Date(), jetzt = new Date()) {
  const auf = sonnenaufgang(datum);
  const unter = sonnenuntergang(datum);
  if (!auf || !unter || !stunden.length) return null;
  const heute = datum.toDateString() === jetzt.toDateString();
  const ab = Math.max(auf.getHours() + 1, heute ? jetzt.getHours() : 0);
  // Das Fenster muss vor Sonnenuntergang enden (17:00 → spätestens 15–17 Uhr).
  const bis = unter.getHours() + (unter.getMinutes() >= 30 ? 1 : 0);
  // Kurz vor Sonnenuntergang passt oft kein 2-Stunden-Fenster mehr – dann 1 Stunde.
  for (const laenge of [2, 1]) {
    let beste = null;
    for (let s = ab; s + laenge <= bis; s++) {
      const fenster = stunden.filter((x) => x.stunde >= s && x.stunde < s + laenge);
      if (fenster.length < laenge) continue;
      const wolken = Math.round(fenster.reduce((summe, x) => summe + x.wolken, 0) / laenge);
      const regen = Math.max(...fenster.map((x) => x.regen));
      const wert = wolken + regen * 2;
      if (!beste || wert < beste.wert) beste = { von: s, bis: s + laenge, wolken, regen, wert };
    }
    if (beste) return beste;
  }
  return null;
}

const hh = (s) => String(s).padStart(2, "0");

// Kurzer Tipp für Tageslicht-Seite und Routine.
export function lichtTipp(daten, datum = new Date(), jetzt = new Date()) {
  const iso = `${datum.getFullYear()}-${hh(datum.getMonth() + 1)}-${hh(datum.getDate())}`;
  const beste = besteLichtZeit(stundenFuerTag(daten, iso), datum, jetzt);
  if (!beste) return null;
  return {
    ...beste,
    text: `Beste Zeit für Tageslicht: ${hh(beste.von)}–${hh(beste.bis)} Uhr (${himmel(beste.wolken, beste.regen)}).`,
    zusatz: beste.wolken >= 60 ? "Auch bei Wolken ist es draußen meist deutlich heller als drinnen." : null,
  };
}
