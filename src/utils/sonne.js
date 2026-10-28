// Sonnenuntergang (24.10., Nutzerin: App soll „mit Sonnenuntergang“ in den
// Abend wechseln). Sonnenstandsgleichung nach NOAA/Wikipedia („Sunrise
// equation“), genau auf wenige Minuten – reicht für die Farbe der App.
// Ort: Hannover als Vorgabe (die Nutzerin wohnt dort); eigene Koordinaten
// gibt es im Profil noch nicht.
export const HANNOVER = { breite: 52.37, laenge: 9.74 };

const rad = (g) => (g * Math.PI) / 180;
const grad = (r) => (r * 180) / Math.PI;

// Sonnenauf- bzw. -untergang am Kalendertag von `datum` (lokales Datum) als Date.
function sonnenstand(datum, { breite, laenge }, richtung) {
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
  const j = jTransit + (richtung * grad(Math.acos(cosOmega))) / 360;
  return new Date((j - 2440587.5) * 864e5);
}

export const sonnenuntergang = (datum, ort = HANNOVER) => sonnenstand(datum, ort, 1);
// Sonnenaufgang (28.10., Nutzerin: Tageslicht in der Morgenroutine nicht
// abfragen, solange die Sonne noch gar nicht aufgegangen ist).
export const sonnenaufgang = (datum, ort = HANNOVER) => sonnenstand(datum, ort, -1);

// Minuten seit Mitternacht (lokale Zeit) des Sonnenuntergangs, oder null.
export function sonnenuntergangMinuten(datum, ort = HANNOVER) {
  const d = sonnenuntergang(datum, ort);
  return d ? d.getHours() * 60 + d.getMinutes() : null;
}

const uhrzeit = (d) => (d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : null);
export const sonnenaufgangUhr = (datum, ort = HANNOVER) => uhrzeit(sonnenaufgang(datum, ort));
export const sonnenuntergangUhr = (datum, ort = HANNOVER) => uhrzeit(sonnenuntergang(datum, ort));

// Routine-Schritt „Tageslicht“ (Kern-Baustein „licht“ oder am Namen erkennbar).
export const istLichtSchritt = (schritt) => schritt?.kernKey === "licht" || /tageslicht|sonnenlicht/i.test(schritt?.name || "");

// Ist es für Tageslicht noch zu früh? Bis 15 Min. nach Sonnenaufgang ist das
// Licht draußen noch schwach.
export function nochZuDunkel(jetzt = new Date(), ort = HANNOVER) {
  const auf = sonnenaufgang(jetzt, ort);
  return !!auf && jetzt.getTime() < auf.getTime() + 15 * 60000;
}

// Hinweis bei der Planung (28.10.): Wann geht die Sonne auf, und liegt der
// geplante Tageslicht-Schritt („HH:MM“) davor?
export function lichtHinweis(zeit, datum = new Date(), ort = HANNOVER) {
  const auf = sonnenaufgang(datum, ort);
  if (!auf) return null;
  const aufUhr = sonnenaufgangUhr(datum, ort);
  if (zeit) {
    const [h, m] = zeit.split(":").map(Number);
    const geplant = new Date(datum);
    geplant.setHours(h, m, 0, 0);
    if (geplant.getTime() < auf.getTime() + 15 * 60000) return { zuFrueh: true, text: `🌄 Sonnenaufgang heute erst ${aufUhr} – um ${zeit} ist es noch dunkel. Schritt nach hinten schieben oder später nachholen.` };
  }
  return { zuFrueh: false, text: `🌅 Sonnenaufgang heute ${aufUhr}` };
}
