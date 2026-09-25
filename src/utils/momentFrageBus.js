// Fragen im richtigen Moment (25.09.): Daten-Hooks melden eine Erledigung
// (z. B. Mahlzeit abgehakt), MomentFrageHost entscheidet, ob gerade eine
// kurze Ein-Tipp-Frage passt (z. B. nur im Kernprogramm ab Woche 3), und
// speichert die Antwort. Gleiches Prinzip wie belohnungBus.js.
const listeners = new Set();

export function meldeMoment(payload) {
  listeners.forEach((fn) => fn(payload));
}

export function aufMomentHoeren(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
