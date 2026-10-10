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

// Was Aka direkt starten kann (10.10., Ausbau).
export const START_ZIELE = ["morgenroutine", "abendroutine", "training", "workflow", "atem", "fokus", "tagesraetsel"];
// Was Aka löschen kann – immer erst nach Rückfrage (AkaErgebnis „Ja, löschen“).
export const LOESCH_TYPEN = ["gewohnheit", "supplement", "medikament", "aufgabe", "termin", "workflow", "routineschritt"];
// Was Aka an Bestehendem ändern kann (10.10.).
export const AENDER_TYPEN = ["gewohnheit", "supplement", "routineschritt", "aufgabe", "termin"];
export const LOESCH_TYP_NAME = {
  gewohnheit: "Gewohnheit",
  supplement: "Supplement",
  medikament: "Medikament",
  aufgabe: "Aufgabe",
  termin: "Kalender-Eintrag",
  workflow: "Workflow",
  routineschritt: "Routine-Schritt",
};

const datumOk = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const zeitOk = (z) => typeof z === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(z);

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
  if (aktion === "essen" || aktion === "einnahme") {
    const text = typeof data.name === "string" ? data.name.trim().slice(0, 300) : "";
    return text ? { art: aktion, name: text } : { art: "keine" };
  }
  if (aktion === "nickerchen") {
    const minuten = zahl(data.minuten, 5, 240);
    return minuten ? { art: aktion, minuten } : { art: "keine" };
  }
  if (aktion === "starten") {
    if (!START_ZIELE.includes(data.ziel)) return { art: "keine" };
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
    return { art: aktion, ziel: data.ziel, name, minuten: zahl(data.minuten, 1, 240) };
  }
  if (aktion === "loeschen") {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    return LOESCH_TYPEN.includes(data.typ) && name ? { art: aktion, typ: data.typ, name } : { art: "keine" };
  }
  if (aktion === "verschieben") {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    return name && datumOk(data.datum) ? { art: aktion, name, datum: data.datum } : { art: "keine" };
  }
  if (aktion === "aendern") {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!AENDER_TYPEN.includes(data.typ) || !name) return { art: "keine" };
    const neu = {
      neuerName: typeof data.neuerName === "string" && data.neuerName.trim() ? data.neuerName.trim() : null,
      uhrzeit: zeitOk(data.uhrzeit) ? data.uhrzeit : null,
      menge: typeof data.menge === "string" && data.menge.trim() ? data.menge.trim() : null,
      dauerMin: zahl(data.dauerMin, 1, 240),
      datum: datumOk(data.datum) ? data.datum : null,
    };
    if (!Object.values(neu).some((v) => v !== null)) return { art: "keine" };
    return { art: aktion, typ: data.typ, name, ...neu };
  }
  if (aktion === "startzeit") {
    return ["morgen", "abend"].includes(data.routine) && zeitOk(data.uhrzeit) ? { art: aktion, routine: data.routine, uhrzeit: data.uhrzeit } : { art: "keine" };
  }
  if (aktion === "abhaken") {
    const namen = (Array.isArray(data.namen) ? data.namen : []).filter((n) => typeof n === "string" && n.trim()).slice(0, 10);
    return namen.length ? { art: aktion, namen } : { art: "keine" };
  }
  return { art: "keine" };
}

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Findet einen Eintrag nach Namen (Feld wählbar): erst exakt, dann
// „enthält“ in beide Richtungen.
export function nameFinden(liste, name, feld = "name") {
  const n = norm(name);
  if (!n) return null;
  const l = (liste || []).filter((x) => norm(x?.[feld]));
  return l.find((x) => norm(x[feld]) === n) || l.find((x) => norm(x[feld]).includes(n) || n.includes(norm(x[feld]))) || null;
}

// Findet einen offenen Tagesplan-Punkt zum genannten Namen: erst exakt,
// dann „enthält“ in beide Richtungen (z. B. „Vitamin D“ ↔ „Vitamin D3“).
export function punktFinden(items, name) {
  return nameFinden((items || []).filter((i) => !i.done), name);
}
