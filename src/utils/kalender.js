import { toLocalISODate } from "./dates";
import { KATEGORIE_META, ROUTINE_META } from "./dayItems";

// Kalender „Mein Alltag“ (28.09., Vorschau, Nutzerin: Stundenplan, Woche,
// Monat – Haushalt, Arbeit, Hobbys usw. im selben Plan wie Routinen und
// Bausteine). Freischaltung nach den 8 Wochen als eigenes Programm, Handy-
// Kalender erst später. Hier nur reine Logik: aus den Tagesplan-Einträgen
// (buildDayItems), den Routinen-Zeitfenstern und den Alltags-Einträgen
// werden Blöcke mit Anfang und Ende für Tag/Woche/Monat.

export const ALLTAG_BEREICHE = {
  arbeit: { label: "Arbeit", icon: "💼", bg: "color-mix(in srgb, #E3E8F4 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #26345C var(--mp-schrift), var(--mp-schrift-hell))", dot: "#3F5BA9" },
  haushalt: { label: "Haushalt", icon: "🧹", bg: "color-mix(in srgb, #F3EADF var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #6B4A22 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#B7843E" },
  hobby: { label: "Hobby", icon: "🎨", bg: "color-mix(in srgb, #F6E3F1 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #7A2767 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#C04BA6" },
  metime: { label: "Me-Time", icon: "🛁", bg: "color-mix(in srgb, #E6F3F8 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #155A70 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#2A9BBF" },
  termin: { label: "Termin", icon: "📅", bg: "color-mix(in srgb, #FDE9E4 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #8C2F1C var(--mp-schrift), var(--mp-schrift-hell))", dot: "#E0613F" },
  sozial: { label: "Freunde & Familie", icon: "👥", bg: "color-mix(in srgb, #E4F4EA var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #1F5E38 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#3A9A62" },
};

// Farben für eigene Bereiche (Person oder Coach legt sie an).
const EIGENE_FARBEN = [
  { bg: "color-mix(in srgb, #EFE7FB var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #4B2A86 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#7A4FD1" },
  { bg: "color-mix(in srgb, #FFF1D6 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #7A5200 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#D99A00" },
  { bg: "color-mix(in srgb, #E2F4F1 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #16594F var(--mp-schrift), var(--mp-schrift-hell))", dot: "#2A9C86" },
  { bg: "color-mix(in srgb, #FBE3E8 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #8A2240 var(--mp-schrift), var(--mp-schrift-hell))", dot: "#D2466E" },
  { bg: "color-mix(in srgb, #E7EEF6 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #2A4A6E var(--mp-schrift), var(--mp-schrift-hell))", dot: "#4F7FB5" },
];
export const ICON_VORSCHLAEGE = ["⭐", "👶", "🐶", "🎓", "🙏", "🌱", "🚗", "💰", "🧘", "🎮", "📚", "🏡"];

export function bereichMeta(eintrag, eigeneBereiche = []) {
  if (eintrag?.bereichId) {
    const b = eigeneBereiche.find((x) => x.id === eintrag.bereichId);
    if (b) return { label: b.name, icon: b.icon, ...EIGENE_FARBEN[(b.farbeIndex || 0) % EIGENE_FARBEN.length] };
  }
  return ALLTAG_BEREICHE[eintrag?.bereich] || ALLTAG_BEREICHE.termin;
}
export const eigeneBereichMeta = (b) => ({ label: b.name, icon: b.icon, ...EIGENE_FARBEN[(b.farbeIndex || 0) % EIGENE_FARBEN.length] });

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const wochentagVon = (date) => WOCHENTAGE[(date.getDay() + 6) % 7];

export const minuten = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};
export const hhmm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Alltags-Eintrag gilt an diesem Tag? (einmalig per datum oder wöchentlich per wochentage)
export function alltagAmTag(eintrag, date) {
  if (eintrag.datum) return eintrag.datum === toLocalISODate(date);
  return (eintrag.wochentage || []).includes(wochentagVon(date));
}

const STANDARD_DAUER = { mahlzeit: 30, training: 60, supplement: 10, hormon: 10, gewohnheit: 15, workflow: 30, zeitblock: 60 };

// Alle Blöcke eines Tages, nach Beginn sortiert.
export function bloeckeFuerTag(date, { items = [], routineEinstellungen = {}, alltagEintraege = [], alltagBereiche = [], alltagErledigt = {}, ereignisse = [] } = {}) {
  const bloecke = [];
  for (const [key, meta] of [
    ["abend", ROUTINE_META.abendroutine],
    ["morgen", ROUTINE_META.morgenroutine],
  ]) {
    const r = routineEinstellungen?.[key];
    const start = minuten(r?.startZeit);
    if (start == null) continue;
    const ende = minuten(r?.endZeit) ?? start + 60;
    bloecke.push({ key: `r-${key}`, start, ende: ende > start ? ende : start + 60, titel: key === "abend" ? "Abendroutine" : "Morgenroutine", icon: key === "abend" ? "🌙" : "☀️", farbe: meta, art: "routine" });
  }
  for (const it of items) {
    const start = minuten(it.uhrzeit);
    if (start == null) continue;
    const ende = it.raw?.endUhrzeit ? minuten(it.raw.endUhrzeit) : start + (Number(it.raw?.dauerMin) || STANDARD_DAUER[it.kategorie] || 20);
    const meta = it.farbe || KATEGORIE_META[it.kategorie] || KATEGORIE_META.zeitblock;
    bloecke.push({ key: it.key, start, ende: Math.max(ende, start + 10), titel: it.name, icon: null, farbe: meta, art: it.kategorie, done: !!it.done });
  }
  for (const e of alltagEintraege) {
    if (!alltagAmTag(e, date)) continue;
    const start = minuten(e.start);
    if (start == null) continue;
    const meta = bereichMeta(e, alltagBereiche);
    const tag = toLocalISODate(date);
    bloecke.push({ key: `a-${e.id}`, start, ende: minuten(e.ende) ?? start + 60, titel: e.titel, icon: meta.icon, farbe: meta, art: e.bereich, alltag: e, done: !!alltagErledigt[`${e.id}|${tag}`] });
  }
  // Spontan Passiertes (30.09., utils/ereignisse.js) – schon geschehen, daher „erledigt“.
  for (const e of ereignisse) {
    bloecke.push({ key: e.key, start: e.start, ende: e.ende, titel: e.titel, icon: null, symbol: e.symbol, farbe: KATEGORIE_META[e.kategorie] || KATEGORIE_META.zeitblock, art: "ereignis", ereignis: true, done: true });
  }
  return bloecke.sort((a, b) => a.start - b.start || b.ende - a.ende);
}

// Überlappende Blöcke nebeneinander legen: je Block Spalte + Spaltenanzahl.
export function spaltenVerteilen(bloecke) {
  const aktiv = [];
  const gruppen = [];
  let gruppe = [];
  let gruppenEnde = -1;
  for (const b of bloecke) {
    if (b.start >= gruppenEnde && gruppe.length) {
      gruppen.push(gruppe);
      gruppe = [];
      aktiv.length = 0;
    }
    let spalte = aktiv.findIndex((endeSpalte) => endeSpalte <= b.start);
    if (spalte === -1) {
      spalte = aktiv.length;
      aktiv.push(b.ende);
    } else aktiv[spalte] = b.ende;
    gruppe.push({ ...b, spalte });
    gruppenEnde = Math.max(gruppenEnde, b.ende);
  }
  if (gruppe.length) gruppen.push(gruppe);
  return gruppen.flatMap((g) => {
    const n = Math.max(...g.map((b) => b.spalte)) + 1;
    return g.map((b) => ({ ...b, spalten: n }));
  });
}

// Monatsraster: Wochen (Mo–So) mit Datum oder null für Tage außerhalb.
export function monatsRaster(jahr, monat) {
  const erster = new Date(jahr, monat, 1);
  const versatz = (erster.getDay() + 6) % 7;
  const tage = new Date(jahr, monat + 1, 0).getDate();
  const zellen = [...Array(versatz).fill(null), ...Array.from({ length: tage }, (_, i) => new Date(jahr, monat, i + 1))];
  while (zellen.length % 7) zellen.push(null);
  return Array.from({ length: zellen.length / 7 }, (_, w) => zellen.slice(w * 7, w * 7 + 7));
}

// KI-Antwort (Aka) prüfen: nur gültige Bereiche, Tage, Uhrzeiten.
export function alltagEintraegeBereinigen(liste) {
  const uhr = (v) => (/^\d{1,2}:\d{2}$/.test(String(v || "")) ? String(v).padStart(5, "0") : null);
  return (Array.isArray(liste) ? liste : [])
    .map((e) => {
      const start = uhr(e?.start);
      const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(e?.datum || "")) ? e.datum : null;
      const wochentage = datum ? [] : (e?.wochentage || []).filter((w) => WOCHENTAGE.includes(w));
      if (!start || !String(e?.titel || "").trim() || (!datum && !wochentage.length)) return null;
      return {
        bereich: ALLTAG_BEREICHE[e.bereich] ? e.bereich : "termin",
        titel: String(e.titel).trim().slice(0, 80),
        start,
        ende: uhr(e.ende) || hhmm(minuten(start) + 60),
        wochentage,
        datum,
        erinnerung: true,
      };
    })
    .filter(Boolean);
}

// Überschneidungen (28.09., Nutzerin: „wie kann ich Wäsche machen, wenn ich
// von 8 bis 16 auf der Arbeit bin?“). Nur Dinge, die Zeit wirklich belegen,
// zählen; was nebenher läuft (Supplemente, Medikation, Wasser, Licht,
// Essen, kurze Gewohnheiten bis 15 Min.) nicht.
const NEBENHER = new Set(["supplement", "hormon", "hydration", "tageslicht", "bildschirmzeit", "mahlzeit", "atemuebung"]);
export function belegtZeit(b) {
  if (NEBENHER.has(b.art)) return false;
  if (b.art === "gewohnheit") return b.ende - b.start > 15;
  return true;
}

// Liefert je Block-Key die Titel der Blöcke, mit denen er sich überschneidet.
export function konflikte(bloecke) {
  const belegt = bloecke.filter(belegtZeit);
  const ergebnis = new Map();
  for (let i = 0; i < belegt.length; i++) {
    for (let j = i + 1; j < belegt.length; j++) {
      const a = belegt[i];
      const b = belegt[j];
      if (a.start < b.ende && b.start < a.ende) {
        ergebnis.set(a.key, [...(ergebnis.get(a.key) || []), b]);
        ergebnis.set(b.key, [...(ergebnis.get(b.key) || []), a]);
      }
    }
  }
  return ergebnis;
}

// Prüft einen neuen/geänderten Alltags-Eintrag gegen die Blöcke der Tage,
// an denen er gilt (je Wochentag der nächste Termin ab „ab“).
export function konflikteFuerEintrag(eintrag, bloeckeFuer, ab = new Date()) {
  const start = minuten(eintrag.start);
  if (start == null) return [];
  const ende = minuten(eintrag.ende) ?? start + 60;
  const tage = eintrag.datum
    ? [new Date(`${eintrag.datum}T12:00:00`)]
    : (eintrag.wochentage || []).map((w) => {
        const d = new Date(ab.getFullYear(), ab.getMonth(), ab.getDate());
        const ziel = WOCHENTAGE.indexOf(w);
        while ((d.getDay() + 6) % 7 !== ziel) d.setDate(d.getDate() + 1);
        return d;
      });
  const neu = { key: "neu", start, ende, art: eintrag.bereich || "termin" };
  const treffer = [];
  for (const d of tage) {
    for (const b of bloeckeFuer(d)) {
      if (b.alltag && b.alltag.id === eintrag.id) continue;
      if (!belegtZeit(b)) continue;
      if (neu.start < b.ende && b.start < neu.ende && !treffer.some((t) => t.titel === b.titel)) treffer.push({ ...b, tag: WOCHENTAGE[(d.getDay() + 6) % 7] });
    }
  }
  return treffer;
}
