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

// Mehrere benannte Workflow-Presets statt nur einer einzigen Einstellung
// (15.08., Nutzerin-Vorgabe: "wenn ich mehrere Workflows habe, verschiedene
// Workflownamen, damit ich verschiedene Lieder anwenden kann") — jedes
// Preset hat eigene Timer-Werte UND eine eigene Spotify-Playlist-Zuordnung
// (siehe WorkflowTimer.jsx, anlass = `workflow:${preset.id}`). Bleibt wie
// bisher rein lokal (kein Server-Roundtrip, keine neue DB-Tabelle) — die
// Playlist-ZUORDNUNG selbst liegt weiterhin in spotify_anlass_playlists
// (bestehende Tabelle, anlass ist freier Text, keine Schema-Änderung nötig).
const PRESETS_SCHLUESSEL = PRAEFIX + "workflow_presets";

function neuePresetId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
}

export function getWorkflowPresets() {
  if (typeof window === "undefined") return [];
  try {
    const gespeichert = localStorage.getItem(PRESETS_SCHLUESSEL);
    if (gespeichert) return JSON.parse(gespeichert);
  } catch {
    // Fällt unten auf Migration/leere Liste zurück.
  }
  // Migration: eine schon vorhandene, alte Einzel-Einstellung (vor dieser
  // Umstellung) als erstes Preset "Workflow" übernehmen statt sie zu
  // verlieren.
  const alt = getIntervallMusikEinstellung("workflow");
  if (localStorage.getItem(PRAEFIX + "workflow")) {
    const migriert = [{ id: neuePresetId(), name: "Workflow", ...alt }];
    saveWorkflowPresets(migriert);
    return migriert;
  }
  return [];
}

export function saveWorkflowPresets(presets) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESETS_SCHLUESSEL, JSON.stringify(presets));
  } catch {
    // LocalStorage nicht verfügbar — gilt dann nur für diese Sitzung.
  }
}
