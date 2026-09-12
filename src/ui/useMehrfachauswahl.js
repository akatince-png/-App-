import { useState } from "react";

// Auswahl-Logik fürs Sammel-Löschen (12.09., Nutzerin-Vorgabe: "mehrere
// Sachen gleichzeitig löschen ... übertrag das bitte auf alle möglichen
// anderen Systeme in der App auch") — ausgelagert aus ArchivAbschnitt.jsx,
// damit auch Listen mit eigenem, abweichendem Layout (z. B. nach Datum
// gruppiert wie in ProtokollLogView.jsx) dieselbe Auswahl-Logik nutzen
// können, ohne die feste Zeilen-Struktur von ArchivAbschnitt zu erben.
export function useMehrfachauswahl(items, getId) {
  const [ausgewaehlt, setAusgewaehlt] = useState(new Set());

  const alleAusgewaehlt = items.length > 0 && items.every((item) => ausgewaehlt.has(getId(item)));

  const umschalten = (id) =>
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const alleUmschalten = () => setAusgewaehlt(alleAusgewaehlt ? new Set() : new Set(items.map(getId)));

  const entfernenAusAuswahl = (id) =>
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const zuruecksetzen = () => setAusgewaehlt(new Set());

  return { ausgewaehlt, alleAusgewaehlt, umschalten, alleUmschalten, entfernenAusAuswahl, zuruecksetzen };
}
