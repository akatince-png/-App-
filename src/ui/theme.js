// Heller, frischer Grund (großzügig Weiß statt des früheren warmgrauen
// Tons) + ein kräftiger Indigo/Blau-Marken-Akzent als generischer
// Rückfall (Nutzerinnen-Vorgabe, 28.07.: das alte Grün wirkte "flach,
// undynamisch, unmodern" — als Referenz diente die Farbe des
// Notfallmodus-Knopfs auf Home, siehe ADHSModeToggle.jsx). "Erledigt"
// bekommt jetzt ein eigenes, vom generischen Akzent entkoppeltes Grün
// (`success`), statt beide Bedeutungen in einer Farbe zu vermischen. Die
// eigentliche Bereichsfarbigkeit kommt weiterhin aus KATEGORIE_META
// (siehe utils/dayItems.js) — jeder Lebensbereich (Training, Hydration,
// Schlaf, ...) bekommt seine eigene Akzentfarbe in Header/Buttons,
// angelehnt an die bunten Home-Mini-Widgets.
export const bg = "#FFFFFF";
export const card = "#FFFFFF";
export const cardBorder = "#EAEAE5";
// Kräftiger/gesättigter als zuvor (Nutzerinnen-Vorgabe, 16.08.: "die Farben
// etwas catchier, etwas stärker" — Home-Menü und Bereichsfarben wirkten zu
// blass/zurückhaltend). Gleicher Indigo-Ton, nur satter statt heller.
export const accent = "#4D51F8"; // Indigo — Marken-Akzent (wie Notfallmodus-Knopf, Normalzustand)
export const accentDark = "#2F22D6";
export const accentSoft = "#EEF0FF";
export const blue = "#4A6FA5"; // "geplant" / sekundäre Infos
export const blueSoft = "#EAF0F8";
export const success = "#0E7C66"; // Eigenständiges Grün, nur noch für "erledigt"/Erfolg
export const successSoft = "#E6F3EF";
export const danger = "#C24545";
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
