import { addDays, toLocalISODate } from "./dates";

// "Dein Gehirn" (Nutzerinnen-Wunsch 23.09.: statt Pflanzen ein Gehirn, das
// sich auflädt — "alles, was wir tun, soll am Ende unserem Gehirn und damit
// dem ADHS förderlich sein"). Die Bereiche der App sind zu sechs Regionen
// zusammengefasst; jede Region lädt sich mit den Tagen der letzten Woche
// auf, an denen dort etwas erledigt wurde.
// ADHS-Grundsatz wie vorher bei den Pflanzen: nichts wird dunkel oder
// "kaputt" — eine Region ohne Aktivität in der letzten Woche RUHT nur
// (sanftes Leuchten), ihre Geschichte bleibt.
export const REGIONEN = [
  {
    key: "fokus",
    label: "Fokus & Planung",
    emoji: "🎯",
    farbe: "#7C5CE0",
    kategorien: ["gewohnheiten", "morgenroutine", "abendroutine", "tagesraetsel"],
    text: "Routinen und Denksport trainieren Planung, Arbeitsgedächtnis und Selbststeuerung — genau die Fähigkeiten, bei denen ADHS am meisten Unterstützung braucht.",
  },
  {
    key: "bewegung",
    label: "Bewegung",
    emoji: "💪",
    farbe: "#E4643F",
    kategorien: ["training"],
    text: "Bewegung schüttet Dopamin und Noradrenalin aus — die Botenstoffe, die für Antrieb und Konzentration wichtig sind.",
  },
  {
    key: "energie",
    label: "Energie",
    emoji: "⚡",
    farbe: "#D99A1E",
    kategorien: ["ernaehrung", "hydration", "supplemente", "medikamente"],
    text: "Regelmäßig essen, genug trinken und Einnahmen einhalten hält den Energiepegel deines Gehirns stabil — weniger Tiefs, weniger Reizbarkeit.",
  },
  {
    key: "rhythmus",
    label: "Licht & Rhythmus",
    emoji: "☀️",
    farbe: "#E8B90C",
    kategorien: ["tageslicht"],
    text: "Tageslicht, vor allem morgens, stellt deine innere Uhr — das macht tagsüber wacher und abends leichter müde.",
  },
  {
    key: "ruhe",
    label: "Ruhe & Gefühl",
    emoji: "🌬️",
    farbe: "#1FA39A",
    kategorien: ["atemuebungen"],
    text: "Ruhiges Atmen bremst das Stresssystem — das hilft, Gefühle und Impulse besser zu steuern.",
  },
  {
    key: "erholung",
    label: "Erholung",
    emoji: "🌙",
    farbe: "#5470E0",
    kategorien: ["schlaf"],
    text: "Im Schlaf räumt dein Gehirn auf und speichert Gelerntes. Zu wenig Schlaf verstärkt Unruhe und Vergesslichkeit.",
  },
];

// Nervenbahnen zwischen benachbarten Regionen: leuchten, wenn BEIDE Regionen
// gerade eine laufende Serie haben ("deine Gewohnheiten vernetzen sich").
export const VERBINDUNGEN = [
  ["fokus", "bewegung"],
  ["bewegung", "energie"],
  ["energie", "rhythmus"],
  ["fokus", "ruhe"],
  ["ruhe", "energie"],
  ["rhythmus", "erholung"],
  ["ruhe", "erholung"],
];

const WOCHE = 7;

// kategorien: Ausgabe von berechneErrungenschaften().kategorien
// (mit tageListe, streak). Liefert je Region Ladung 0..1 (Anteil der
// letzten 7 Tage inkl. heute mit Aktivität), Zustand und Serie.
export function berechneGehirn(kategorien, heute = new Date()) {
  const woche = new Set(Array.from({ length: WOCHE }, (_, i) => toLocalISODate(addDays(heute, -i))));
  const nachKey = new Map((kategorien || []).map((k) => [k.key, k]));

  const regionen = REGIONEN.map((r) => {
    const tageGesamt = new Set();
    let serie = 0;
    r.kategorien.forEach((key) => {
      const k = nachKey.get(key);
      if (!k) return;
      (k.tageListe || []).forEach((t) => tageGesamt.add(t));
      serie = Math.max(serie, k.streak || 0);
    });
    const tageWoche = [...tageGesamt].filter((t) => woche.has(t)).length;
    const zustand = tageGesamt.size === 0 ? "leer" : tageWoche === 0 ? "ruht" : "aktiv";
    return { ...r, ladung: tageWoche / WOCHE, tageWoche, tageGesamt: tageGesamt.size, serie, zustand };
  });

  const nachRegion = new Map(regionen.map((r) => [r.key, r]));
  const verbindungen = VERBINDUNGEN.map(([a, b]) => ({ a, b, aktiv: nachRegion.get(a).serie > 0 && nachRegion.get(b).serie > 0 }));
  const genutzt = regionen.filter((r) => r.zustand !== "leer");
  const gesamtLadung = genutzt.length ? genutzt.reduce((s, r) => s + r.ladung, 0) / genutzt.length : 0;

  return { regionen, verbindungen, gesamtLadung, aktiv: regionen.filter((r) => r.zustand === "aktiv").length, genutzt: genutzt.length };
}

// Zuordnung der Tagesfortschritt-Balken (Home-Widgets) zu den Regionen —
// seit 23.09. sind Diagramm und Gehirn eine Karte: dieselbe Zeitraum-Wahl
// (Tag/Woche/Monat/Gesamt) steuert Balken UND Gehirn.
export const WIDGET_REGION = {
  gewohnheit: "fokus",
  morgenroutine: "fokus",
  abendroutine: "fokus",
  bildschirmzeit: "fokus",
  training: "bewegung",
  hormon: "energie",
  supplement: "energie",
  mahlzeit: "energie",
  hydration: "energie",
  tageslicht: "rhythmus",
};
// Bereiche ohne eigenen Balken: zählen über ihre erledigten Tage im Zeitraum.
const OHNE_BALKEN = { schlaf: "erholung", atemuebungen: "ruhe", tagesraetsel: "fokus" };

// widgets: Balken-Daten des gewählten Zeitraums (dailyCount/dailyTotal je
// Bereich, siehe utils/zeitraumFortschritt.js); tage: Länge des Zeitraums.
export function berechneGehirnZeitraum({ widgets, kategorien, tage, heute = new Date() }) {
  const basis = berechneGehirn(kategorien, heute); // Serien/Nervenbahnen
  const fenster = new Set(Array.from({ length: Math.max(1, tage) }, (_, i) => toLocalISODate(addDays(heute, -i))));
  const anteile = Object.fromEntries(REGIONEN.map((r) => [r.key, []]));

  (widgets || []).forEach((w) => {
    const region = WIDGET_REGION[w.kategorie];
    if (!region || !w.aktiv) return;
    anteile[region].push(Math.min(1, (w.dailyCount || 0) / (w.dailyTotal || 1)));
  });
  (kategorien || []).forEach((k) => {
    const region = OHNE_BALKEN[k.key];
    if (!region || !(k.tageListe || []).length) return;
    anteile[region].push(k.tageListe.filter((t) => fenster.has(t)).length / Math.max(1, tage));
  });

  const regionen = basis.regionen.map((r) => {
    const liste = anteile[r.key];
    if (liste.length === 0) return { ...r, ladung: 0, zustand: "leer" };
    const ladung = liste.reduce((s, x) => s + x, 0) / liste.length;
    return { ...r, ladung, zustand: ladung > 0 ? "aktiv" : "offen" };
  });
  const genutzt = regionen.filter((r) => r.zustand !== "leer");
  const gesamtLadung = genutzt.length ? genutzt.reduce((s, r) => s + r.ladung, 0) / genutzt.length : 0;
  return { regionen, verbindungen: basis.verbindungen, gesamtLadung, aktiv: regionen.filter((r) => r.zustand === "aktiv").length, genutzt: genutzt.length };
}
