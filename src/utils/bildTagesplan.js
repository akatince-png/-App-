// Bild-Tagesplan (27.09., Nutzerinnen-Wunsch nach Marktvergleich: "Tagesplanung
// mit Bildern wie bei Tiimo – Wäschekorb, 30 Minuten"). Reine Logik ohne
// React: welches Bild-Symbol, wie lange, wo steht die Jetzt-Linie.

// Stichwort im Namen → Symbol. Reihenfolge = Vorrang (erstes Treffer-Wort gewinnt).
const STICHWORTE = [
  [/zähne|zaehne|zahnbürste/i, "🪥"],
  [/wäsche|waesche|waschmaschine|bügeln|buegeln/i, "🧺"],
  [/putz|staubsaug|aufräum|aufraeum|sauber/i, "🧹"],
  [/einkauf|supermarkt|besorg/i, "🛒"],
  [/koch|backen|essen vorbereiten|meal ?prep/i, "🍳"],
  [/frühstück|fruehstueck/i, "🥣"],
  [/mittag|abendessen|essen/i, "🍽️"],
  [/dusch|bad\b|baden/i, "🚿"],
  [/anzieh|kleidung/i, "👕"],
  [/wasser|trink/i, "💧"],
  [/licht|sonne|raus|spazier/i, "☀️"],
  [/lauf|jogg|rennen/i, "🏃"],
  [/rad|fahrrad|bike/i, "🚴"],
  [/yoga|dehn|stretch/i, "🧘"],
  [/kraft|hantel|gym|fitness|training|workout|sport/i, "🏋️"],
  [/schwimm/i, "🏊"],
  [/atem|atmen|meditat|achtsam/i, "🌬️"],
  [/lesen|buch/i, "📖"],
  [/lern|stud|kurs/i, "🎓"],
  [/arbeit|büro|buero|meeting|mail|computer|laptop/i, "💻"],
  [/telefon|anruf|anrufen/i, "📞"],
  [/arzt|ärzt|termin beim|therap/i, "🩺"],
  [/termin|besprech/i, "📅"],
  [/kind|kita|schule/i, "🧒"],
  [/hund|gassi|katze|tier/i, "🐕"],
  [/pflanz|garten|gießen|giessen/i, "🪴"],
  [/steuer|rechnung|papier|post|formular|finanz/i, "🧾"],
  [/musik|gitarre|klavier|instrument/i, "🎸"],
  [/freund|treffen|familie|besuch/i, "👥"],
  [/handy|bildschirm|social/i, "📵"],
  [/tagebuch|journal|notiz/i, "📓"],
  [/plan|top ?3|to-?do/i, "📝"],
  [/schlaf|bett|nickerchen/i, "😴"],
  [/müll|muell|abfall/i, "🗑️"],
  [/geschirr|spül|spuel/i, "🍽️"],
];

const KATEGORIE_SYMBOL = {
  hormon: "💊",
  supplement: "🧪",
  mahlzeit: "🍽️",
  training: "🏋️",
  gewohnheit: "🎯",
  workflow: "🗂️",
  zeitblock: "⏱️",
  hydration: "💧",
  tageslicht: "☀️",
  schlaf: "😴",
  atemuebung: "🌬️",
  bildschirmzeit: "📵",
  morgenroutine: "🌅",
  abendroutine: "🌙",
};

export function symbolFuer(item) {
  if (item?.symbol) return item.symbol;
  // Eigenes Symbol einer Gewohnheit (Standard 🌱 zählt nicht als bewusst gewählt).
  if (item?.kategorie === "gewohnheit" && item.raw?.icon && item.raw.icon !== "🌱") return item.raw.icon;
  if (item?.kategorie === "hormon" || item?.kategorie === "supplement") return KATEGORIE_SYMBOL[item.kategorie];
  const name = String(item?.name || "");
  const treffer = STICHWORTE.find(([re]) => re.test(name));
  return treffer ? treffer[1] : KATEGORIE_SYMBOL[item?.kategorie] || "✨";
}

export const zeitInMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export const minZuZeit = (min) => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, "0")}`;

// Wie lange dauert ein Punkt? Eigene Angaben gehen vor, sonst ein sinnvoller Standard.
const STANDARD_DAUER = { hormon: 2, supplement: 2, mahlzeit: 30, training: 45, gewohnheit: 15, workflow: 30, zeitblock: 60 };
export function dauerFuer(item) {
  const r = item?.raw || {};
  const eigen = Number(item?.dauerMin || r.dauerMin || r.dauer_min || r.dauer || r.minuten);
  if (eigen > 0) return Math.round(eigen);
  if (item?.kategorie === "zeitblock") {
    const s = zeitInMin(r.startUhrzeit || item.uhrzeit);
    const e = zeitInMin(r.endUhrzeit);
    if (s != null && e != null && e > s) return e - s;
  }
  return STANDARD_DAUER[item?.kategorie] || 15;
}

export const dauerText = (min) => (min >= 60 ? `${Math.floor(min / 60)} Std.${min % 60 ? ` ${min % 60} Min` : ""}` : `${min} Min`);

// Bausteine für die Zeitleiste: Punkte mit Uhrzeit (sortiert, mit Beginn/Ende,
// "läuft gerade"/"vorbei") + Punkte ohne Uhrzeit ("Irgendwann heute").
// `jetztMin` = Minuten seit Mitternacht, nur für heute (sonst null).
export function planBloecke(items, jetztMin = null) {
  const mitZeit = [];
  const ohneZeit = [];
  for (const item of items || []) {
    const start = zeitInMin(item.uhrzeit);
    const dauer = dauerFuer(item);
    const eintrag = { ...item, symbol: symbolFuer(item), dauer };
    if (start == null) ohneZeit.push(eintrag);
    else mitZeit.push({ ...eintrag, start, ende: start + dauer });
  }
  mitZeit.sort((a, b) => a.start - b.start || a.ende - b.ende);
  for (const b of mitZeit) {
    b.laeuft = jetztMin != null && jetztMin >= b.start && jetztMin < b.ende;
    b.vorbei = jetztMin != null && jetztMin >= b.ende;
    b.jetztAnteil = b.laeuft ? (jetztMin - b.start) / b.dauer : null;
  }
  // Wo steht die Jetzt-Linie, wenn gerade nichts läuft? Vor dem nächsten Punkt.
  let linieVor = null;
  if (jetztMin != null && !mitZeit.some((b) => b.laeuft)) {
    const naechster = mitZeit.find((b) => b.start > jetztMin);
    linieVor = naechster ? naechster.key : "ende";
  }
  return { mitZeit, ohneZeit, linieVor };
}

// Höhe eines Blocks: länger = höher, aber nie winzig oder riesig.
export const blockHoehe = (dauer) => Math.round(Math.min(170, Math.max(62, 44 + dauer * 1.1)));
