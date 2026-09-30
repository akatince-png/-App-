// Gemeinsame Hilfsfunktion für alle e2e/*.spec.js-Dateien.

// Netzwerk-Rauschen der Sandbox-Umgebung, keine App-Bugs — z. B. blockierte
// externe Verbindungen (net::ERR_TUNNEL_CONNECTION_FAILED), die beim
// Entwickeln der Testsuite nie auf einen konkreten, von der App selbst
// ausgelösten Request zurückgeführt werden konnten (kein fetch/<img>/<link>
// im Code, das dazu passen würde) — eher Browser-/Sandbox-eigener
// Hintergrund-Traffic. Ein echter App-Fehler äußert sich als JS-Exception
// (pageerror) oder ein React-/App-eigener console.error-Text, nicht als
// generischer net::-Fehler.
//
// „TypeError: Failed to fetch“ (30.09.): Der Harness hat bewusst kein
// Backend – echte Supabase-Aufrufe (z. B. quest_rangliste der Rangliste,
// die seit 29.09. unter „Mehr“ sitzt) gehen an die Platzhalter-Adresse
// e2e-test.supabase.co und scheitern je nach Timing vor oder nach dem
// Test-Ende. Das machte coachee-ansicht.spec.js sporadisch rot.
const IGNORIERTE_MUSTER = [/net::ERR_/, /TypeError: Failed to fetch/];

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
