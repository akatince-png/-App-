import { common } from "./common";
import { mehr } from "./mehr";

// Merge-Punkt für alle t()-Wörterbücher (je Feature-Bereich eine eigene
// Datei, damit mehrere Bereiche parallel bearbeitet werden können, ohne
// sich gegenseitig in derselben Datei zu blockieren). Neue Bereiche hier
// ergänzen, sobald ihre dict/-Datei existiert.
const NAMESPACES = [common, mehr];

function merge(lang) {
  return NAMESPACES.reduce((acc, ns) => ({ ...acc, ...ns[lang] }), {});
}

export const UI_TEXT = {
  de: merge("de"),
  en: merge("en"),
};
