// Dosis-Einheit (UX-Review 23.09.): "Menge" ist bewusst ein Freitextfeld
// ("0,25 mg", "2 Hübe", "1 Tablette"), dadurch ließ sich aber auch eine
// nackte Zahl wie "250" speichern — bei Peptiden/Medikamenten ist das
// gefährlich mehrdeutig (mcg oder mg = Faktor 1000). Erkannt wird nur der
// eindeutige Fall "nur eine Zahl"; alles mit irgendeinem Wort dahinter gilt
// als bereits mit Einheit versehen.
export const MENGE_EINHEITEN = ["mcg", "mg", "g", "IE", "ml", "Tablette", "Tropfen", "Hub"];

export function mengeOhneEinheit(menge) {
  return /^\s*\d+(?:[.,]\d+)?\s*$/.test(menge || "");
}

export function mengeMitEinheit(menge, einheit) {
  return `${(menge || "").trim()} ${einheit}`;
}
