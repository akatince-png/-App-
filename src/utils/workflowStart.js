// Schnellstart von der Startseite (30.09.): welcher Workflow soll beim
// Öffnen der Workflow-Seite sofort laufen? Preset-Id oder "spontan".
export const WORKFLOW_START_KEY = "mp-workflow-start";

export function workflowStartMerken(wert) {
  try {
    sessionStorage.setItem(WORKFLOW_START_KEY, wert);
  } catch {
    // ohne Speicher öffnet sich einfach die Workflow-Seite
  }
}

export function workflowStartHolen() {
  try {
    const w = sessionStorage.getItem(WORKFLOW_START_KEY);
    sessionStorage.removeItem(WORKFLOW_START_KEY);
    return w;
  } catch {
    return null;
  }
}
