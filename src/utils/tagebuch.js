// Kontext-Tagebuch (25.09., Vorschau freigegeben): einmal am Tag Stimmung,
// Ort, Personen und optional Essen/Tagesart/Körper — den Rest (Schlaf,
// draußen, Training, Essen, Wasser, Atem, Medikament, Bildschirm) trägt die
// App selbst ein. Ab genug Einträgen: was haben gute Tage gemeinsam?
// Ehrlich als Zusammenhang formuliert, nicht als Beweis.

export const STIMMUNGEN = [
  { wert: 1, emoji: "😣", label: "schwer" },
  { wert: 2, emoji: "😕", label: "eher schwer" },
  { wert: 3, emoji: "😐", label: "mittel" },
  { wert: 4, emoji: "🙂", label: "gut" },
  { wert: 5, emoji: "🤩", label: "richtig gut" },
];
export const stimmungEmoji = (w) => STIMMUNGEN.find((s) => s.wert === Number(w))?.emoji || "";

export const OPTIONEN = {
  orte: ["🏠 Zuhause", "🌳 Natur / draußen", "🏢 Arbeit", "🚗 Unterwegs", "🏋️ Sport", "🛍️ Stadt / Einkaufen"],
  personen: ["Allein", "Partner/in", "Familie", "Kinder", "Freunde", "Kollegen", "Viele Menschen"],
  essen: ["ausgewogen", "viel Zucker", "spät gegessen", "Mahlzeit ausgelassen", "viel Kaffee", "Alkohol"],
  tagesart: ["strukturiert", "chaotisch", "reizüberflutet", "ruhig", "kreativ", "Hyperfokus"],
  koerper: ["müde", "Kopfweh", "Periode", "krank", "Schmerzen", "voller Energie"],
};

function lokalesDatum(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const zaehleErledigt = (map, datum) => Object.entries(map || {}).filter(([k, v]) => v && k.startsWith(`${datum}__`)).length;

// Automatische Tageswerte aus den vorhandenen App-Daten (für einen Tag).
export function autoWerte(datum, d = {}) {
  const auto = {};
  const schlaf = (d.schlafEintraege || []).find((e) => e.datum === datum);
  if (schlaf?.stunden != null) auto.schlafStunden = Number(schlaf.stunden);
  const licht = (d.tageslichtEintraege || []).find((e) => e.datum === datum);
  if (licht) auto.draussenMin = Number(licht.minuten) || 0;
  const wasser = (d.hydrationEintraege || []).filter((e) => e.datum === datum).reduce((s, e) => s + (Number(e.mengeMl) || 0), 0);
  if (wasser) auto.wasserMl = wasser;
  const bild = (d.bildschirmzeitEintraege || []).find((e) => e.datum === datum);
  if (bild) auto.bildschirmMin = Number(bild.minuten) || 0;
  const trainings = d.trainingNachDatum?.get?.(datum) || [];
  if (trainings.length) auto.training = trainings.some((t) => t.erledigt);
  const mahlzeiten = zaehleErledigt(d.mahlzeitErledigt, datum);
  if (mahlzeiten) auto.mahlzeiten = mahlzeiten;
  const medikament = zaehleErledigt(d.hormonErledigt, datum);
  if (medikament) auto.medikament = true;
  const supplemente = zaehleErledigt(d.supplementErledigt, datum);
  if (supplemente) auto.supplemente = supplemente;
  const atem = (d.atemuebungLogs || []).filter((l) => lokalesDatum(l.erstelltAm) === datum).length;
  if (atem) auto.atem = atem;
  return auto;
}

export function autoZeilen(auto = {}) {
  const z = [];
  if (auto.schlafStunden != null) z.push(`😴 Schlaf ${String(auto.schlafStunden).replace(".", ",")} h`);
  if (auto.draussenMin != null) z.push(`☀️ Draußen ${auto.draussenMin} Min.`);
  if (auto.training != null) z.push(`🏋️ Training ${auto.training ? "✓" : "offen"}`);
  if (auto.mahlzeiten) z.push(`🍽 ${auto.mahlzeiten} Mahlzeit${auto.mahlzeiten === 1 ? "" : "en"}`);
  if (auto.wasserMl) z.push(`💧 ${(auto.wasserMl / 1000).toFixed(1).replace(".", ",")} l`);
  if (auto.atem) z.push(`🌬️ Atem ${auto.atem}×`);
  if (auto.medikament) z.push("💊 Medikament ✓");
  if (auto.supplemente) z.push(`🟡 ${auto.supplemente} Supplement${auto.supplemente === 1 ? "" : "e"}`);
  if (auto.bildschirmMin != null) z.push(`📱 Bildschirm ${Math.floor(auto.bildschirmMin / 60)}:${String(auto.bildschirmMin % 60).padStart(2, "0")} h`);
  return z;
}

// Kurzzeile fürs Tagesprotokoll.
export function tagebuchZeile(e) {
  const ohneEmoji = (x) => String(x).replace(/^[^\p{L}\d]+\s/u, "");
  return [stimmungEmoji(e.stimmung), ...[...(e.orte || []), ...(e.personen || []), ...(e.essen || []), ...(e.tagesart || []), ...(e.koerper || [])].map(ohneEmoji)]
    .filter(Boolean)
    .join(" · ");
}

// Merkmale je Eintrag für die Muster-Suche.
const MERKMALE = [
  { key: "draussen30", label: "☀️ Draußen ≥ 30 Min.", test: (e) => (e.auto?.draussenMin ?? -1) >= 30, bekannt: (e) => e.auto?.draussenMin != null },
  { key: "schlaf7", label: "😴 Schlaf ≥ 7 h", test: (e) => (e.auto?.schlafStunden ?? -1) >= 7, bekannt: (e) => e.auto?.schlafStunden != null },
  { key: "training", label: "🏋️ Training gemacht", test: (e) => e.auto?.training === true, bekannt: (e) => e.auto?.training != null },
  { key: "atem", label: "🌬️ Atemübung gemacht", test: (e) => (e.auto?.atem || 0) > 0, bekannt: () => true },
  { key: "medikament", label: "💊 Medikament genommen", test: (e) => !!e.auto?.medikament, bekannt: () => true },
  { key: "wasser", label: "💧 ≥ 1,5 l getrunken", test: (e) => (e.auto?.wasserMl || 0) >= 1500, bekannt: () => true },
  { key: "bildschirm", label: "📱 Bildschirm ≤ 2 h", test: (e) => (e.auto?.bildschirmMin ?? 9999) <= 120, bekannt: (e) => e.auto?.bildschirmMin != null },
];
const auswahlMerkmal = (feld, wert) => ({ key: `${feld}:${wert}`, label: wert, test: (e) => (e[feld] || []).includes(wert), bekannt: () => true });

export const MUSTER_MIN_EINTRAEGE = 14;

// Was unterscheidet gute (4–5) von schweren (1–2) Tagen? Nur Merkmale mit
// deutlichem Unterschied (≥ 30 Prozentpunkte), sortiert nach Unterschied.
export function tagebuchMuster(eintraege) {
  const liste = eintraege || [];
  const gut = liste.filter((e) => e.stimmung >= 4);
  const schwer = liste.filter((e) => e.stimmung <= 2);
  const basis = { anzahl: liste.length, gut: gut.length, schwer: schwer.length, muster: [], bereit: false };
  if (liste.length < MUSTER_MIN_EINTRAEGE || gut.length < 3 || schwer.length < 3) return basis;
  const kandidaten = [...MERKMALE];
  for (const feld of ["orte", "personen", "essen", "tagesart", "koerper"]) {
    const werte = new Set(liste.flatMap((e) => e[feld] || []));
    werte.forEach((w) => kandidaten.push(auswahlMerkmal(feld, w)));
  }
  const muster = [];
  for (const m of kandidaten) {
    const g = gut.filter(m.bekannt);
    const s = schwer.filter(m.bekannt);
    if (g.length < 3 || s.length < 3) continue;
    const gTreffer = g.filter(m.test).length;
    const sTreffer = s.filter(m.test).length;
    const unterschied = gTreffer / g.length - sTreffer / s.length;
    if (Math.abs(unterschied) >= 0.3) muster.push({ key: m.key, label: m.label, gut: gTreffer, gutVon: g.length, schwer: sTreffer, schwerVon: s.length, unterschied, richtung: unterschied > 0 ? "gut" : "schwer" });
  }
  muster.sort((a, b) => Math.abs(b.unterschied) - Math.abs(a.unterschied));
  return { ...basis, muster, bereit: true };
}
