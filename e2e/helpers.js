// Gemeinsame Hilfsfunktion für alle e2e/*.spec.js-Dateien.

// Netzwerk-Rauschen der Sandbox-Umgebung, keine App-Bugs — z. B. blockierte
// externe Verbindungen (net::ERR_TUNNEL_CONNECTION_FAILED), die beim
// Entwickeln der Testsuite nie auf einen konkreten, von der App selbst
// ausgelösten Request zurückgeführt werden konnten (kein fetch/<img>/<link>
// im Code, das dazu passen würde) — eher Browser-/Sandbox-eigener
// Hintergrund-Traffic. Ein echter App-Fehler äußert sich als JS-Exception
// (pageerror) oder ein React-/App-eigener console.error-Text, nicht als
// generischer net::-Fehler.
const IGNORIERTE_MUSTER = [/net::ERR_/];

export function sammleKonsolenfehler(page) {
  const fehler = [];
  page.on("pageerror", (err) => fehler.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORIERTE_MUSTER.some((m) => m.test(text))) return;
    fehler.push(`console.error: ${text}`);
  });
  return fehler;
}
