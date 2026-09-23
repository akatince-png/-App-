import { addDays, toLocalISODate } from "./dates";
import { KATEGORIEN, WIDGET_ZU_ORDEN_KATEGORIE } from "./errungenschaften";

// Nutzerinnen-Vorgabe (16.09.): im Home-Tagesfortschritt-Balkendiagramm
// zwischen Tag/Woche/Monat/Gesamt wählen können, auch fürs Coach-Verwalten-
// Modell — dieselbe "an wie vielen Tagen war die Kategorie erledigt"-Logik
// wie im Erfolge-/Streak-System (utils/errungenschaften.js: KATEGORIEN +
// holeTage()) wiederverwendet, statt einer zweiten, abweichenden
// Berechnung — ein Balken, der hier "erledigt" zeigt, zeigt in Archiv →
// Erfolge exakt denselben Tag als Streak-Tag.
const ZEITRAUM_TAGE = { woche: 7, monat: 30 };

// Ganze Kalendertage zwischen dem Protokollstart ("YYYY-MM-DD") und heute,
// nach ÖRTLICHEM Datum. Bug-Fix (Dauertest 24.09.): vorher
// `heute - new Date("2026-09-23")` — das parst als UTC-Mitternacht, kurz
// nach Mitternacht (MESZ) am zweiten Tag ergab das 0 statt 1 Tag, und die
// Wochenansicht ignorierte den gestrigen Tag komplett.
export function kalendertageSeit(startIso, heute = new Date()) {
  const [j, m, t] = String(startIso).slice(0, 10).split("-").map(Number);
  const start = Date.UTC(j, m - 1, t);
  const jetzt = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((jetzt - start) / 86400000);
}

// Bildschirmzeit hat (anders als alle anderen Home-Widgets) keinen Eintrag
// in KATEGORIEN — bewusst kein Teil des Punkte-/Streak-Systems, weil es ein
// Limit ("nicht mehr als") statt eines Mindestziels ist. Für Woche/Monat/
// Gesamt bleibt der Balken deshalb grau (wie eine inaktive Kategorie),
// statt mit einer irreführenden zweiten Erfolgs-Definition zu rechnen.
function holeTageFuerWidget(widgetKategorie) {
  const katKey = WIDGET_ZU_ORDEN_KATEGORIE[widgetKategorie] || widgetKategorie;
  return KATEGORIEN.find((k) => k.key === katKey) || null;
}

// Zählt für EINE Kategorie, an wie vielen der letzten `tageImZeitraum` Tage
// mindestens ein Eintrag als erledigt zählt. Der Nenner ist die kleinere
// Zahl aus Zeitraum-Länge und tatsächlich seit Protokollstart vergangenen
// Tagen — sonst sähe ein frisch gestartetes Protokoll in der Wochen-/
// Monatsansicht künstlich schlecht aus (z. B. 2 von 7 Tagen bei einem erst
// zwei Tage alten Protokoll, obwohl an beiden Tagen alles erledigt wurde).
function zaehleErledigteTage(kat, quellen, tageImZeitraum, heute, tageSeitStart) {
  const tage = new Set(kat.holeTage(quellen).filter(Boolean));
  const nenner = Math.max(1, Math.min(tageImZeitraum, tageSeitStart ?? tageImZeitraum));
  let count = 0;
  for (let i = 0; i < nenner; i++) {
    if (tage.has(toLocalISODate(addDays(heute, -i)))) count += 1;
  }
  return { count, total: nenner };
}

// Baut aus den Home-Widgets (miniWidgetData) eine Variante fürs gewählte
// Zeitfenster — dieselbe Form (dailyCount/dailyTotal), damit
// TagesfortschrittBalken.jsx unverändert bleibt und einfach mit einem
// anderen Widget-Array gefüttert werden kann.
export function widgetsFuerZeitraum(zeitraum, miniWidgetData, quellen, hauptprotokollStartdatum, heute = new Date()) {
  if (zeitraum === "tag") return miniWidgetData;

  const tageSeitStart = hauptprotokollStartdatum ? Math.max(1, kalendertageSeit(hauptprotokollStartdatum, heute) + 1) : null;
  const tageImZeitraum = zeitraum === "gesamt" ? tageSeitStart ?? ZEITRAUM_TAGE.monat : ZEITRAUM_TAGE[zeitraum];

  return miniWidgetData.map((w) => {
    const kat = w.aktiv ? holeTageFuerWidget(w.kategorie) : null;
    if (!kat) return { ...w, aktiv: false, dailyCount: 0, dailyTotal: 1 };
    const { count, total } = zaehleErledigteTage(kat, quellen, tageImZeitraum, heute, tageSeitStart);
    return { ...w, dailyCount: count, dailyTotal: total };
  });
}

// "Gesamt" nur anbieten, wenn das Protokoll wirklich schon länger als einen
// Monat läuft (Nutzerinnen-Vorgabe: "falls die Sache länger als einen Monat
// geht") — sonst wäre "Gesamt" nur eine Dopplung von "Monat".
export function gesamtVerfuegbar(hauptprotokollStartdatum, heute = new Date()) {
  if (!hauptprotokollStartdatum) return false;
  return kalendertageSeit(hauptprotokollStartdatum, heute) > 31;
}
