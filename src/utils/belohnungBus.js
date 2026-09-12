// Kleiner Publish/Subscribe-Kanal fürs Belohnungsfenster (Nutzerin-Vorgabe,
// 12.09.: "möchte ich, dass dieses ... visuell wird"). Die Aktionen, die
// eine Belohnung auslösen sollen (Toggle-Funktionen in den Daten-Hooks,
// RoutineAblauf, TrainingView), haben KEINEN gemeinsamen React-Vorfahren
// mit der Popup-Komponente in sinnvoller Nähe — ein globaler Event-Kanal
// statt Context/Props-Durchreichen durch jeden einzelnen Hook.
const listeners = new Set();

export function feuereBelohnung(payload) {
  listeners.forEach((fn) => fn(payload));
}

export function aufBelohnungHoeren(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
