import { useEffect, useRef, useState } from "react";
import { spracherkennungVerfuegbar, starteSprachErkennung } from "../utils/speech";

// Geräteeigene Diktierfunktion für Formularfelder (14.09., Nutzerinnen-
// Vorgabe), bewusst OHNE jede KI-Beteiligung: reine Web-Speech-API (siehe
// utils/speech.js), kein AIService-Aufruf, kein KI-Kontingent verbraucht.
// Unterscheidet sich von der Diktierfunktion in OnboardingCoachFreitext.jsx/
// TagebuchModal.jsx nur dadurch, dass hier zusätzlich der noch unsichere
// Zwischenteil (`interim`) separat nach außen gereicht wird, statt nur den
// fertigen Text — die aufrufende Komponente kann ihn dadurch optisch abgesetzt
// (kursiv/blass, "wird gerade erkannt") vom bereits bestätigten Feldwert
// zeigen, bevor er beim Satzende an den Feldwert angehängt wird.
export function useDiktat({ value, onChange, aktiv = true }) {
  const verfuegbar = aktiv && spracherkennungVerfuegbar();
  const [hoert, setHoert] = useState(false);
  const [interim, setInterim] = useState("");
  const [fehler, setFehler] = useState(null);
  const stopRef = useRef(null);
  // Der Wert zum Zeitpunkt des jeweils letzten erkannten Satzstücks, nicht
  // der Wert vom Start des Diktats — sonst würde ein zweites Satzstück das
  // erste wieder überschreiben statt sich anzuhängen.
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => () => stopRef.current?.(), []);

  const umschalten = () => {
    if (hoert) {
      stopRef.current?.();
      setHoert(false);
      setInterim("");
      return;
    }
    setFehler(null);
    setInterim("");
    setHoert(true);
    stopRef.current = starteSprachErkennung({
      onZwischenergebnis: setInterim,
      onErgebnis: (stueck) => {
        onChange(valueRef.current ? `${valueRef.current} ${stueck}` : stueck);
        setInterim("");
      },
      onEnde: () => setHoert(false),
      onFehler: (msg) => {
        setFehler(msg);
        setHoert(false);
        setInterim("");
      },
    });
  };

  return { verfuegbar, hoert, interim, fehler, umschalten };
}
