import { useCallback, useState } from "react";

// Gemeinsame "frisch"-Schattenstate-Logik (13.09., Teil 60 der App-weiten
// Durchsuchung) — vorher an drei Stellen (PersoenlicheDatenCard.jsx,
// WoechentlicheCheckinsCard.jsx, LaborwerteFelder.jsx) separat, aber
// identisch implementiert, obwohl die Kommentare dort explizit
// aufeinander verwiesen.
//
// `frisch`: im Onboarding (v. a. bei "Neues Protokoll") sollen Felder leer/
// unberührt wirken statt bereits gespeicherte Werte aus einem früheren
// Durchlauf zu zeigen — ohne die echten Daten anzutasten (bleiben
// unverändert, solange das jeweilige Feld nicht angefasst wird). Die
// laufende Pflege außerhalb des Onboardings zeigt weiterhin ganz normal
// die echten Werte.
//
// @param echterWert - der tatsächlich gespeicherte Wert (aus useAppData())
// @param frisch - true im Onboarding-"frisch"-Modus
// @param anfangswert - Startwert des lokalen Schattenstands (z. B. {} oder [])
// @returns [anzeige, lokalAendern] — anzeige ist echterWert oder der lokale
//   Schattenstand (je nach frisch). lokalAendern aktualisiert NUR den
//   Schattenstand; der Aufrufer ruft weiterhin zusätzlich selbst den
//   echten Setter auf (bleibt bewusst getrennt, weil jede Stelle ihren
//   eigenen echten Setter mit eigener Signatur hat).
export function useFrischWert(echterWert, frisch, anfangswert) {
  const [lokal, setLokal] = useState(anfangswert);
  const anzeige = frisch ? lokal : echterWert;
  const lokalAendern = useCallback(
    (updater) => {
      if (frisch) setLokal(updater);
    },
    [frisch]
  );
  return [anzeige, lokalAendern];
}
