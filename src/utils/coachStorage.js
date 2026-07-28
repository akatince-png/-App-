// Persönlicher Name des Assistenten (Standard: "Aka", individuell
// umbenennbar) — rein clientseitig in localStorage, kein Server-Roundtrip
// nötig. Ein Name, keine getrennten "Mitarbeiter" — dieselbe KI-Quelle
// (siehe services/aiProviders.js) antwortet einfach unter diesem Namen,
// injiziert über den System-Prompt in jeder Anfrage (siehe
// services/aiService.js). Bewusst NICHT "Coach" genannt (Nutzerinnen-
// Vorgabe, 28.07.): kein Coach, der Vorschriften macht, sondern ein
// Assistent/Sidekick im Butler-Stil — siehe coachPersonaBlock() in
// aiService.js für die volle Rollenbeschreibung.
const COACH_NAME_KEY = "kiCoachName";
export const STANDARD_COACH_NAME = "Aka";

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
// utils/speech.js) — Default AN (Nutzerinnen-Vorgabe, 28.07.: soll
// "überall mit Ton antworten"), lässt sich aber jederzeit über
// VorlesenToggle.jsx manuell abschalten.
const VORLESEN_KEY = "kiCoachVorlesen";

export function getVorlesenAktiv() {
  if (typeof window === "undefined") return true;
  try {
    const gespeichert = localStorage.getItem(VORLESEN_KEY);
    return gespeichert === null ? true : gespeichert === "true";
  } catch {
    return true;
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
