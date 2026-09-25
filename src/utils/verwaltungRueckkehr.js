// "Zurück zum Dashboard" (25.09., Fund im Admin-Dauertest): Beim Verlassen
// von "Verwalten als" wird AuthenticatedApp neu aufgebaut und landete bisher
// auf der eigenen Startseite. Dieses Merkzeichen (Modul-Ebene, überlebt den
// Neuaufbau, aber kein Neuladen) schickt den Admin stattdessen zurück ins Dashboard.
let zurueckZumDashboard = false;

export function merkeRueckkehrZumDashboard() {
  zurueckZumDashboard = true;
}

export function nimmRueckkehrZumDashboard() {
  const war = zurueckZumDashboard;
  zurueckZumDashboard = false;
  return war;
}
