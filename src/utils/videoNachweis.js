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
export const STATUS_TEXT = { offen: "wartet auf deinen Coach", bestaetigt: "✓ bestätigt", passt_nicht: "passt nicht", abgelaufen: "abgelaufen", besprechen: "📌 zum Besprechen", archiviert: "🗄️ im Archiv" };

// Archiv (27.09.): welche Videos löscht die nächtliche Aufräum-Funktion?
// Gleiche Regel wie in supabase/functions/nachweise-aufraeumen.
export function sollGeloeschtWerden(n, einverstanden, jetzt = new Date()) {
  if (!n.pfad) return false;
  const alt = jetzt - new Date(n.created_at) > LOESCH_TAGE * 86400000;
  if (n.status === "offen") return alt;
  if (n.status !== "besprechen" && n.status !== "archiviert") return false;
  if (einverstanden === false) return true;
  if (n.status === "besprechen") return alt && einverstanden !== true;
  return false;
}

export const ARCHIV_TEXT = {
  besprechen: "📌 zum Besprechen",
  archiviert: "🗄️ im Archiv",
};

export const downloadName = (n, vorname) =>
  `${(vorname || "coachee").replace(/[^\wäöüÄÖÜß-]+/g, "_")}_${String(n.created_at).slice(0, 10)}_${(n.titel || "nachweis").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 40)}.${String(n.pfad || "").endsWith(".mp4") ? "mp4" : "webm"}`;
