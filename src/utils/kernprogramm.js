// AKA-Kernprogramm (25.09., Vorschau von der Nutzerin freigegeben):
// Coaching läuft in 4-Wochen-Etappen. Etappe 1 = Einführung: die
// Pflicht-Bausteine kommen Woche für Woche dazu (leichte Anker zuerst).
// Danach Erhaltungs-Etappen: nichts Neues, dranbleiben, sonntags ein
// kurzer Wochen-Check. Jede Etappe endet mit einem Coach-Gespräch; der
// Coach startet dann die nächste Etappe (planbar, auch für die Abrechnung).
//
// Grundlage: Studien-Auswertung vom 25.09. (Wissens-Basis "Evidenz:
// Nichtmedikamentöse Verfahren …"): Bewegung ist fest (nur Art/Zeit/
// Häufigkeit wählbar), jeder Baustein hängt an einer echten Alltagsaufgabe,
// Atmung als kurze Vorbereitung/Regulation. Keine Wirkversprechen.
import { plusTage, wochenBeginn } from "./schichtplan";
import { aktuellesGewicht, makroZiele, tagesWerte } from "./essenRechner";

// Ernährungs-Werte je Tag + Eiweißziel in g für die Bilanz (Coachee- und
// Coach-Seite bauen dasselbe aus ihren Daten).
export function ernaehrungFuerBilanz({ essenEintraege = [], mahlzeiten = [], mahlzeitErledigt = {}, categoryZiele = {}, gewichtsEintraege = [], personalData = {} }) {
  const zielE = categoryZiele?.ernaehrung || {};
  const ziel = makroZiele(zielE, aktuellesGewicht(gewichtsEintraege, personalData), zielE.kalorienZiel);
  return {
    ernaehrungAm: (t) => {
      const w = tagesWerte(t, { essenEintraege, mahlzeiten, mahlzeitErledigt });
      return { mahlzeiten: w.anzahl, eiweiss: w.eiweiss };
    },
    eiweissZiel: ziel.eiweiss,
  };
}

export const ETAPPE_TAGE = 28;

// routine: in welche Routine der Baustein als (nicht löschbarer) Schritt
// kommt; null = eigener Bereich (Sport → Trainingsplan, Mahlzeiten → Essen).
export const BAUSTEINE = [
  { key: "wasser", woche: 1, routine: "morgen", icon: "💧", name: "Glas Wasser", dauerMin: 1 },
  { key: "licht", woche: 1, routine: "morgen", icon: "☀️", name: "Tageslicht", dauerMin: 10 },
  { key: "atem_morgen", woche: 1, routine: "morgen", icon: "🌬️", name: "Atemübung (2 Min.)", dauerMin: 2 },
  { key: "tagebuch", woche: 1, routine: "abend", icon: "📓", name: "Tagebuch (30 Sek.)", dauerMin: 1 },
  { key: "schlafenszeit", woche: 1, routine: "abend", icon: "🌙", name: "Ins Bett zur festen Zeit", dauerMin: 1 },
  { key: "aktivierung", woche: 2, routine: "morgen", icon: "🏃", name: "Aktivierung (10 Min.)", dauerMin: 10 },
  { key: "atem_abend", woche: 2, routine: "abend", icon: "🌬️", name: "Ruhige Atmung (5 Min.)", dauerMin: 5 },
  { key: "sport", woche: 2, routine: null, icon: "🏋️", name: "Sport 2–3× pro Woche" },
  { key: "fruehstueck", woche: 3, routine: "morgen", icon: "🍳", name: "Eiweißreiches Frühstück", dauerMin: 15 },
  { key: "top3", woche: 3, routine: "morgen", icon: "📝", name: "Top 3 + 15 Min. Start", dauerMin: 20 },
  { key: "mahlzeiten", woche: 3, routine: null, icon: "🍽️", name: "Regelmäßige Mahlzeiten" },
  { key: "makros", woche: 3, routine: null, icon: "🥚", name: "Eiweißziel (Makros im Blick)" },
  { key: "bildschirm_stopp", woche: 4, routine: "abend", icon: "📱", name: "Bildschirm-Stopp", dauerMin: 1 },
  { key: "plan_morgen", woche: 4, routine: "abend", icon: "🗒️", name: "Plan für morgen", dauerMin: 3 },
];
export const bausteinFuer = (key) => BAUSTEINE.find((b) => b.key === key) || null;
export const schrittName = (b) => `${b.icon} ${b.name}`;

export const WOCHEN = {
  1: { titel: "Messwoche + Anker", icon: "📏", text: "Feste Aufwachzeit, dann Glas Wasser, Tageslicht und 2 Min. Atmen. Morgen- und Abendroutine laufen mit Stoppuhr – wir messen, wie lange du wirklich brauchst. Abends Tagebuch und feste Schlafenszeit." },
  2: { titel: "Bewegung", icon: "🏃", text: "Neu: 10 Min. Aktivierung am Morgen, ruhige Atmung am Abend, Sport 2–3× pro Woche." },
  3: { titel: "Essen + Planen", icon: "🍳", text: "Neu: eiweißreiches Frühstück, Top 3 des Tages mit 15 Min. Start, regelmäßige Mahlzeiten und dein Eiweißziel (Eiweiß, Fett, Kohlenhydrate im Blick)." },
  4: { titel: "Abend + Bilanz", icon: "🌙", text: "Neu: Bildschirm-Stopp und Plan für morgen. Am Ende: Gespräch mit deinem Coach." },
};

export const SPORTARTEN = [
  { label: "Kraft", icon: "💪", art: "Krafttraining" },
  { label: "Kampfsport", icon: "🥊", art: "Sonstiges" },
  { label: "Laufen", icon: "🏃", art: "Cardio" },
  { label: "Tanzen", icon: "💃", art: "Sonstiges" },
  { label: "Klettern", icon: "🧗", art: "Sonstiges" },
  { label: "Ballsport", icon: "⚽", art: "Sonstiges" },
  { label: "Rad", icon: "🚴", art: "Cardio" },
  { label: "Schwimmen", icon: "🏊", art: "Cardio" },
];

export const STOERUNGEN = ["Zu spät dran", "Vergessen", "Keine Lust", "Besuch / Termine", "Uhrzeit passt nicht", "Krank / erschöpft"];
export const AENDERUNGEN = ["30 Min. früher erinnern", "Uhrzeit ändern", "Kürzer machen", "Mit etwas verknüpfen, das ich sowieso tue", "Mit dem Coach besprechen"];

export function zeileZuEtappe(r) {
  return { id: r.id, userId: r.user_id, nummer: r.nummer, art: r.art, start: r.start, ende: r.ende, status: r.status, gespraechAm: r.gespraech_am || null, gespraechNotiz: r.gespraech_notiz || "" };
}
export function zeileZuPause(r) {
  return { id: r.id, userId: r.user_id, kernKey: r.kern_key, von: r.von, bis: r.bis, begruendung: r.begruendung };
}

const tageZwischen = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

// Wo steht die Person heute? Maßgeblich ist die neueste Etappe, die schon
// begonnen hat (bzw. die nächste geplante, falls noch keine läuft).
export function programmStand(etappen, heute) {
  const liste = [...(etappen || [])].filter((e) => e.status !== "beendet").sort((a, b) => a.nummer - b.nummer);
  if (!liste.length) return { aktiv: false, etappe: null };
  const begonnen = liste.filter((e) => e.start <= heute);
  if (!begonnen.length) return { aktiv: false, geplant: liste[0], etappe: null };
  const etappe = begonnen[begonnen.length - 1];
  const tag = tageZwischen(etappe.start, heute);
  const woche = Math.min(4, Math.floor(tag / 7) + 1);
  const nachEnde = heute > etappe.ende;
  const einfuehrungFertig = etappe.art === "erhaltung" || liste.some((e) => e.art === "erhaltung" && e.start <= heute) || nachEnde || etappe.nummer > 1;
  // Einführungswoche: bestimmt, welche Bausteine schon dran sind.
  const einfuehrungWoche = etappe.art === "einfuehrung" && !einfuehrungFertig ? woche : 4;
  return {
    aktiv: true,
    etappe,
    woche,
    gesamtWoche: (etappe.nummer - 1) * 4 + woche,
    einfuehrungWoche,
    erhaltung: etappe.art === "erhaltung" || nachEnde,
    gespraechFaellig: tageZwischen(heute, etappe.ende) <= 2 && etappe.status === "laufend" && !liste.some((e) => e.nummer > etappe.nummer),
    nachEnde,
    naechste: liste.find((e) => e.nummer > etappe.nummer) || null,
  };
}

export function faelligeBausteine(stand) {
  if (!stand?.aktiv) return [];
  return BAUSTEINE.filter((b) => b.woche <= stand.einfuehrungWoche);
}

export function pauseFuer(pausen, key, datum) {
  return (pausen || []).find((p) => p.kernKey === key && p.von <= datum && p.bis >= datum) || null;
}

// Seit wann gilt ein Baustein (Tag, an dem seine Einführungswoche begann)?
export function bausteinSeit(etappen, key) {
  const b = bausteinFuer(key);
  const erste = [...(etappen || [])].sort((a, c) => a.nummer - c.nummer)[0];
  if (!b || !erste) return null;
  return erste.art === "einfuehrung" ? plusTage(erste.start, (b.woche - 1) * 7) : erste.start;
}

// Bilanz je Baustein über [von..bis]. Tage vor dem Start eines Bausteins,
// pausierte Tage und der heutige Tag (solange noch offen) zählen nicht.
export function kernBilanz(d, von, bis, heute) {
  const {
    etappen = [],
    pausen = [],
    schritte = [],
    schrittErledigt = {},
    durchlaeufe = [],
    trainings = [],
    trainingWochenplan = [],
    mahlzeitErledigt = {},
    // Ernährung (25.09.): je Tag Anzahl Mahlzeiten/Einträge + Eiweiß in g.
    ernaehrungAm = null,
    eiweissZiel = null,
  } = d;
  const stand = programmStand(etappen, bis);
  const tage = [];
  for (let t = von; t <= bis; t = plusTage(t, 1)) tage.push(t);
  return faelligeBausteine(stand).map((b) => {
    const seit = bausteinSeit(etappen, b.key) || von;
    const aktiveTage = tage.filter((t) => t >= seit && !pauseFuer(pausen, b.key, t));
    const pausiert = pauseFuer(pausen, b.key, heute);
    if (b.key === "sport") {
      const proWoche = Math.max(2, trainingWochenplan.length);
      const von_ = Math.round((proWoche * aktiveTage.length) / 7);
      const erledigt = trainings.filter((s) => s.erledigt && aktiveTage.includes(s.datum)).length;
      return { ...b, erledigt: Math.min(erledigt, von_), von: von_, pausiert };
    }
    if (b.key === "mahlzeiten") {
      const zaehlt = (t) => (ernaehrungAm ? ernaehrungAm(t).mahlzeiten : Object.entries(mahlzeitErledigt).filter(([k, v]) => v && k.startsWith(`${t}__`)).length) >= 2;
      const relevant = aktiveTage.filter((t) => t < heute || zaehlt(t));
      return { ...b, erledigt: relevant.filter(zaehlt).length, von: relevant.length, pausiert };
    }
    if (b.key === "makros") {
      // Geschafft = mind. 90 % des Eiweißziels (ohne Ziel: überhaupt eingetragen).
      const zaehlt = (t) => {
        const w = ernaehrungAm ? ernaehrungAm(t) : { mahlzeiten: 0, eiweiss: 0 };
        return eiweissZiel ? w.eiweiss >= eiweissZiel * 0.9 : w.mahlzeiten > 0;
      };
      const relevant = aktiveTage.filter((t) => t < heute || zaehlt(t));
      return { ...b, erledigt: relevant.filter(zaehlt).length, von: relevant.length, pausiert };
    }
    const schritt = schritte.find((s) => s.kernKey === b.key);
    const erledigtAm = (t) => !!schritt && (!!schrittErledigt[`${t}__${schritt.id}`] || durchlaeufe.some((x) => x.routine === b.routine && x.datum === t));
    const relevant = aktiveTage.filter((t) => t < heute || erledigtAm(t));
    return { ...b, erledigt: relevant.filter(erledigtAm).length, von: relevant.length, pausiert };
  });
}

export const quote = (x) => (x.von ? x.erledigt / x.von : 1);
export const wackelt = (x) => x.von >= 3 && quote(x) < 0.6;
export const ampel = (x) => (!x.von ? "grau" : quote(x) >= 0.8 ? "gruen" : quote(x) >= 0.6 ? "gelb" : "rot");

export function schwaechsterBaustein(bilanz) {
  return [...(bilanz || [])].filter((x) => x.von >= 3 && !x.pausiert).sort((a, b) => quote(a) - quote(b))[0] || null;
}

// Bausteine, die zwei Wochen hintereinander wackeln (Zeichen für den Coach).
export function wackelnZweiWochen(bilanzJetzt, bilanzVorher) {
  return (bilanzJetzt || []).filter((x) => wackelt(x) && (bilanzVorher || []).some((y) => y.key === x.key && wackelt(y)));
}

// Wochen-Check in der Erhaltung: sonntags für die laufende Woche, montags/
// dienstags noch nachholbar für die Vorwoche.
export function wochenCheckWoche(stand, heute, checks) {
  if (!stand?.aktiv || !stand.erhaltung) return null;
  const wt = new Date(`${heute}T12:00:00`).getDay();
  let ws = null;
  if (wt === 0) ws = wochenBeginn(heute);
  else if (wt === 1 || wt === 2) ws = plusTage(wochenBeginn(heute), -7);
  if (!ws || ws < stand.etappe.start) return null;
  return (checks || []).some((c) => c.wocheStart === ws) ? null : ws;
}

// Nächste Etappe nach einem Gespräch: beginnt am Tag nach dem Ende der
// letzten (oder am nächsten Montag, falls das schon vorbei ist).
export function naechsteEtappeVorschlag(etappen, heute, art = "erhaltung") {
  const letzte = [...(etappen || [])].sort((a, b) => b.nummer - a.nummer)[0];
  let start = letzte ? plusTage(letzte.ende, 1) : naechsterMontag(heute);
  if (start < heute) start = naechsterMontag(heute);
  return { nummer: (letzte?.nummer || 0) + 1, art: letzte ? art : "einfuehrung", start, ende: plusTage(start, ETAPPE_TAGE - 1) };
}

export function naechsterMontag(heute) {
  const ws = wochenBeginn(heute);
  return ws === heute ? heute : plusTage(ws, 7);
}

export const ETAPPEN_NAME = { einfuehrung: "Einführung", erhaltung: "Erhaltung" };
export const datumKurz = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }) : "");

// Bilanz direkt aus den App-Daten (Coachee-Seite; die Coach-Seite baut
// dasselbe Objekt aus den Tabellen der jeweiligen Person).
export function bilanzAusAppData(a, von, bis, heute) {
  return kernBilanz(
    {
      etappen: a.kernEtappen,
      pausen: a.routineKernPausen,
      schritte: a.routineSchritteAlle,
      schrittErledigt: a.routineSchrittErledigt,
      durchlaeufe: a.routineDurchlaeufe,
      trainings: a.trainingEintraege,
      trainingWochenplan: a.trainingWochenplan,
      mahlzeitErledigt: a.mahlzeitErledigt,
      ...ernaehrungFuerBilanz(a),
    },
    von,
    bis,
    heute
  );
}

// Kurzstatus je Person für die eingeklappte Zeile.
export function kernKurztext(etappen, heute) {
  const s = programmStand(etappen, heute);
  if (!s.aktiv) return s.geplant ? `🧭 startet ${datumKurz(s.geplant.start)}` : null;
  if (s.gespraechFaellig) return "💬 Etappen-Gespräch fällig";
  return s.erhaltung ? `🧭 Erhaltung · W${s.gesamtWoche}` : `🧭 Einführung · W${s.woche}/4`;
}
