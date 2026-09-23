import { useEffect, useRef } from "react";
import { feuereBelohnung } from "../utils/belohnungBus";
import { toLocalISODate } from "../utils/dates";

// Große Feier, wenn der letzte offene Punkt des Tages abgehakt wird (UX-
// Review 23.09.: "Tag geschafft" war bisher nur eine stille 100 %-Zahl).
// Feuert nur beim ÜBERGANG "noch offen → alles erledigt" innerhalb der
// laufenden Ansicht — wer die App an einem schon fertigen Tag öffnet, bekommt
// keine erneute Feier — und höchstens einmal pro Tag und Gerät, auch wenn
// Home und Tagesplan den Übergang beide mitbekommen.
const NICHT_ABHAKBAR = ["zeitblock", "workflow"];

export function tagIstGeschafft(items) {
  const relevante = (items || []).filter((i) => !NICHT_ABHAKBAR.includes(i.kategorie));
  return { geschafft: relevante.length > 0 && relevante.every((i) => i.done), anzahl: relevante.length };
}

export function useTagGeschafftFeier(items, aktiv = true) {
  const vorherRef = useRef(null);

  useEffect(() => {
    if (!aktiv) {
      vorherRef.current = null;
      return undefined;
    }
    const { geschafft, anzahl } = tagIstGeschafft(items);
    const vorher = vorherRef.current;
    vorherRef.current = geschafft;
    if (vorher !== false || !geschafft) return undefined;

    const schluessel = `aka_tag_geschafft_${toLocalISODate(new Date())}`;
    try {
      if (localStorage.getItem(schluessel)) return undefined;
      localStorage.setItem(schluessel, "1");
    } catch {
      // ohne localStorage feiern wir trotzdem — schlimmstenfalls doppelt
    }
    // Kurz verzögert, damit das normale "+1 Punkt"-Fenster des letzten
    // Punkts erst zu sehen ist und die große Feier es danach ablöst.
    const timer = setTimeout(() => {
      feuereBelohnung({
        text: "Tagesplan geschafft! 🎉",
        untertitel: `Alle ${anzahl} Punkte für heute erledigt.`,
        icon: "trophy",
        gross: true,
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [items, aktiv]);
}
