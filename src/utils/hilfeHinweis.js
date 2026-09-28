// Hilfe-Hinweis (28.09., Nutzerin): AKA ist eine Lifestyle-App ohne
// Notrufnummern in normalen Texten (UEBERGABEPROTOKOLL, Philosophie 6b).
// Äußert aber jemand DIREKT in der App Suizidgedanken, muss die App die
// richtigen Hilfen anbieten. Bewusst nur eindeutige Formulierungen,
// damit „Ich sterbe vor Hunger“ o. Ä. nichts auslöst.
const MUSTER = [
  /suizid/i,
  /selbstmord/i,
  /\bumbringen\b.*\bmich\b|\bmich\b.*\bumbringen\b/i,
  /\bmich\s+(selbst\s+)?(töten|toeten)\b/i,
  /(mir|mein)\s+(das\s+)?leben\s+(zu\s+)?nehmen/i,
  /\bnicht\s+mehr\s+leben\s+(will|möchte|moechte|wollen)\b|\b(will|möchte|moechte)\s+nicht\s+mehr\s+leben\b/i,
  /\b(will|möchte|moechte)\s+(ich\s+)?(einfach\s+|lieber\s+|nur\s+noch\s+)?sterben\b/i,
  /\bwill\s+tot\s+sein\b|\bwäre\s+lieber\s+tot\b|\bwaere\s+lieber\s+tot\b/i,
  /\britze\s+mich\b|\bmich\s+(zu\s+)?ritzen\b|\bselbstverletz/i,
];

export function brauchtHilfeHinweis(text) {
  if (!text || typeof text !== "string" || text.length < 5) return false;
  return MUSTER.some((m) => m.test(text));
}

export const HILFE_TEXT = {
  titel: "Du musst da nicht allein durch",
  text: "Wenn du gerade daran denkst, dir etwas anzutun, sprich bitte jetzt mit jemandem. Die TelefonSeelsorge ist kostenlos, anonym und rund um die Uhr erreichbar.",
  nummern: [
    ["TelefonSeelsorge", "0800 111 0 111"],
    ["TelefonSeelsorge", "0800 111 0 222"],
    ["In akuter Gefahr: Notruf", "112"],
  ],
  zusatz: "Dein Coach ist für dich da, kann eine solche Hilfe aber nicht ersetzen.",
};
