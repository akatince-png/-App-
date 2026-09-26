// Messwoche (26.09., Konzept der Nutzerin): Woche 1 des AKA-Coachings wird
// erst gemessen, nicht vorgegeben. Fest ist nur die Aufwachzeit (+ klar-
// kommen, Licht, Wasser); die Morgen- und Abendroutine läuft mit Stoppuhr –
// Hauptuhr ab dem Aufwachen/Start, jeder Schritt einzeln. Sobald ein
// Baustein 3 gültige Messungen hat, schlägt die App feste Zeiten vor
// (Ø + 15 % Puffer, aufgerundet); Coach oder Coachee übernehmen mit einem Tipp.
export const MESS_MINDEST = 3;
export const MESS_PUFFER = 0.15;

export function istMesswoche(stand) {
  return !!stand?.aktiv && stand.etappe?.art === "einfuehrung" && stand.einfuehrungWoche === 1 && !stand.erhaltung;
}

// Tag der Messwoche (1–7) oder null.
export function messTag(stand, heute) {
  if (!istMesswoche(stand)) return null;
  const t = Math.round((new Date(`${heute}T12:00:00`) - new Date(`${stand.etappe.start}T12:00:00`)) / 86400000) + 1;
  return t >= 1 && t <= 7 ? t : null;
}

export const vorschlagMin = (sek) => Math.max(1, Math.ceil((sek * (1 + MESS_PUFFER)) / 60));
const avg = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);

// Auswertung einer Routine über einen Zeitraum aus routine_durchlaeufe
// ({ routine, datum, schritte: [{ schrittId?, name, geplantMin, tatsaechlichSek }], gestartetUm, abgeschlossenUm }).
// Durchläufe über 4 h gelten als ungültig (App offen gelassen).
export function messAuswertung(durchlaeufe = [], routine, von, bis, aktuelleSchritte = []) {
  const liste = durchlaeufe.filter((d) => d.routine === routine && d.datum >= von && d.datum <= bis && d.gestartetUm && d.abgeschlossenUm);
  const gueltig = liste
    .map((d) => ({ ...d, gesamtSek: Math.round((new Date(d.abgeschlossenUm) - new Date(d.gestartetUm)) / 1000) }))
    .filter((d) => d.gesamtSek > 0 && d.gesamtSek < 4 * 3600);
  const proSchritt = new Map();
  for (const d of gueltig) {
    for (const s of d.schritte || []) {
      if (s.tatsaechlichSek == null || s.tatsaechlichSek < 0) continue;
      const key = s.schrittId || s.name;
      if (!proSchritt.has(key)) proSchritt.set(key, { schrittId: s.schrittId || null, name: s.name, werte: [] });
      proSchritt.get(key).werte.push(s.tatsaechlichSek);
    }
  }
  const schritte = [...proSchritt.values()].map((e) => {
    const aktuell = aktuelleSchritte.find((s) => (e.schrittId ? s.id === e.schrittId : s.name === e.name));
    const d = avg(e.werte);
    return {
      schrittId: aktuell?.id || e.schrittId,
      name: e.name,
      anzahl: e.werte.length,
      avgSek: Math.round(d),
      minSek: Math.min(...e.werte),
      maxSek: Math.max(...e.werte),
      geplantMin: aktuell?.dauerMin ?? null,
      vorschlagMin: vorschlagMin(d),
      bereit: e.werte.length >= MESS_MINDEST,
    };
  });
  const gesamt = gueltig.map((d) => d.gesamtSek);
  return {
    routine,
    anzahl: gueltig.length,
    bereit: gueltig.length >= MESS_MINDEST,
    avgGesamtSek: Math.round(avg(gesamt)),
    minGesamtSek: gesamt.length ? Math.min(...gesamt) : null,
    maxGesamtSek: gesamt.length ? Math.max(...gesamt) : null,
    vorschlagGesamtMin: gesamt.length ? vorschlagMin(avg(gesamt)) : null,
    schritte,
  };
}

// Training: Ø Dauer erledigter Einheiten im Zeitraum (Minuten).
export function trainingAuswertung(trainings = [], von, bis) {
  const l = trainings.filter((t) => t.erledigt && t.datum >= von && t.datum <= bis && Number(t.dauerMin ?? t.dauer_min) > 0).map((t) => Number(t.dauerMin ?? t.dauer_min));
  return { anzahl: l.length, avgMin: l.length ? Math.round(avg(l)) : null };
}

export function fmtDauer(sek) {
  if (sek == null) return "–";
  const m = Math.floor(sek / 60);
  const s = Math.round(sek % 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${String(s).padStart(2, "0")} min`;
}
