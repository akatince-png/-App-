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

// Heute schon gelaufene Workflows (06.10., „Als Nächstes“): Workflow-Punkte im
// Tagesplan haben keinen Haken – nach einer Session (ab 1 Min.) gilt der
// Workflow für heute als erledigt und wird nicht erneut angekündigt.
const ERLEDIGT_KEY = "aka-workflow-erledigt";
const heute = () => new Date().toLocaleDateString("sv-SE");

export function workflowHeuteErledigtMerken(presetId) {
  try {
    const roh = JSON.parse(localStorage.getItem(ERLEDIGT_KEY) || "null");
    const ids = roh?.datum === heute() ? roh.ids : [];
    localStorage.setItem(ERLEDIGT_KEY, JSON.stringify({ datum: heute(), ids: [...new Set([...ids, presetId])] }));
    sessionStorage.setItem("aka-naechster-zeigen", "1");
  } catch {
    // ohne Speicher wird der Workflow eben noch einmal angekündigt
  }
}

export function istWorkflowHeuteErledigt(presetId) {
  try {
    const roh = JSON.parse(localStorage.getItem(ERLEDIGT_KEY) || "null");
    return roh?.datum === heute() && roh.ids.includes(presetId);
  } catch {
    return false;
  }
}
