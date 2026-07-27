// Wissens-Basis für den ADHS Coach: jede .md-Datei unter src/wissen/ (auch
// in Unterordnern, z. B. src/wissen/gewohnheiten/) wird beim Bauen der App
// automatisch als Rohtext eingebunden (Vite import.meta.glob, eager +
// "?raw") und hier zu einem einzigen Kontext-Text zusammengefügt. Neue
// Dateien in src/wissen/ (oder einem passenden Unterordner) ablegen reicht
// aus, damit der Coach sie beim nächsten Deploy automatisch kennt — kein
// weiterer Code nötig. Die Unterordner entsprechen den Lebensbereichen der
// App (schlaf/, hydration/, training/, ... plus profil/ und blutwerte/ für
// Stammdaten/Laborwerte, allgemein/ für bereichsübergreifende Themen) —
// rein organisatorisch fürs Ablegen, inhaltlich wird trotzdem alles an
// jede Anfrage angehängt (einfache Variante, bewusst ohne Vektorsuche,
// siehe KiChat.jsx). Sollte der Ordner mit der Zeit sehr groß werden
// (viele/lange Dateien), müsste hier später eine Auswahl/Suche statt
// "alles anhängen" rein.
const DATEIEN = import.meta.glob("../wissen/**/*.md", { eager: true, query: "?raw", import: "default" });

function relativerPfad(pfad) {
  return pfad.replace("../wissen/", "");
}

const WISSENS_BASIS_TEXT = (() => {
  const eintraege = Object.entries(DATEIEN).sort(([a], [b]) => a.localeCompare(b));
  if (eintraege.length === 0) return "";
  const abschnitte = eintraege.map(([pfad, inhalt]) => `## ${relativerPfad(pfad)}\n${inhalt.trim()}`);
  return `Wissens-Basis (Hintergrundwissen zu ADHS-Coaching-Themen — als Hintergrundinformation nutzen, nicht wörtlich zitieren):\n\n${abschnitte.join("\n\n")}`;
})();

export function wissensBasisText() {
  return WISSENS_BASIS_TEXT;
}
