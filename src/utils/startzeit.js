// App-Tempo messen, wie es auf dem Gerät der Nutzerin wirklich ist
// (Nutzerinnen-Wunsch 23.09.): Messungen aus der Cloud-Testumgebung sind
// wegen deren Netzwerk-Umleitung zu pessimistisch. Gemessen wird bis zu dem
// Moment, in dem der Ladebildschirm verschwindet:
// - "Öffnen": App mit bestehender Anmeldung geöffnet (ab Seitenaufruf),
// - "Anmelden": ab dem Tipp auf "Anmelden".
// Die letzten 10 Messungen liegen nur lokal auf dem Gerät; angezeigt werden
// sie unter "Mehr" (ui/AppTempoKarte.jsx).
const LOGIN_SCHLUESSEL = "aka_login_start";
const LISTE_SCHLUESSEL = "aka_startzeiten";
const MAX = 10;
let gemeldet = false;

export function markiereAnmeldung() {
  try {
    sessionStorage.setItem(LOGIN_SCHLUESSEL, String(Date.now()));
  } catch {
    // ohne sessionStorage keine Anmelde-Messung
  }
}

export function leseStartzeiten() {
  try {
    const liste = JSON.parse(localStorage.getItem(LISTE_SCHLUESSEL) || "[]");
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

// Einmal pro Seitenaufruf, sobald die App bereit ist.
export function meldeAppBereit(jetzt = Date.now()) {
  if (gemeldet) return null;
  gemeldet = true;
  let messung = null;
  try {
    const loginStart = Number(sessionStorage.getItem(LOGIN_SCHLUESSEL) || 0);
    sessionStorage.removeItem(LOGIN_SCHLUESSEL);
    if (loginStart && jetzt - loginStart < 120000) messung = { typ: "Anmelden", ms: jetzt - loginStart, am: new Date(jetzt).toISOString() };
    else if (typeof performance !== "undefined") messung = { typ: "Öffnen", ms: Math.round(performance.now()), am: new Date(jetzt).toISOString() };
    if (messung) localStorage.setItem(LISTE_SCHLUESSEL, JSON.stringify([messung, ...leseStartzeiten()].slice(0, MAX)));
  } catch {
    // Messung ist nur Komfort — nie die App stören
  }
  return messung;
}

export function sekunden(ms) {
  return `${(ms / 1000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}
