import { useCallback, useMemo } from "react";
import { useAppData } from "../context/AppDataContext";

// Liefert für einen Tagesplan-/Home-Eintrag den Namen des laufenden
// Zusatzprotokolls, zu dem er gehört (für das 🧪-Etikett) — oder null für
// Einträge des Hauptprotokolls. Medikamente tragen die Protokoll-Zuordnung
// in hormonDosierung (Plan-Einträge kennen nur den Namen), alle anderen
// Kategorien direkt im Roh-Objekt (siehe Migration 0093 / Daten-Hooks).
export function useZusatzEtikett() {
  const { zusatzprotokolle = [], hormonDosierung = {} } = useAppData();

  const namenNachId = useMemo(() => new Map(zusatzprotokolle.map((z) => [z.id, z.name])), [zusatzprotokolle]);

  return useCallback(
    (item) => {
      if (namenNachId.size === 0 || !item?.raw) return null;
      const id = item.kategorie === "hormon" ? hormonDosierung[item.raw.name]?.hauptprotokollId : item.raw.hauptprotokollId;
      return id ? namenNachId.get(id) || null : null;
    },
    [namenNachId, hormonDosierung]
  );
}

// Zählt, wie viele Einträge (Supplemente, Medikamente, Mahlzeiten,
// Gewohnheiten) zu einem Protokoll gehören.
export function anzahlEintraege(protokollId, { supplemente = [], hormonDosierung = {}, mahlzeiten = [], gewohnheiten = [] }) {
  const inListe = (liste) => liste.filter((e) => e.hauptprotokollId === protokollId).length;
  return inListe(supplemente) + inListe(Object.values(hormonDosierung)) + inListe(mahlzeiten) + inListe(gewohnheiten);
}
