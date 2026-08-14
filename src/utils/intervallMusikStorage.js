// Zuletzt genutzte Einstellungen für Workflow-/Trainings-Intervalltimer +
// Musik-Sync (14.08., Nutzerin-Vorgabe) — rein clientseitig in localStorage
// je Bereich ("workflow"/"training"), kein Server-Roundtrip nötig, da nur
// Bequemlichkeit (nicht bei jedem Öffnen neu eintippen müssen).
const PRAEFIX = "intervallMusik_";

const STANDARD = {
  workflow: { arbeitMin: "25", pauseMin: "5", gesamtMin: "100", modus: "durchgehend" },
  // Training hat seine eigenen Arbeit-/Pause-Sekunden-Felder (siehe
  // TrainingView.jsx) — hier wird nur der Musik-Modus gemerkt.
  training: { modus: "durchgehend" },
};

export function getIntervallMusikEinstellung(bereich) {
  const fallback = STANDARD[bereich] || STANDARD.workflow;
  if (typeof window === "undefined") return fallback;
  try {
    const gespeichert = localStorage.getItem(PRAEFIX + bereich);
    return gespeichert ? { ...fallback, ...JSON.parse(gespeichert) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveIntervallMusikEinstellung(bereich, einstellung) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRAEFIX + bereich, JSON.stringify(einstellung));
  } catch {
    // LocalStorage nicht verfügbar — gilt dann nur für diese Sitzung.
  }
}
