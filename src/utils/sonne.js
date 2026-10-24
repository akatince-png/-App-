// Sonnenuntergang (24.10., Nutzerin: App soll „mit Sonnenuntergang“ in den
// Abend wechseln). Sonnenstandsgleichung nach NOAA/Wikipedia („Sunrise
// equation“), genau auf wenige Minuten – reicht für die Farbe der App.
// Ort: Hannover als Vorgabe (die Nutzerin wohnt dort); eigene Koordinaten
// gibt es im Profil noch nicht.
export const HANNOVER = { breite: 52.37, laenge: 9.74 };

const rad = (g) => (g * Math.PI) / 180;
const grad = (r) => (r * 180) / Math.PI;

// Zeitpunkt des Sonnenuntergangs am Kalendertag von `datum` (lokales Datum) als Date.
export function sonnenuntergang(datum, { breite, laenge } = HANNOVER) {
  const jdMittag = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12) / 864e5 + 2440587.5;
  const n = Math.round(jdMittag - 2451545.0 + 0.0008);
  const jStern = n - laenge / 360;
  const m = (357.5291 + 0.98560028 * jStern) % 360;
  const c = 1.9148 * Math.sin(rad(m)) + 0.02 * Math.sin(rad(2 * m)) + 0.0003 * Math.sin(rad(3 * m));
  const lambda = (m + c + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStern + 0.0053 * Math.sin(rad(m)) - 0.0069 * Math.sin(rad(2 * lambda));
  const sinDelta = Math.sin(rad(lambda)) * Math.sin(rad(23.4397));
  const cosDelta = Math.cos(Math.asin(sinDelta));
  const cosOmega = (Math.sin(rad(-0.833)) - Math.sin(rad(breite)) * sinDelta) / (Math.cos(rad(breite)) * cosDelta);
  if (cosOmega < -1 || cosOmega > 1) return null; // Polartag/-nacht
  const jUntergang = jTransit + grad(Math.acos(cosOmega)) / 360;
  return new Date((jUntergang - 2440587.5) * 864e5);
}

// Minuten seit Mitternacht (lokale Zeit) des Sonnenuntergangs, oder null.
export function sonnenuntergangMinuten(datum, ort = HANNOVER) {
  const d = sonnenuntergang(datum, ort);
  return d ? d.getHours() * 60 + d.getMinutes() : null;
}
