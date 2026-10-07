// Echtes Routing (App-Bauplan-Punkt): der `view`-String in
// AuthenticatedApp.jsx war bisher reiner React-State, nirgends mit der
// echten Browser-URL verknüpft — ein Lesezeichen auf "Tagesplan" landete
// beim Öffnen immer auf Home, der Zurück-Knopf des Browsers tat gar
// nichts (kein Eintrag in der Browser-Historie), ein Neuladen mittendrin
// setzte einen unsichtbar zurück.
//
// Bewusst Hash-Routing (`#/tagesplan`) statt eines vollen Router mit
// "sauberen" Pfaden (`/tagesplan`): Pfad-Routing bräuchte eine Server-
// seitige SPA-Fallback-Regel (jede beliebige Route liefert weiter
// `index.html` aus), die für dieses Projekt nirgends konfiguriert ist
// (kein `vercel.json`) — ohne die würde ein direkter Aufruf oder ein
// Neuladen von z. B. `/tagesplan` mit einem 404 vom Hosting scheitern.
// Hash-Routing funktioniert dagegen auf jedem statischen Host ohne jede
// Zusatzkonfiguration, weil der Teil nach `#` den Server nie erreicht.
//
// Bildet exakt den bereits bestehenden `view`-String ab (derselbe Wert,
// den PLAENE_VIEW_IDS/ARCHIV_VIEW_IDS/admin-* usw. in AuthenticatedApp.jsx
// schon kennen) — kein zweites, paralleles Routen-Konzept.
export function viewAusHash(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#\/(.+)$/);
  return match ? match[1] : null;
}

export function hashFuerView(view: string): string {
  return `#/${view}`;
}

// Start immer auf der Startseite (07.10., Nutzerin: „Wenn ich die Seite in
// Safari aktualisiere oder öffne, kommt irgendeine Seite, nicht der
// Homebildschirm“). Die zuletzt offene Seite steht noch in der Adresse
// (#/tagebuch …) und wurde bisher beim Neuladen wieder geöffnet. Jetzt nur
// noch bei echten Sprung-Links aus Erinnerungen (Push), nie beim Neuladen.
export const SPRUNG_ZIELE = ["kalender", "coach-chat", "admin-uebersicht"];

export function anfangsZielErlaubt(view: string | null, navigationsArt?: string): boolean {
  if (!view) return false;
  // Testumgebung (e2e-Harness) öffnet Seiten direkt über die Adresse.
  if ((window as unknown as { __akaAdresseStart?: boolean }).__akaAdresseStart) return true;
  if (!SPRUNG_ZIELE.includes(view)) return false;
  return navigationsArt !== "reload" && navigationsArt !== "back_forward";
}

export function navigationsArt(): string | undefined {
  try {
    const eintrag = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return eintrag?.type;
  } catch {
    return undefined;
  }
}
