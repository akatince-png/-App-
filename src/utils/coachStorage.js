// Persönlicher Name des Assistenten (Standard: "Acker", individuell
// umbenennbar) — rein clientseitig in localStorage, kein Server-Roundtrip
// nötig. Ein Name, keine getrennten "Mitarbeiter" — dieselbe KI-Quelle
// (siehe services/aiProviders.js) antwortet einfach unter diesem Namen,
// injiziert über den System-Prompt in jeder Anfrage (siehe
// services/aiService.js). Bewusst NICHT "Coach" genannt (Nutzerinnen-
// Vorgabe, 28.07.): kein Coach, der Vorschriften macht, sondern ein
// unaufdringlicher, fähiger Assistent im Hintergrund — siehe
// coachPersonaBlock() in aiService.js für die volle Rollenbeschreibung.
const COACH_NAME_KEY = "kiCoachName";
export const STANDARD_COACH_NAME = "Acker";

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

// Ob Antworten des Assistenten automatisch vorgelesen werden sollen (siehe
// utils/speech.js) — Default aus, damit niemand unerwartet Ton bekommt.
const VORLESEN_KEY = "kiCoachVorlesen";

export function getVorlesenAktiv() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(VORLESEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveVorlesenAktiv(aktiv) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VORLESEN_KEY, aktiv ? "true" : "false");
  } catch {
    // LocalStorage nicht verfügbar — Einstellung gilt dann nur für diese Sitzung.
  }
}
