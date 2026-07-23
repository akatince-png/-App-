import { buildDayItems, KATEGORIE_META } from "./dayItems";
import { describeInterval, activeDoseDays } from "./schedule";
import { addDays, fmtDate, toLocalISODate } from "./dates";

const WOCHENTAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// "Automatisch" heißt hier realistisch: beim nächsten App-Öffnen nach
// Ablauf der ersten 7 Tage seit Protokoll-Start — es gibt keine
// serverseitige Cron-Infrastruktur in dieser App.
export function wochenprotokollFaellig({ startdatum, wochenprotokollSnapshots }) {
  if (!startdatum) return false;
  const tageSeitStart = Math.floor((new Date() - new Date(startdatum)) / (1000 * 60 * 60 * 24));
  if (tageSeitStart < 7) return false;
  return !wochenprotokollSnapshots.some((s) => s.wochenNummer === 1);
}

const WICHTIGE_HINWEISE = [
  "Injektionen unter aseptischen Bedingungen durchführen.",
  "Bei Unwohlsein oder Nebenwirkungen ärztlichen Rat einholen.",
  "Ausreichend schlafen und Stress reduzieren.",
  "Fortschritt regelmäßig mit Biomarkern überprüfen.",
];

// Baut den einmaligen Snapshot-Inhalt für das "Erste-Woche-Protokoll" —
// dieselben Berechnungen wie WochenuebersichtView.jsx (describeInterval,
// activeDoseDays, buildDayItems), aber als fester Schnappschuss statt
// live neu berechnet.
export function baueWochenprotokollDaten(appData) {
  const {
    peptide = [],
    dosierung = {},
    hormone = [],
    hormonDosierung = {},
    startdatum,
    dauer,
    ziele = [],
    notizen = "",
    plan = [],
    erledigt = {},
    hormonPlan = [],
    hormonErledigt = {},
    categoryZiele = {},
    hydrationZielMl,
  } = appData;

  const substanzen = [
    ...peptide.map((name) => ({ name, kategorie: "Peptid", d: dosierung[name] })),
    ...hormone.map((name) => ({ name, kategorie: "Medikament", d: hormonDosierung[name] })),
  ].filter((s) => s.d);

  const dauerTage = Math.max(1, Math.round((Number(dauer) || 12) * 7));
  const startDatumObj = startdatum ? new Date(startdatum) : new Date();
  const endDatumObj = addDays(startDatumObj, dauerTage - 1);

  const substanzenStatistik = substanzen.map((s) => ({
    name: s.name,
    kategorie: s.kategorie,
    intervall: describeInterval(s.d),
    anzahl: activeDoseDays(s.d, startdatum, dauerTage).length,
    menge: s.d.menge || "",
  }));

  const gesamt = plan.length + hormonPlan.length;
  const erledigtCount =
    plan.filter((d) => erledigt[`${toLocalISODate(d.date)}__${d.peptid}__${d.uhrzeit}`]).length +
    hormonPlan.filter((d) => hormonErledigt[`${toLocalISODate(d.date)}__${d.name}__${d.uhrzeit}`]).length;
  const compliance = gesamt > 0 ? Math.round((erledigtCount / gesamt) * 100) : null;

  const montag = addDays(startDatumObj, -((startDatumObj.getDay() + 6) % 7));
  const wochenplan = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(montag, i);
    return {
      wochentag: WOCHENTAG_KURZ[i],
      datum: fmtDate(d),
      items: buildDayItems(d, appData).map((item) => ({
        name: item.name,
        uhrzeit: item.uhrzeit,
        detail: item.detail,
        kategorie: item.kategorie,
        farbe: KATEGORIE_META[item.kategorie]?.dot,
      })),
    };
  });

  const routinenZiele = [
    categoryZiele?.schlaf?.bettzeit && { icon: "😴", label: "Schlaf", ziel: `${categoryZiele.schlaf.bettzeit}–${categoryZiele.schlaf.aufwachzeit || "?"}` },
    hydrationZielMl && { icon: "💧", label: "Hydration", ziel: `Ø ${hydrationZielMl} ml/Tag` },
    categoryZiele?.training?.proWoche && { icon: "🏋️", label: "Training", ziel: `${categoryZiele.training.proWoche}× pro Woche` },
  ].filter(Boolean);

  return {
    seite1: {
      name: peptide[0] || hormone[0] || "Dein Protokoll",
      ziele,
      dauerWochen: dauer || "–",
      startdatum: fmtDate(startDatumObj),
      enddatum: fmtDate(endDatumObj),
      notizen,
    },
    seite2: { wochenplan },
    seite3: { substanzen: substanzenStatistik, compliance },
    seite4: { hinweise: WICHTIGE_HINWEISE, routinenZiele },
  };
}
