// Aka startet die Morgen-/Abendroutine (10.10.): Aka merkt sich den Wunsch
// und öffnet die Startseite; HomeView holt ihn ab – beim Öffnen oder, wenn
// die Startseite schon offen ist, über das Ereignis.
export const ROUTINE_START_EREIGNIS = "aka-routine-starten";
const KEY = "aka-routine-start";

export function routineStartMerken(art) {
  try {
    sessionStorage.setItem(KEY, art);
  } catch {
    // ohne Speicher öffnet sich nur die Startseite
  }
  window.dispatchEvent(new Event(ROUTINE_START_EREIGNIS));
}

export function routineStartHolen() {
  try {
    const art = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return art === "morgen" || art === "abend" ? art : null;
  } catch {
    return null;
  }
}
