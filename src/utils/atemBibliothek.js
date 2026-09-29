// Atem-Übungen mit "wofür" (25.09., Nutzerinnen-Freigabe der Vorschau).
// Jede Übung ist eine Folge von Phasen, die sich wiederholt, bis die Dauer
// erreicht ist. `sprache` = kurzer Satz, den Aka beim Phasenbeginn sagt.
// Bewusst ohne Heils- oder Wirkversprechen: "wofür" beschreibt, wofür
// Menschen die Übung nutzen.
export const ATEM_BIBLIOTHEK = [
  {
    key: "seufzer",
    name: "Seufzer-Atmung",
    icon: "😮‍💨",
    wofuer: "Runterkommen, Stimmung heben",
    beschreibung: "2× kurz durch die Nase ein, dann lang durch den Mund aus",
    dauerMinuten: 3,
    farbe: "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-karte))",
    phasen: [
      { art: "ein", sek: 2, sprache: "Einatmen" },
      { art: "ein", sek: 1, sprache: "Noch ein Stück" },
      { art: "aus", sek: 6, sprache: "Lang ausatmen" },
    ],
  },
  {
    key: "box",
    name: "Box-Atmung",
    icon: "⬜",
    wofuer: "Stress, vor Terminen",
    beschreibung: "4 ein · 4 halten · 4 aus · 4 halten",
    dauerMinuten: 4,
    farbe: "color-mix(in srgb, #EEF4FF var(--mp-flaeche), var(--mp-karte))",
    phasen: [
      { art: "ein", sek: 4, sprache: "Einatmen" },
      { art: "halten", sek: 4, sprache: "Halten" },
      { art: "aus", sek: 4, sprache: "Ausatmen" },
      { art: "halten", sek: 4, sprache: "Halten" },
    ],
  },
  {
    key: "gleichmaessig",
    name: "Gleichmäßig atmen",
    icon: "〰️",
    wofuer: "Ausgleich, vor dem Schlafen",
    beschreibung: "5,5 Sek. ein · 5,5 Sek. aus",
    dauerMinuten: 5,
    farbe: "color-mix(in srgb, #F3EEFF var(--mp-flaeche), var(--mp-karte))",
    phasen: [
      { art: "ein", sek: 5.5, sprache: "Einatmen" },
      { art: "aus", sek: 5.5, sprache: "Ausatmen" },
    ],
  },
  {
    key: "energie",
    name: "Energie-Atmung",
    icon: "⚡",
    wofuer: "Wach werden",
    beschreibung: "Zügig ein, locker aus",
    dauerMinuten: 2,
    farbe: "color-mix(in srgb, #FFF1D6 var(--mp-flaeche), var(--mp-karte))",
    hinweis: "Nur im Sitzen oder Liegen, nie im Wasser oder am Steuer. Bei Schwindel aufhören und normal weiteratmen.",
    phasen: [
      { art: "ein", sek: 2, sprache: "Kräftig ein" },
      { art: "aus", sek: 2, sprache: "Locker aus" },
    ],
  },
  {
    key: "ruhig",
    name: "Ruhig werden",
    icon: "🌬️",
    wofuer: "Kurz sammeln, zwischendurch",
    beschreibung: "4 ein · 4 halten · 6 aus",
    dauerMinuten: 3,
    farbe: "color-mix(in srgb, #E6F5EC var(--mp-flaeche), var(--mp-karte))",
    phasen: [
      { art: "ein", sek: 4, sprache: "Einatmen" },
      { art: "halten", sek: 4, sprache: "Halten" },
      { art: "aus", sek: 6, sprache: "Ausatmen" },
    ],
  },
  {
    // Feste Übung für den Routine-Schritt „Atemübung (2 Min.)“ in der
    // Morgenroutine (29.09., Nutzerin: „fest eingestellte zweiminütige
    // Atemübung … abgespeichert, um die KI nicht zu belasten“). Ruhig genug
    // für direkt nach dem Aufstehen, mit kurzem Halten.
    key: "morgen",
    name: "Guten-Morgen-Atmung",
    icon: "🌅",
    wofuer: "Sanft in den Tag starten",
    beschreibung: "4 Sek. ein · 2 halten · 4 aus",
    dauerMinuten: 2,
    farbe: "color-mix(in srgb, #FFF4E5 var(--mp-flaeche), var(--mp-karte))",
    phasen: [
      { art: "ein", sek: 4, sprache: "Tief einatmen" },
      { art: "halten", sek: 2, sprache: "Kurz halten" },
      { art: "aus", sek: 4, sprache: "Ausatmen" },
    ],
  },
];

export const ATEM_KEY_EIGEN = "eigen:";
// Von Home aus direkt eine Übung starten (sessionStorage, einmalig).
export const ATEM_START_KEY = "atemStart";
// Aus einem Routine-Schritt gestartet (sessionStorage, einmalig): nach der
// Übung wird der Schritt automatisch abgehakt.
export const ATEM_ROUTINE_KEY = "atemRoutineSchritt";

// Welche feste Übung gehört zu einem Routine-Schritt? Kernprogramm-
// Bausteine fest zugeordnet, sonst jeder Schritt mit „Atem“ im Namen:
// morgens die Guten-Morgen-Atmung, abends „Gleichmäßig atmen“. Dauer aus
// dem Namen („(5 Min.)“), sonst die der Übung. null = kein Atem-Schritt.
export function atemFuerRoutineSchritt(schritt, routine) {
  if (!schritt) return null;
  const name = String(schritt.name || "");
  const kern = { atem_morgen: "morgen", atem_abend: "gleichmaessig" }[schritt.kernKey];
  if (!kern && !/atem|atmung|atmen/i.test(name)) return null;
  const key = kern || (routine === "abend" ? "gleichmaessig" : "morgen");
  const u = bibliotheksUebung(key);
  const minuten = Number(name.match(/(\d+)\s*Min/i)?.[1]) || u.dauerMinuten;
  return { key, dauerMinuten: minuten };
}

export function bibliotheksUebung(key) {
  return ATEM_BIBLIOTHEK.find((u) => u.key === key) || null;
}

// Eigene Übung (atemuebungen-Zeile) → Phasen.
export function phasenAusEigener(u) {
  const p = [{ art: "ein", sek: Number(u.einatmenSek) || 4, sprache: "Einatmen" }];
  if (Number(u.haltenSek) > 0) p.push({ art: "halten", sek: Number(u.haltenSek), sprache: "Halten" });
  p.push({ art: "aus", sek: Number(u.ausatmenSek) || 6, sprache: "Ausatmen" });
  return p;
}

// Schlüssel (Bibliothek oder "eigen:<id>") → vollständige Übung.
export function uebungFuerKey(key, eigene = []) {
  const b = bibliotheksUebung(key);
  if (b) return b;
  if (key?.startsWith(ATEM_KEY_EIGEN)) {
    const e = eigene.find((x) => x.id === key.slice(ATEM_KEY_EIGEN.length));
    if (e) return { key, name: e.name, icon: e.icon || "🌬️", wofuer: "Eigene Übung", dauerMinuten: e.dauerMinuten || 3, phasen: phasenAusEigener(e), id: e.id };
  }
  return null;
}

// Wo im Takt ist man nach `ms` Millisekunden? Für die Gruppen-Session, in
// der alle ab derselben Startzeit im selben Takt atmen.
export function taktPosition(phasen, ms) {
  const zyklus = phasen.reduce((s, p) => s + p.sek * 1000, 0);
  let rest = ((ms % zyklus) + zyklus) % zyklus;
  for (let i = 0; i < phasen.length; i++) {
    const d = phasen[i].sek * 1000;
    if (rest < d) return { index: i, phase: phasen[i], vergangenMs: rest, dauerMs: d, runde: Math.floor(ms / zyklus) + 1 };
    rest -= d;
  }
  return { index: 0, phase: phasen[0], vergangenMs: 0, dauerMs: phasen[0].sek * 1000, runde: 1 };
}

// Stimmung vorher/nachher (4 Stufen, als Text gespeichert).
export const ATEM_GEFUEHLE = [
  { wert: "1", emoji: "😣", label: "angespannt" },
  { wert: "2", emoji: "😐", label: "neutral" },
  { wert: "3", emoji: "🙂", label: "gut" },
  { wert: "4", emoji: "😌", label: "ruhig" },
];
export function gefuehlEmoji(wert) {
  const alt = { besser: "😊", gleich: "😐", schlechter: "😞" };
  return ATEM_GEFUEHLE.find((g) => g.wert === wert)?.emoji || alt[wert] || "";
}

// Welche festen Atem-Zeiten sind heute schon erledigt? Einfach und
// robust: die ersten n Zeiten (nach Uhrzeit) gelten als erledigt, wenn es
// heute n Atem-Logs gibt.
export function atemZeitenHeute(zeiten, logs, heute = new Date()) {
  const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}-${String(heute.getDate()).padStart(2, "0")}`;
  const anzahl = (logs || []).filter((l) => {
    const d = new Date(l.erstelltAm);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === tag;
  }).length;
  return (zeiten || [])
    .filter((z) => z.aktiv !== false)
    .slice()
    .sort((a, b) => (a.uhrzeit < b.uhrzeit ? -1 : 1))
    .map((z, i) => ({ ...z, erledigt: i < anzahl }));
}
