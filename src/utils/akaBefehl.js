// Aka wie Siri (10.10., Nutzerin: „Hey Aka, öffne den Spielebereich … füg
// hinzu, dass ich gerade 200 ml Wasser getrunken habe … der soll wirklich
// auf alles Zugriff haben“). Hier stehen die reinen Hilfen: welche Seiten
// Aka öffnen darf, wie ein erkannter Befehl bereinigt wird und wie ein
// genannter Tagesplan-Punkt gefunden wird. Ausgeführt wird in
// data/useUniversellerCoach.js.

// id = interner `view`-Wert (siehe AuthenticatedApp.jsx), name = wie die
// Person die Seite nennt. Der Klassifikator wählt nur aus dieser Liste.
export const ANSICHTEN = [
  { id: "home", name: "Startseite (Heute)" },
  { id: "tagesplan", name: "Tagesplan (Plan)" },
  { id: "wochenuebersicht", name: "Wochenübersicht (Wochenplan)" },
  { id: "kalender", name: "Kalender (Mein Alltag)" },
  { id: "matrix", name: "Aufgaben-Matrix (To-dos)" },
  { id: "mehr", name: "Mehr (alle Bereiche)" },
  { id: "denksport", name: "Spiele (Denksport, Spielebereich)" },
  { id: "tagesraetsel", name: "Tagesrätsel" },
  { id: "workflow", name: "Workflow (Arbeits-/Pausen-Timer)" },
  { id: "fokus", name: "Gemeinsam fokussieren (Body Doubling)" },
  { id: "atemuebungen", name: "Atemübungen" },
  { id: "tagebuch", name: "Tagebuch" },
  { id: "routinen", name: "Gewohnheiten" },
  { id: "morgenroutine", name: "Morgenroutine" },
  { id: "abendroutine", name: "Abendroutine" },
  { id: "schichtplan", name: "Schichtplan" },
  { id: "coaching", name: "AKA-Kernprogramm (Coaching)" },
  { id: "team", name: "Team (Rangliste, Team-Liga)" },
  { id: "coach-chat", name: "Chat mit dem Coach (Nachrichten)" },
  { id: "hydration", name: "Wasser (Trinken)" },
  { id: "tageslicht", name: "Tageslicht" },
  { id: "schlaf", name: "Schlaf" },
  { id: "bildschirmzeit", name: "Bildschirmzeit" },
  { id: "ernaehrung", name: "Ernährung (Essen, Mahlzeiten)" },
  { id: "training", name: "Training (Sport, Bewegung)" },
  { id: "supplemente", name: "Supplemente" },
  { id: "medikamente", name: "Medikamente" },
  { id: "verlauf", name: "Verlauf (Tagesprotokoll)" },
  { id: "archiv", name: "Archiv" },
  { id: "statistik", name: "Statistik" },
  { id: "erfolge", name: "Erfolge (Fortschritt, Punkte)" },
  { id: "profil", name: "Profil (Einstellungen)" },
  { id: "community", name: "Community" },
  { id: "lexikon", name: "Lexikon" },
  { id: "admin", name: "Admin-Dashboard" },
  { id: "admin-uebersicht", name: "Coach-Übersicht (alle Coachees)" },
  { id: "admin-teams", name: "Teams verwalten" },
  { id: "admin-quests", name: "Quests verwalten" },
  { id: "admin-handbuch", name: "Handbuch" },
];

const ANSICHT_IDS = new Set(ANSICHTEN.map((a) => a.id));

export const ansichtName = (id) => ANSICHTEN.find((a) => a.id === id)?.name.replace(/\s*\(.*\)$/, "") || id;

// Text für den Klassifikator-Prompt: „id = Name“ je Zeile.
export const ansichtenListe = () => ANSICHTEN.map((a) => `${a.id} = ${a.name}`).join("; ");

const zahl = (x, min, max) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

// Bereinigt die Antwort von AIService.befehlErkennen(): nur bekannte
// Aktionen (Feld „art“), plausible Mengen, Seiten aus der Liste. Alles andere → "keine".
export function befehlBereinigen(data) {
  const aktion = data?.art;
  if (aktion === "oeffnen") {
    return ANSICHT_IDS.has(data.ansicht) ? { art: aktion, ansicht: data.ansicht } : { art: "keine" };
  }
  if (aktion === "wasser") {
    const ml = zahl(data.ml, 10, 3000);
    return ml ? { art: aktion, ml } : { art: "keine" };
  }
  if (aktion === "tageslicht") {
    const minuten = zahl(data.minuten, 1, 600);
    return minuten ? { art: aktion, minuten } : { art: "keine" };
  }
  if (aktion === "abhaken") {
    const namen = (Array.isArray(data.namen) ? data.namen : []).filter((n) => typeof n === "string" && n.trim()).slice(0, 10);
    return namen.length ? { art: aktion, namen } : { art: "keine" };
  }
  return { art: "keine" };
}

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Findet einen offenen Tagesplan-Punkt zum genannten Namen: erst exakt,
// dann „enthält“ in beide Richtungen (z. B. „Vitamin D“ ↔ „Vitamin D3“).
export function punktFinden(items, name) {
  const n = norm(name);
  if (!n) return null;
  const offen = (items || []).filter((i) => !i.done);
  return offen.find((i) => norm(i.name) === n) || offen.find((i) => norm(i.name).includes(n) || n.includes(norm(i.name))) || null;
}
