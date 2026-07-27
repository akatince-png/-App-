// Persönlicher Name des KI-Coaches (z. B. "Coach Acker") — rein clientseitig
// in localStorage, kein Server-Roundtrip nötig. Ein Name, keine getrennten
// "Mitarbeiter" — dieselbe KI-Quelle (siehe services/aiProviders.js)
// antwortet einfach unter diesem Namen, injiziert über den System-Prompt in
// jeder Anfrage (siehe services/aiService.js).
const COACH_NAME_KEY = "kiCoachName";
export const STANDARD_COACH_NAME = "dein KI-Coach";

export function getCoachName() {
  if (typeof window === "undefined") return STANDARD_COACH_NAME;
  try {
    return localStorage.getItem(COACH_NAME_KEY) || STANDARD_COACH_NAME;
  } catch {
    return STANDARD_COACH_NAME;
  }
}

export function saveCoachName(name) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = (name || "").trim();
    if (trimmed) localStorage.setItem(COACH_NAME_KEY, trimmed);
    else localStorage.removeItem(COACH_NAME_KEY);
  } catch {
    // LocalStorage nicht verfügbar — Name gilt dann nur für diese Sitzung.
  }
}
