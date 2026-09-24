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
// Seit 23.09. (Nutzerinnen-Wunsch "alle Bereiche, die einheitlich grün waren,
// sollen in diesem Nachtblau sein"): die generische App-Farbe ist Nachtblau
// aus dem Logo-/Gehirn-Design statt Türkis/Grün. Die Bereichsfarben aus
// KATEGORIE_META (z. B. Gewohnheiten-Türkis, Supplemente-Orange) bleiben.
// Seit 24.09. wechselt die App-Farbe mit der Tagesphase (Nutzerinnen-Wunsch:
// "die gesamte App soll diese Veränderung mitmachen"): morgens Orange,
// tagsüber Blau, ab der Abendroutine Nachtblau. Die Werte sind deshalb
// CSS-Variablen (gesetzt über setzeTagesphasenFarben(), Standard = Nacht
// in index.css); die Hilfsfunktionen unten verstehen sie (color-mix).
export const accent = "var(--mp-accent)"; // Marken-Akzent (je Tagesphase)
export const accentDark = "var(--mp-accent-dark)";
export const accentSoft = "var(--mp-accent-soft)";
export const blue = "#4A6FA5"; // "geplant" / sekundäre Infos
export const blueSoft = "#EAF0F8";
export const success = "var(--mp-success)"; // "erledigt"/Erfolg (je Tagesphase)
export const successSoft = "var(--mp-success-soft)";
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

const istVariable = (farbe) => typeof farbe === "string" && farbe.startsWith("var(");

export function hexZuRgba(hex, alpha) {
  if (istVariable(hex)) return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, transparent)`;
  const { r, g, b } = hexZuRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function aufhellen(hex, prozent) {
  if (istVariable(hex)) return `color-mix(in srgb, ${hex}, white ${prozent}%)`;
  const { r, g, b } = hexZuRgb(hex);
  const mix = (kanal) => Math.round(kanal + (255 - kanal) * (prozent / 100));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Für "erledigt"-Kacheln im Tagesplan (TagesplanView.jsx, Nutzerinnen-
// Vorgabe 16.09.: Bereichsfarben als volle Fläche statt nur als Punkt) —
// dunkelt die Bereichsfarbe leicht ab, damit weißer Text auf hellen Tönen
// wie Tageslicht-Gelb noch lesbar bleibt.
export function verdunkeln(hex, prozent) {
  if (istVariable(hex)) return `color-mix(in srgb, ${hex}, black ${prozent}%)`;
  const { r, g, b } = hexZuRgb(hex);
  const mix = (kanal) => Math.round(kanal * (1 - prozent / 100));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Nachtblau-Markenwelt (23.09., Nutzerinnen-Wunsch "mehr in das dunkle
// Design"): gemeinsame Farben der Highlight-Elemente — Spielstand-Karte,
// "Dein Gehirn", große Feier-Karte —, abgeleitet aus dem Logo (Türkis →
// Blau auf dunklem Grund).
export const nachtVerlaufFest = "radial-gradient(120% 90% at 30% 20%, #2C3470 0%, #171B3A 60%, #10132B 100%)";
// Hintergrund der Highlight-Karten — wechselt mit der Tagesphase.
export const nachtVerlauf = "var(--mp-highlight)";
export const nachtSchatten = "var(--mp-highlight-schatten)";
export const logoTuerkis = "#5CC3A8";
export const logoBlau = "#4274BC";
export const logoVerlauf = `linear-gradient(90deg, ${logoTuerkis}, ${logoBlau})`;

// Farbwelten je Tagesphase (siehe utils/tagesphase.js). Hintergründe
// identisch mit der Gehirn-Karte, damit alles zusammen wechselt.
export const TAGESPHASEN_FARBEN = {
  morgen: {
    accent: "#D96A12",
    accentDark: "#8A3B0A",
    accentSoft: "#FDEBD6",
    success: "#C45E10",
    successSoft: "#FDEBD6",
    highlight: "linear-gradient(165deg, #FFB866 0%, #F08A24 38%, #B24A16 78%, #6E2A10 100%)",
    highlightSchatten: "0 14px 30px rgba(176, 74, 22, 0.35)",
  },
  tag: {
    accent: "#2A62C9",
    accentDark: "#163A80",
    accentSoft: "#E2EBFA",
    success: "#2358B8",
    successSoft: "#E2EBFA",
    highlight: "linear-gradient(165deg, #6DB0F5 0%, #2D6FD6 45%, #1B3E8C 100%)",
    highlightSchatten: "0 14px 30px rgba(27, 62, 140, 0.35)",
  },
  nacht: {
    accent: "#3B4BA8",
    accentDark: "#1B2150",
    accentSoft: "#E7E9F7",
    success: "#2F3E96",
    successSoft: "#E7E9F7",
    highlight: nachtVerlaufFest,
    highlightSchatten: "0 14px 30px rgba(16, 19, 43, 0.35)",
  },
};

export function setzeTagesphasenFarben(phase) {
  const f = TAGESPHASEN_FARBEN[phase] || TAGESPHASEN_FARBEN.nacht;
  const root = typeof document !== "undefined" ? document.documentElement : null;
  if (!root) return;
  root.style.setProperty("--mp-accent", f.accent);
  root.style.setProperty("--mp-accent-dark", f.accentDark);
  root.style.setProperty("--mp-accent-soft", f.accentSoft);
  root.style.setProperty("--mp-success", f.success);
  root.style.setProperty("--mp-success-soft", f.successSoft);
  root.style.setProperty("--mp-highlight", f.highlight);
  root.style.setProperty("--mp-highlight-schatten", f.highlightSchatten);
  root.dataset.tagesphase = phase;
}

// Für Bibliotheken, die Farben als SVG-Attribut setzen (z. B. recharts):
// löst eine CSS-Variable in den aktuellen Farbwert auf.
export function aufgeloesteFarbe(farbe) {
  const m = typeof farbe === "string" && farbe.match(/^var\((--[\w-]+)\)$/);
  if (!m || typeof document === "undefined") return farbe;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || farbe;
}
