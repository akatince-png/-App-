// KI-Einwilligung (28.09., Apple-Richtlinie 5.1.2(i) + DSGVO): Persönliche
// Daten gehen nur an KI-Dienste (Google Gemini, Google Text-to-Speech, Groq),
// wenn die Person das ausdrücklich erlaubt hat (profiles.ki_einwilligung_am).
// Freiwillig – ohne Einwilligung funktioniert alles andere per Hand.
// Gesetzt wird der Schalter von useProfileData (eigenes Profil bzw. im
// Verwalten-Modus das der verwalteten Person), Admin-Konten dürfen immer.

let erlaubt = false;

export function setzeKiErlaubt(wert) {
  erlaubt = !!wert;
}

export function kiErlaubt() {
  return erlaubt;
}

export const KI_AUS_TEXT = "KI-Funktionen sind ausgeschaltet. Du kannst sie unter Mehr → Datenschutz einschalten – alles andere geht auch ohne KI per Hand.";

export class KiNichtErlaubtFehler extends Error {
  constructor() {
    super(KI_AUS_TEXT);
    this.name = "KiNichtErlaubtFehler";
  }
}

// Vor jedem Aufruf eines KI-Dienstes.
export function kiPruefen() {
  if (!erlaubt) throw new KiNichtErlaubtFehler();
}
