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
export function viewAusHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/(.+)$/);
  return match ? match[1] : null;
}

export function hashFuerView(view) {
  return `#/${view}`;
}
