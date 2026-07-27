import { sendeAnfrage } from "./aiProviders";
import { STANDARD_COACH_NAME } from "../utils/coachStorage";

// KI-Coach-Modul: bündelt alle App-seitigen KI-Funktionen hinter einer
// stabilen Schnittstelle, unabhängig davon, ob im Hintergrund gerade Ollama
// (lokal) oder eine Cloud-API antwortet (siehe aiProviders.js). Bewusst als
// eigenständiges Modul ohne Abhängigkeit auf React/AppDataContext — die
// aufrufende Komponente entscheidet, welche Profildaten sie übergibt und was
// mit dem Ergebnis passiert (z. B. direkt an wochenplanHinzufuegen/
// mahlzeitHinzufuegen weiterreichen).

/**
 * Extrahiert und parsed JSON aus einer Modellantwort — robust auch dann,
 * wenn ein Modell ohne strikten JSON-Mode (v. a. manche lokale Ollama-
 * Modelle) Fließtext oder ```json-Codefences um das eigentliche JSON
 * herum liefert.
 */
function parseJsonAntwort(text) {
  const ohneCodefence = text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const indizes = [ohneCodefence.indexOf("{"), ohneCodefence.indexOf("[")].filter((i) => i !== -1);
  const start = indizes.length ? Math.min(...indizes) : -1;
  const nutzbar = start > 0 ? ohneCodefence.slice(start) : ohneCodefence;
  try {
    return JSON.parse(nutzbar);
  } catch (err) {
    throw new Error(`KI-Antwort war kein gültiges JSON (${err.message}). Antwort: ${text.slice(0, 300)}`);
  }
}

// Persönlicher Coach-Name (z. B. "Coach Acker", siehe utils/coachStorage.js)
// wird jeder Rollenbeschreibung vorangestellt — dieselbe KI-Quelle tritt so
// gegenüber jeder Person unter ihrem eigenen, selbst gewählten Namen auf.
function mitPersona(coachName, rollenbeschreibung) {
  const name = coachName?.trim();
  const vorstellung = name && name !== STANDARD_COACH_NAME ? `Du heißt "${name}" und bist der persönliche KI-Coach dieser Person. ` : "";
  return vorstellung + rollenbeschreibung;
}

export const AIService = {
  /**
   * KI-Wecker / Morgen-Companion — kurzer motivierender Impuls als
   * Fließtext (kein JSON), z. B. direkt anzeigbar oder per Web Speech API
   * (speechSynthesis) vorlesbar.
   *
   * @param {{name?: string, termine?: string[], stimmung?: string, coachName?: string}} kontext
   * @returns {Promise<string>}
   */
  async morgenImpuls({ name, termine = [], stimmung, coachName } = {}) {
    const system = mitPersona(
      coachName,
      "Du bist ein warmherziger, kurz angebundener Morgen-Coach für Menschen mit ADHS. " +
        "Antworte auf Deutsch in maximal 2 knappen Sätzen, motivierend und konkret, ohne Floskeln."
    );
    const terminZeilen = termine.length ? termine.map((t) => `- ${t}`).join("\n") : "Keine Termine bekannt.";
    const prompt = [
      `Name: ${name || "unbekannt"}`,
      `Heutige Termine:\n${terminZeilen}`,
      stimmung ? `Aktuelle Stimmung: ${stimmung}` : null,
      "Formuliere einen kurzen Morgenimpuls für den Tagesstart.",
    ]
      .filter(Boolean)
      .join("\n");
    const antwort = await sendeAnfrage({ system, messages: [{ role: "user", content: prompt }], json: false });
    return antwort.trim();
  },

  /**
   * Trainingsplan-Assistent — die Ausgabe entspricht 1:1 der Einheiten-
   * Struktur von wochenplanHinzufuegen() (siehe useTrainingTemplates.js),
   * lässt sich also pro Eintrag direkt als wochenplanHinzufuegen(einheit)
   * übergeben.
   *
   * @param {{wunsch: string, wochentage?: string[], einheitenProWoche?: number, coachName?: string}} wuensche
   * @returns {Promise<Array<{wochentag: string, arten: string[], saetze: number, wiederholungen: string, uebungen: string}>>}
   */
  async trainingsplanVorschlag({ wunsch, wochentage = [], einheitenProWoche = 3, coachName } = {}) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Trainingsplan-Assistent für eine bestehende App.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "einheiten": [ { "wochentag": "Mo"|"Di"|"Mi"|"Do"|"Fr"|"Sa"|"So", ' +
          '"arten": string[] (nur aus: "Krafttraining","Cardio","Bodyweight","Sonstiges"), ' +
          '"saetze": number, "wiederholungen": string, "uebungen": string (kommagetrennte Übungsliste als ein Textfeld) } ] }',
      ].join(" ")
    );
    const prompt = [
      `Trainingswunsch: ${wunsch}`,
      wochentage.length ? `Bevorzugte Wochentage: ${wochentage.join(", ")}` : null,
      `Anzahl Einheiten pro Woche: ${einheitenProWoche}`,
    ]
      .filter(Boolean)
      .join("\n");
    const antwort = await sendeAnfrage({ system, messages: [{ role: "user", content: prompt }], json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.einheiten)) throw new Error("Unerwartetes Format: 'einheiten' fehlt oder ist kein Array.");
    return data.einheiten;
  },

  /**
   * Ernährungs- & Makro-Assistent — die zutaten-Struktur je Rezept
   * entspricht der Zutaten-Liste von mahlzeitHinzufuegen() (siehe
   * useMealData.js: { name, menge }).
   *
   * @param {{kfa?: number, gewicht?: number, kalorienZiel?: number, proteinZiel?: number, kohlenhydrateZiel?: number, fettZiel?: number, coachName?: string}} profil
   * @returns {Promise<Array<{name: string, zutaten: Array<{name: string, menge: string}>, naehrwerte: {kalorien: number, protein: number, kohlenhydrate: number, fett: number}}>>}
   */
  async ernaehrungsplanVorschlag({ kfa, gewicht, kalorienZiel, proteinZiel, kohlenhydrateZiel, fettZiel, coachName } = {}) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Ernährungs-Assistent für Makro-Tracking in einer bestehenden App.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "rezepte": [ { "name": string, "zutaten": [ { "name": string, "menge": string } ], ' +
          '"naehrwerte": { "kalorien": number, "protein": number, "kohlenhydrate": number, "fett": number } } ] }',
      ].join(" ")
    );
    const prompt = [
      `Profil: KFA ${kfa ?? "unbekannt"}%, Gewicht ${gewicht ?? "unbekannt"} kg.`,
      `Makro-Ziele pro Tag: ${kalorienZiel ?? "?"} kcal, ${proteinZiel ?? "?"}g Protein, ${kohlenhydrateZiel ?? "?"}g Kohlenhydrate, ${fettZiel ?? "?"}g Fett.`,
      "Schlage 2-3 passende Rezepte inkl. Zutaten und Nährwerten vor, die zu diesen Zielen passen.",
    ].join("\n");
    const antwort = await sendeAnfrage({ system, messages: [{ role: "user", content: prompt }], json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.rezepte)) throw new Error("Unerwartetes Format: 'rezepte' fehlt oder ist kein Array.");
    return data.rezepte;
  },

  /**
   * Freies Hin-und-Her mit dem Coach zu einem Thema (z. B. Trainingsplanung)
   * — verlauf ist die komplette bisherige Konversation, damit die KI sich
   * an frühere Antworten hält statt bei jeder Nachricht neu zu starten.
   * Antwort bleibt Fließtext (kein JSON) — für eine strukturierte
   * Zusammenfassung siehe trainingsplanAusChat().
   *
   * @param {{systemPrompt: string, verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<string>}
   */
  async coachChat({ systemPrompt, verlauf, coachName }) {
    const system = mitPersona(coachName, systemPrompt);
    const messages = verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text }));
    const antwort = await sendeAnfrage({ system, messages, json: false });
    return antwort.trim();
  },

  /**
   * Extrahiert aus einem geführten Trainings-Gespräch (siehe coachChat())
   * den finalen, strukturierten Plan — gleiches JSON-Format wie
   * trainingsplanVorschlag(), damit sich das Ergebnis genauso direkt an
   * wochenplanHinzufuegen() weiterreichen lässt.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<Array<{wochentag: string, arten: string[], saetze: number, wiederholungen: string, uebungen: string}>>}
   */
  async trainingsplanAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Trainingsplan-Assistent für eine bestehende App.",
        "Fasse das vorangegangene Gespräch jetzt als finalen Plan zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "einheiten": [ { "wochentag": "Mo"|"Di"|"Mi"|"Do"|"Fr"|"Sa"|"So", ' +
          '"arten": string[] (nur aus: "Krafttraining","Cardio","Bodyweight","Sonstiges"), ' +
          '"saetze": number, "wiederholungen": string, "uebungen": string (kommagetrennte Übungsliste als ein Textfeld) } ] }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse den oben besprochenen Trainingsplan jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.einheiten)) throw new Error("Unerwartetes Format: 'einheiten' fehlt oder ist kein Array.");
    return data.einheiten;
  },

  /**
   * Extrahiert aus einem geführten Gewohnheiten-Gespräch (siehe coachChat())
   * die fertige Gewohnheit — Format entspricht 1:1 dem, was
   * gewohnheitHinzufuegen() erwartet (siehe useGewohnheitenData.js), lässt
   * sich also direkt weiterreichen.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{name: string, icon: string, menge: string, uhrzeit: string, urzeitVon: string, urzeitBis: string, zielTage: number|null}>}
   */
  async gewohnheitAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der neue Gewohnheiten/Routinen für Nutzer anlegt.",
        "Fasse das vorangegangene Gespräch jetzt als fertige Gewohnheit zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string, "icon": string (ein einzelnes passendes Emoji), "menge": string (z. B. "10 Seiten", leer wenn nicht genannt), ' +
          '"uhrzeit": string ("HH:MM" bei fester Uhrzeit, sonst leer), "urzeitVon": string, "urzeitBis": string (bei Zeitfenster statt fester Uhrzeit, sonst beide leer), ' +
          '"zielTage": number|null (Zieltage bis die Gewohnheit etabliert ist, z. B. 21 oder 66 — null wenn nicht genannt/offen) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse die oben besprochene Gewohnheit jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.name) throw new Error("Unerwartetes Format: 'name' fehlt.");
    return data;
  },

  /**
   * Extrahiert aus einem geführten Ernährungs-Gespräch (siehe coachChat())
   * die finalen Rezeptvorschläge — gleiches Format wie
   * ernaehrungsplanVorschlag(), damit sich das Ergebnis genauso direkt an
   * mahlzeitHinzufuegen() weiterreichen lässt.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<Array<{name: string, zutaten: Array<{name: string, menge: string}>, naehrwerte: {kalorien: number, protein: number, kohlenhydrate: number, fett: number}}>>}
   */
  async ernaehrungsplanAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Ernährungs-Assistent für Makro-Tracking in einer bestehenden App.",
        "Fasse das vorangegangene Gespräch jetzt als finale Rezeptvorschläge zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "rezepte": [ { "name": string, "zutaten": [ { "name": string, "menge": string } ], ' +
          '"naehrwerte": { "kalorien": number, "protein": number, "kohlenhydrate": number, "fett": number } } ] }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse die oben besprochenen Rezepte jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.rezepte)) throw new Error("Unerwartetes Format: 'rezepte' fehlt oder ist kein Array.");
    return data.rezepte;
  },

  /**
   * Extrahiert aus einem geführten Hydrations-Gespräch (siehe coachChat())
   * ein optionales neues Tagesziel und/oder neue Erinnerungszeiten — Format
   * der Zeiten entspricht dem, was HydrationErinnerungenCard erwartet
   * ({zeit, menge}), lässt sich also direkt an die bestehende Liste anhängen.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{zielMl: number|null, zeiten: Array<{zeit: string, menge: string}>}>}
   */
  async hydrationAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der beim Einrichten des Trink-/Hydrationsziels und passender Erinnerungszeiten hilft.",
        "Fasse das vorangegangene Gespräch jetzt zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "zielMl": number|null (Tagesziel in ml, null wenn nicht genannt/unverändert), ' +
          '"zeiten": [ { "zeit": "HH:MM", "menge": string (z. B. "300") } ] (leeres Array wenn keine Erinnerungszeiten besprochen wurden) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben Besprochene jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.zeiten)) throw new Error("Unerwartetes Format: 'zeiten' fehlt oder ist kein Array.");
    return data;
  },

  /**
   * Extrahiert aus einem geführten Tageslicht-Gespräch (siehe coachChat())
   * ein neues Tagesziel in Minuten.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{zielMinuten: number}>}
   */
  async tageslichtAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der beim Einrichten eines täglichen Tageslicht-/Freiluft-Ziels hilft.",
        "Fasse das vorangegangene Gespräch jetzt zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "zielMinuten": number (Tagesziel in Minuten, aus dem Gespräch abgeleitet) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben besprochene Tagesziel jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (typeof data.zielMinuten !== "number") throw new Error("Unerwartetes Format: 'zielMinuten' fehlt oder ist keine Zahl.");
    return data;
  },
};
