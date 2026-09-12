// Rechtzeitigkeits-Prüfung fürs Belohnungsfenster (Nutzerin-Vorgabe, 12.09.):
// eine Belohnung gibt's nur, wenn die entscheidende Aktion nicht später als
// [Puffer] Minuten nach der geplanten Uhrzeit passiert. Für Aktionen mit
// echtem Start/Ende-Verlauf (Training, Morgen-/Abendroutine) zählt dafür
// der START, nicht das Ende — einmal rechtzeitig gestartet, darf die
// Erledigung selbst beliebig lange dauern ("Zeiten-Flexibilität" laut
// Nutzerin). Für einfache Ja/Nein-Erledigungen (Medikamente, Supplemente)
// ist die Erledigung selbst die einzige Aktion, die geprüft wird.
//
// Kein geplanter Zeitpunkt vorhanden (leere/keine Uhrzeit) heißt: nichts,
// wogegen "zu spät" gemessen werden könnte — zählt immer als rechtzeitig,
// die Belohnung entfällt in diesem Fall NICHT.
export function istRechtzeitig(geplanteUhrzeit, pufferMin, jetzt = new Date()) {
  if (!geplanteUhrzeit) return true;
  const teile = String(geplanteUhrzeit).match(/^(\d{1,2}):(\d{2})/);
  if (!teile) return true;
  const stunde = Number(teile[1]);
  const minute = Number(teile[2]);
  if (Number.isNaN(stunde) || Number.isNaN(minute)) return true;
  const geplant = new Date(jetzt);
  geplant.setHours(stunde, minute, 0, 0);
  const puffer = Math.max(0, Number(pufferMin) || 0);
  const spaetesteZeit = geplant.getTime() + puffer * 60000;
  return jetzt.getTime() <= spaetesteZeit;
}
