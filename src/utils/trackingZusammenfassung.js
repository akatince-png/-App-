import { toLocalISODate } from "./dates";

// Verdichtet Trackingdaten der letzten N Tage zu einem kompakten Text für
// den ADHS Coach — NICHT die komplette Rohhistorie bei jeder Anfrage,
// sondern aggregierte Werte (Durchschnitte, Trends, Auffälligkeiten), damit
// der Coach bereichsübergreifende Zusammenhänge erkennen kann (z. B.
// "seit weniger getrunken wird, sind auch die Trainingswerte schlechter"),
// ohne bei jeder Nachricht Unmengen an Tokens zu verbrauchen.
//
// Bewusst als reine, provider-unabhängige Funktion gebaut (kein Bezug zu
// Ollama/Groq/Gemini) — nimmt einfach die App-Daten entgegen und liefert
// Text zurück. Funktioniert dadurch unverändert weiter, egal welches
// KI-Modell gerade konfiguriert ist (siehe src/services/aiProviders.js).
//
// @param {object} appData - das Objekt von useAppData() (oder ein Teilobjekt
//   mit denselben Feldnamen)
// @param {{tageZurueck?: number}} optionen - Standard: letzte 21 Tage
// @returns {string}
const STANDARD_TAGE_ZURUECK = 21;

function rund(zahl, stellen = 1) {
  const faktor = 10 ** stellen;
  return Math.round(zahl * faktor) / faktor;
}

function schnitt(werte) {
  if (!werte.length) return null;
  return werte.reduce((summe, w) => summe + w, 0) / werte.length;
}

function alterInJahren(geburtsdatumStr) {
  const geburt = new Date(geburtsdatumStr);
  if (Number.isNaN(geburt.getTime())) return null;
  const heute = new Date();
  let alter = heute.getFullYear() - geburt.getFullYear();
  const geburtstagNochNichtGehabt = heute.getMonth() < geburt.getMonth() || (heute.getMonth() === geburt.getMonth() && heute.getDate() < geburt.getDate());
  if (geburtstagNochNichtGehabt) alter -= 1;
  return alter;
}

function trendRichtung(werte) {
  if (werte.length < 4) return null;
  const mitte = Math.floor(werte.length / 2);
  const ersteHaelfte = schnitt(werte.slice(0, mitte));
  const zweiteHaelfte = schnitt(werte.slice(mitte));
  if (ersteHaelfte === 0) return null;
  const relativeAenderung = (zweiteHaelfte - ersteHaelfte) / ersteHaelfte;
  if (Math.abs(relativeAenderung) < 0.1) return "stabil";
  return relativeAenderung > 0 ? "steigend" : "sinkend";
}

export function trackingZusammenfassung(appData, { tageZurueck = STANDARD_TAGE_ZURUECK } = {}) {
  const grenzeDatum = new Date();
  grenzeDatum.setDate(grenzeDatum.getDate() - tageZurueck);
  const grenzeIso = toLocalISODate(grenzeDatum);
  const grenzeIsoDatetime = grenzeDatum.toISOString();
  const imZeitraum = (datumStr) => typeof datumStr === "string" && datumStr >= grenzeIso;

  const abschnitte = [];

  // Hydration
  const hydrationLogs = (appData.hydrationEintraege || []).filter((e) => imZeitraum(e.datum));
  if (hydrationLogs.length > 0) {
    const werte = hydrationLogs.map((e) => e.mengeMl || 0);
    const trend = trendRichtung(werte);
    abschnitte.push(
      `Hydration: Ø ${rund(schnitt(werte), 0)} ml/Tag über ${hydrationLogs.length} geloggte Tage` +
        (appData.hydrationZielMl ? ` (Ziel: ${appData.hydrationZielMl} ml)` : "") +
        (trend ? `, Trend: ${trend}` : "") +
        "."
    );
  }

  // Training
  const trainingLogs = (appData.trainingEintraege || []).filter((e) => imZeitraum(e.datum));
  if (trainingLogs.length > 0) {
    const rpeWerte = trainingLogs.map((e) => e.rpe).filter((v) => typeof v === "number");
    const schmerzenCount = trainingLogs.filter((e) => e.schmerzen && String(e.schmerzen).trim()).length;
    let zeile = `Training: ${trainingLogs.length} Einheit${trainingLogs.length === 1 ? "" : "en"} in ${tageZurueck} Tagen`;
    if (rpeWerte.length > 0) zeile += `, Ø RPE ${rund(schnitt(rpeWerte))}`;
    if (schmerzenCount > 0) zeile += `, ${schmerzenCount}x Schmerzen erwähnt`;
    abschnitte.push(zeile + ".");
  }

  // Schlaf
  const schlafLogs = (appData.schlafEintraege || []).filter((e) => imZeitraum(e.datum));
  if (schlafLogs.length > 0) {
    const stundenWerte = schlafLogs.map((e) => e.stunden).filter((v) => typeof v === "number");
    const nichtErholtCount = schlafLogs.filter((e) => e.erholt === false).length;
    let zeile = `Schlaf: ${schlafLogs.length} Nächte erfasst`;
    if (stundenWerte.length > 0) zeile += `, Ø ${rund(schnitt(stundenWerte))} Std`;
    if (nichtErholtCount > 0) zeile += `, ${nichtErholtCount}x "nicht erholt" angegeben`;
    abschnitte.push(zeile + ".");
  }

  // Ernährung — die App erfasst aktuell keine täglichen Kalorien/Makros,
  // deshalb Adhärenz (wie oft überhaupt eine Mahlzeit abgehakt wurde) statt
  // Nährwerten.
  const mahlzeitTage = new Set();
  let mahlzeitTreffer = 0;
  Object.entries(appData.mahlzeitErledigtAt || {}).forEach(([key, zeitpunkt]) => {
    if (!zeitpunkt || zeitpunkt < grenzeIsoDatetime) return;
    mahlzeitTage.add(key.split("__")[0]);
    mahlzeitTreffer += 1;
  });
  if (mahlzeitTreffer > 0) {
    abschnitte.push(
      `Ernährung: an ${mahlzeitTage.size} von ${tageZurueck} Tagen mindestens eine Mahlzeit als gegessen markiert (${mahlzeitTreffer} Einträge insgesamt). Kalorien/Makros werden aktuell nicht pro Tag erfasst.`
    );
  }

  // Peptid-Feedback
  const peptidFeedbacks = Object.values(appData.feedback || {}).filter((f) => f?.erledigtAt && f.erledigtAt >= grenzeIsoDatetime);
  if (peptidFeedbacks.length > 0) {
    const nebenwirkungen = [...new Set(peptidFeedbacks.flatMap((f) => f.nebenwirkungen || []).filter(Boolean))];
    abschnitte.push(
      `Peptid-Feedback: ${peptidFeedbacks.length} Rückmeldungen` +
        (nebenwirkungen.length ? `, Nebenwirkungen erwähnt: ${nebenwirkungen.join(", ")}` : "") +
        "."
    );
  }

  // Hormon-/Medikamenten-Feedback
  const hormonFeedbacks = Object.entries(appData.hormonFeedback || {})
    .filter(([key]) => imZeitraum(key.split("__")[0]))
    .map(([, wert]) => wert);
  if (hormonFeedbacks.length > 0) {
    const nebenwirkungen = [...new Set(hormonFeedbacks.flatMap((f) => f.nebenwirkungen || []).filter(Boolean))];
    abschnitte.push(
      `Hormon-/Medikamenten-Feedback: ${hormonFeedbacks.length} Rückmeldungen` +
        (nebenwirkungen.length ? `, Nebenwirkungen erwähnt: ${nebenwirkungen.join(", ")}` : "") +
        "."
    );
  }

  // Check-ins (Gewicht/KFA/Ruhepuls/... — je nachdem, welche Messwerte aktiv sind)
  const checkins = (appData.gewichtsEintraege || []).filter((e) => imZeitraum(e.datum)).sort((a, b) => a.datum.localeCompare(b.datum));
  if (checkins.length > 0) {
    const erster = checkins[0];
    const letzter = checkins[checkins.length - 1];
    const vergleiche = [];
    if (checkins.length > 1) {
      ["gewicht", "kfa", "ruhepuls"].forEach((feld) => {
        const von = erster[feld];
        const bis = letzter[feld];
        if (typeof von === "number" && typeof bis === "number" && von !== bis) {
          const diff = rund(bis - von);
          vergleiche.push(`${feld}: ${von} → ${bis} (${diff > 0 ? "+" : ""}${diff})`);
        }
      });
    }
    abschnitte.push(`Check-ins: ${checkins.length} Messung${checkins.length === 1 ? "" : "en"} erfasst` + (vergleiche.length ? `, Veränderung: ${vergleiche.join(", ")}` : "") + ".");
  }

  // Profil / persönliche Stammdaten — aktueller Stand, nicht auf den
  // Zeitraum begrenzt (ändert sich selten).
  const profil = appData.personalData;
  if (profil && (profil.geschlecht || profil.geburtsdatum || profil.groesse || profil.gewichtStart)) {
    const teile = [];
    if (profil.geschlecht) teile.push(`Geschlecht: ${profil.geschlecht}`);
    if (profil.geburtsdatum) {
      const alter = alterInJahren(profil.geburtsdatum);
      teile.push(`Alter: ${alter != null ? `${alter} Jahre` : profil.geburtsdatum}`);
    }
    if (profil.groesse) teile.push(`Größe: ${profil.groesse} cm`);
    if (profil.gewichtStart) teile.push(`Startgewicht: ${profil.gewichtStart} kg`);
    abschnitte.push(`Profil: ${teile.join(", ")}.`);
  }

  // Blutwerte/Biomarker — aktuellste bekannte Werte (kein zeitlicher Verlauf).
  const blutwerteEintraege = Object.entries(appData.biomarker || {}).filter(([, wert]) => wert !== "" && wert != null);
  if (blutwerteEintraege.length > 0) {
    abschnitte.push(`Blutwerte (aktuellste bekannte Werte): ${blutwerteEintraege.map(([name, wert]) => `${name}: ${wert}`).join(", ")}.`);
  }

  if (abschnitte.length === 0) {
    return `Für die letzten ${tageZurueck} Tage liegen noch keine ausreichenden Trackingdaten vor.`;
  }

  return `Trackingdaten der letzten ${tageZurueck} Tage (Zusammenfassung, keine Rohdaten):\n- ${abschnitte.join("\n- ")}`;
}
