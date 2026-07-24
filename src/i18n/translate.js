import { useCallback } from "react";
import { useLanguage } from "./LanguageContext";
import { UI_TEXT } from "./dict";
import { LABELS } from "./labels";

// t(key, vars?) — für zusammenhängende UI-Texte (Überschriften, Anleitungen,
// Fehlermeldungen, Button-Beschriftungen mit vollem Satzbau). Schlüssel sind
// frei erfundene, punktierte Namen (z. B. "home.tagesfortschritt"), keine
// deutschen Sätze — dadurch kann die englische Formulierung unabhängig von
// der deutschen variieren. Fehlt ein Schlüssel in der aktuellen Sprache,
// fällt t() auf Deutsch zurück, und fehlt er dort auch, wird der Schlüssel
// selbst zurückgegeben (sichtbar im UI statt eines stillen Absturzes).
//
// tLabel(value) — für kurze, wiederkehrende Wörter/Phrasen, die im ganzen
// UI exakt gleich vorkommen (Button-Text wie "Speichern"/"Abbrechen") oder
// die als fester Wert in der Datenbank stehen (Trainingsart, Tageszeit,
// Peptidname, Kategorie, Wochentag, ...). Nachschlagen erfolgt über den
// tatsächlichen deutschen Wert selbst statt über einen erfundenen
// Schlüssel — das spart beim Übersetzen tausender Konstanten-Werte eigene
// Schlüsselnamen. WICHTIG: tLabel übersetzt nur die ANZEIGE, niemals den
// Wert, der gespeichert/verglichen wird (z. B. `art === "Krafttraining"`
// bleibt unverändert im Code — nur `{tLabel(art)}` beim Rendern ändert sich).
// Unbekannte Werte werden unverändert zurückgegeben, damit ein fehlender
// Eintrag nie zu einem leeren/kaputten UI führt.
export function useT() {
  const { lang } = useLanguage();
  const t = useCallback(
    (key, vars) => {
      const entry = UI_TEXT[lang]?.[key] ?? UI_TEXT.de[key];
      if (entry === undefined) return key;
      const resolved = typeof entry === "function" ? entry(vars || {}) : entry;
      if (!vars || typeof entry === "function") return resolved;
      return Object.keys(vars).reduce((str, k) => str.split(`{{${k}}}`).join(String(vars[k])), resolved);
    },
    [lang]
  );
  const tLabel = useCallback(
    (value) => {
      if (value === null || value === undefined || value === "") return value;
      return LABELS[lang]?.[value] ?? value;
    },
    [lang]
  );
  return { t, tLabel, lang };
}
