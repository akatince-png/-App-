// Erzeugt public/datenschutz.html und public/impressum.html aus
// src/utils/rechtstexte.js (eine Quelle für App und öffentliche Seiten).
// Läuft automatisch vor jedem Build (npm "prebuild"). Die öffentliche
// Datenschutz-URL für App Store Connect: https://akaapp.vercel.app/datenschutz.html
import fs from "node:fs";
import { DATENSCHUTZ, IMPRESSUM } from "../src/utils/rechtstexte.js";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function seite(titel, abschnitte, andere) {
  const inhalt = abschnitte
    .map(
      (a) =>
        `<section><h2>${esc(a.titel)}</h2>${(a.absaetze || []).map((p) => `<p>${esc(p)}</p>`).join("")}${
          a.liste ? `<ul>${a.liste.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""
        }</section>`
    )
    .join("\n");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(titel)} – AKA</title>
<style>
  body { margin: 0; background: #f6f7fb; color: #15181a; font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 28px 18px 48px; }
  h1 { font-size: 26px; margin: 0 0 18px; color: #1b2350; }
  h2 { font-size: 18px; margin: 22px 0 6px; color: #1b2350; }
  p, li { margin: 0 0 8px; }
  ul { padding-left: 20px; }
  footer { margin-top: 30px; font-size: 14px; }
  a { color: #2d6fd6; }
</style>
</head>
<body>
<main>
<h1>${esc(titel)}</h1>
${inhalt}
<footer><a href="${andere.href}">${esc(andere.text)}</a></footer>
</main>
</body>
</html>
`;
}

fs.writeFileSync(new URL("../public/datenschutz.html", import.meta.url), seite("Datenschutzerklärung", DATENSCHUTZ, { href: "impressum.html", text: "Impressum" }));
fs.writeFileSync(new URL("../public/impressum.html", import.meta.url), seite("Impressum", IMPRESSUM, { href: "datenschutz.html", text: "Datenschutzerklärung" }));
console.log("Rechtstexte: public/datenschutz.html + public/impressum.html erzeugt");
