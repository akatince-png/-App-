import { LABELS as core } from "./labels/core";

// Merge-Punkt für alle Label-Wörterbücher (je Themenbereich eine eigene
// Datei unter labels/, damit mehrere Bereiche parallel bearbeitet werden
// können, ohne sich gegenseitig in derselben Datei zu blockieren).
export const LABELS = {
  en: {
    ...core.en,
  },
};
