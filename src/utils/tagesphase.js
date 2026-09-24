import { toLocalISODate } from "./dates";

// Tagesphase für die Gehirn-Karte (Nutzerinnen-Wunsch 24.09.): morgens in
// den Farben der Morgenroutine, solange sie läuft; tagsüber blau; ab Beginn
// der Abendroutine Nachthimmel mit Sternen — "man geht bald schlafen".
//
// - "nacht": ab Start der Abendroutine (Einstellung abend.startZeit, sonst
//   20:00) oder sobald heute schon ein Abend-Durchlauf gespeichert ist; bis
//   04:00 früh.
// - "morgen": ab 04:00, solange die Morgenroutine heute noch nicht
//   abgeschlossen ist — längstens bis 12:00 (ohne eingerichtete
//   Morgenroutine bis 09:00).
// - "tag": dazwischen.
const NACHT_STANDARD = "20:00";

function minuten(hhmm) {
  if (!/^\d{1,2}:\d{2}/.test(String(hhmm || ""))) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
}

export function tagesphase({ jetzt = new Date(), routineDurchlaeufe = [], routineSchritte = [], routineEinstellungen = {} } = {}) {
  const heute = toLocalISODate(jetzt);
  const min = jetzt.getHours() * 60 + jetzt.getMinutes();
  const heuteGelaufen = (routine) => routineDurchlaeufe.some((d) => d.routine === routine && d.datum === heute && (d.abgeschlossenUm ?? true));

  const abendStart = minuten(routineEinstellungen?.abend?.startZeit) ?? minuten(NACHT_STANDARD);
  if (min < 4 * 60 || min >= abendStart || heuteGelaufen("abend")) return "nacht";

  const hatMorgenroutine = routineSchritte.some((s) => s.routine === "morgen");
  const morgenEnde = hatMorgenroutine ? 12 * 60 : 9 * 60;
  if (min < morgenEnde && !heuteGelaufen("morgen")) return "morgen";
  return "tag";
}
