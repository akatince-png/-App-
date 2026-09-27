// Video-Nachweise (27.09.): kleine Helfer ohne Browser-/Netz-Abhängigkeit.

export const COUNTDOWN_SEK = 5;
export const MAX_SEK = 20;
export const LOESCH_TAGE = 7;

// Bestes vom Browser unterstütztes Aufnahme-Format (klein, weit verbreitet).
export function aufnahmeFormat(istUnterstuetzt) {
  const kandidaten = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  return kandidaten.find((m) => istUnterstuetzt?.(m)) || "";
}

export const dateiEndung = (mime) => (String(mime).startsWith("video/mp4") ? "mp4" : "webm");
export const grundTyp = (mime) => String(mime || "video/webm").split(";")[0];

export const nachweisPfad = (userId, id, mime) => `${userId}/${id}.${dateiEndung(mime)}`;

// Wie viele Tage bleibt ein unbestätigtes Video noch?
export function restTage(erstelltAm, jetzt = new Date()) {
  const alter = (jetzt - new Date(erstelltAm)) / 86400000;
  return Math.max(0, Math.ceil(LOESCH_TAGE - alter));
}

export const ART_TEXT = { training: "🏋️ Training", quest: "🎯 Quest", gruppe: "👥 Gruppenprotokoll" };
export const STATUS_TEXT = { offen: "wartet auf deinen Coach", bestaetigt: "✓ bestätigt", passt_nicht: "passt nicht", abgelaufen: "abgelaufen" };
