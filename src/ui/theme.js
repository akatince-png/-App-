// Heller, frischer Grund (großzügig Weiß statt des früheren warmgrauen
// Tons) + ein kräftiger Marken-Akzent als generischer Rückfall für alle
// Bereiche ohne eigene KATEGORIE_META-Farbe (Admin, Sidebar, Onboarding,
// generische Buttons). "Erledigt" bekommt weiterhin ein eigenes, vom
// generischen Akzent entkoppeltes Grün (`success`), statt beide
// Bedeutungen in einer Farbe zu vermischen. Die eigentliche
// Bereichsfarbigkeit kommt weiterhin aus KATEGORIE_META (siehe
// utils/dayItems.js) — jeder Lebensbereich (Training, Hydration, Schlaf,
// ...) bekommt seine eigene Akzentfarbe in Header/Buttons, angelehnt an
// die bunten Home-Mini-Widgets.
//
// Bug-Fix (13.09., Nutzerinnen-Vorgabe): war zwischenzeitlich (28.07.)
// auf Indigo/Blau umgestellt worden (als Referenz diente die Farbe des
// Notfallmodus-Knopfs auf Home, siehe ADHSModeToggle.jsx) — dadurch
// wichen Bereiche ohne eigene KATEGORIE_META-Farbe (z. B. Admin-
// Dashboard) sichtbar vom Türkis der älteren, noch nicht umgestellten
// Bereiche (z. B. Gewohnheiten/Routinen, bereich="gewohnheit") ab: "die
// Bereiche in verschiedenen Modulen haben verschiedene Farben, irritiert
// ein bisschen". Jetzt wieder dasselbe Türkis wie KATEGORIE_META.gewohnheit
// (dot/text/bg) — dieselben drei Werte, damit generische und
// Gewohnheiten-Bereiche exakt zusammenpassen, statt nur ähnlich zu wirken.
export const bg = "#FFFFFF";
export const card = "#FFFFFF";
export const cardBorder = "#EAEAE5";
export const accent = "#24948E"; // Türkis — Marken-Akzent (= KATEGORIE_META.gewohnheit.dot)
export const accentDark = "#1F605B"; // = KATEGORIE_META.gewohnheit.text
export const accentSoft = "#DCF3F1"; // = KATEGORIE_META.gewohnheit.bg
export const blue = "#4A6FA5"; // "geplant" / sekundäre Infos
export const blueSoft = "#EAF0F8";
export const success = "#0E7C66"; // Eigenständiges Grün, nur noch für "erledigt"/Erfolg
export const successSoft = "#E6F3EF";
export const danger = "#C24545";
// Bewusst eigenständig von `danger` (App-Bauplan-Punkt, ADHS-Perspektive):
// ein rotes "Alarm"-Rot für nicht bestätigte/verspätete Einträge wirkt wie
// ein Vorwurf statt wie eine neutrale Information — genau das, wovon der
// KI-Coach laut eigenem Systemprompt (aiService.js) ausdrücklich wegwill
// ("Motivierend statt beschämend"). Gleicher Bernstein-Ton wie der bereits
// bestehende Notfallmodus-Banner auf Home (`#D97706`, "Kein Druck!") — für
// "noch offen/nicht geschafft" statt Rot, das echten Fehlern/Löschen
// vorbehalten bleibt.
export const warn = "#D97706";
export const warnSoft = "rgba(217, 119, 6, 0.1)";
export const textMain = "#15181A";
export const textMuted = "#6B7178";
// Etwas tiefer/dunkler als zuvor, damit Karten sich sichtbar vom weißen
// Hintergrund abheben statt "flach" wirkendem Ausschneide-Look
// (Nutzerinnen-Vorgabe, siehe Kommentar oben).
export const shadow = "0 10px 30px rgba(20, 23, 26, 0.09)";

// Hilfsfunktionen für dynamische Farbverläufe/Glow-Schatten (siehe
// PrimaryButton in primitives.jsx) — jede Bereichsfarbe aus KATEGORIE_META
// bekommt so automatisch denselben "lebendigen" Verlaufs-/Schatten-Look
// wie der Notfallmodus-Knopf, ohne für jeden Bereich eigene Farbpaare von
// Hand pflegen zu müssen.
function hexZuRgb(hex) {
  const bereinigt = hex.replace("#", "");
  const voll = bereinigt.length === 3 ? bereinigt.split("").map((c) => c + c).join("") : bereinigt;
  const num = parseInt(voll, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function hexZuRgba(hex, alpha) {
  const { r, g, b } = hexZuRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function aufhellen(hex, prozent) {
  const { r, g, b } = hexZuRgb(hex);
  const mix = (kanal) => Math.round(kanal + (255 - kanal) * (prozent / 100));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Für "erledigt"-Kacheln im Tagesplan (TagesplanView.jsx, Nutzerinnen-
// Vorgabe 16.09.: Bereichsfarben als volle Fläche statt nur als Punkt) —
// dunkelt die Bereichsfarbe leicht ab, damit weißer Text auf hellen Tönen
// wie Tageslicht-Gelb noch lesbar bleibt.
export function verdunkeln(hex, prozent) {
  const { r, g, b } = hexZuRgb(hex);
  const mix = (kanal) => Math.round(kanal * (1 - prozent / 100));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Nachtblau-Markenwelt (23.09., Nutzerinnen-Wunsch "mehr in das dunkle
// Design"): gemeinsame Farben der Highlight-Elemente — Spielstand-Karte,
// "Dein Gehirn", große Feier-Karte —, abgeleitet aus dem Logo (Türkis →
// Blau auf dunklem Grund).
export const nachtVerlauf = "radial-gradient(120% 90% at 30% 20%, #2C3470 0%, #171B3A 60%, #10132B 100%)";
export const nachtSchatten = "0 14px 30px rgba(16, 19, 43, 0.35)";
export const logoTuerkis = "#5CC3A8";
export const logoBlau = "#4274BC";
export const logoVerlauf = `linear-gradient(90deg, ${logoTuerkis}, ${logoBlau})`;
