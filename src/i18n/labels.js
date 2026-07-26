import { LABELS as core } from "./labels/core";
import { LABELS as onboarding } from "./labels/onboarding";
import { LABELS as substanzen } from "./labels/substanzen";
import { LABELS as tagesplan } from "./labels/tagesplan";
import { LABELS as training } from "./labels/training";

// Merge-Punkt für alle Label-Wörterbücher (je Themenbereich eine eigene
// Datei unter labels/, damit mehrere Bereiche parallel bearbeitet werden
// können, ohne sich gegenseitig in derselben Datei zu blockieren).
export const LABELS = {
  en: {
    ...core.en,
    ...onboarding.en,
    ...substanzen.en,
    ...tagesplan.en,
    ...training.en,
  },
  tr: {
    ...core.tr,
    ...onboarding.tr,
    ...substanzen.tr,
    ...tagesplan.tr,
    ...training.tr,
  },
};
