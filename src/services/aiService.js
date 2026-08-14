import { sendeAnfrage, sendeAnfrageStreamend } from "./aiProviders";
import { STANDARD_COACH_NAME } from "../utils/coachStorage";

// Assistenten-Modul: bündelt alle App-seitigen KI-Funktionen hinter einer
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

// Persönlicher Assistenten-Name (Standard: "Aka", individuell umbenennbar
// in den Einstellungen, siehe utils/coachStorage.js) wird jeder
// Rollenbeschreibung vorangestellt — dieselbe KI-Quelle tritt so gegenüber
// jeder Person unter ihrem eigenen, selbst gewählten Namen auf.
function mitPersona(coachName, rollenbeschreibung) {
  const name = coachName?.trim();
  const vorstellung = name && name !== STANDARD_COACH_NAME ? `Du heißt "${name}" und bist der persönliche Assistent dieser Person — kein Coach. ` : "";
  return vorstellung + rollenbeschreibung;
}

// Volle Persönlichkeits-/Tonalitäts-Vorgabe für den freien Assistenten-Chat
// (von der Nutzerin explizit so vorgegeben, zuletzt präzisiert am 28.07.:
// kein Coach — aber auch kein reiner stiller Diener. Sidekick-Charakter:
// im Hintergrund unaufdringlich wie ein guter Butler, aber im Gespräch
// präsent, erinnert von sich aus, motiviert, kritisiert konstruktiv statt
// nur zu verwalten) — bewusst NUR für die freien Gesprächsfunktionen
// (coachChat/coachChatStreamend), NICHT für die strukturierten
// Extraktions-Funktionen (…AusChat, …Vorschlag, bereichErkennen): dort
// würde die Stil-Vorgabe (Bullet Points, Next Small Step, Fettdruck) mit
// der geforderten reinen JSON-Antwort kollidieren und das Parsen brechen.
// Punkt 4 der Vorgabe ("strukturiertes Format") ist deshalb hier bewusst
// auf lesbaren Fließtext eingeschränkt — die eigentliche JSON-Übernahme
// läuft separat über den "Übernehmen"-Knopf.
function coachPersonaBlock(name) {
  return [
    `Du bist "${name}" — kein Coach, sondern der persönliche Sidekick dieser Person. Menschen mit ADHS haben oft außergewöhnliche Fähigkeiten (Kreativität, Hyperfokus, schnelles Denken) — was oft fehlt, sind die Rahmenbedingungen, damit diese Fähigkeiten auch zum Tragen kommen. Genau das lieferst du: die lästige Logistik läuft unauffällig im Hintergrund wie bei einem guten Butler, aber DU selbst bist präsent, meldest dich auch mal von dir aus und bist im Gespräch echt — kein stiller Diener, der nur abwartet.`,
    "",
    "Rolle & Tonalität:",
    "- Du bist Sidekick, nicht Coach oder Lehrer — du sagst der Person nicht, was sie tun soll. Sie bleibt am Steuer, du nimmst ihr die Logistik ab.",
    "- ADHSler lassen sich ungern etwas vorschreiben, wollen aber trotzdem verstehen, worum es geht, und das Gefühl haben, Einfluss und Kontrolle zu behalten. Erklär kurz die Zusammenhänge, wenn danach gefragt wird oder es wirklich hilft — bevormunde aber nie.",
    "- Übernimm den langweiligen Teil unsichtbar im Hintergrund: Formulare, Tabellen, Rückfragen zu Details. Langweile die Person nicht damit, wie aufwendig oder umfangreich das im Hintergrund gerade ist — nur das Ergebnis zählt für sie.",
    "- Sei präsent, nicht passiv: freundschaftlich, motivierend, mit echtem Interesse. Wenn dir aus dem Verlauf oder den Trackingdaten etwas auffällt (z. B. ein geplantes Training mehrere Tage nicht gemacht), sprich es von dir aus an — neugierig und konkret (\"Was ist los, wieso hat das Training diese Woche nicht geklappt? Sollen wir was dran ändern?\"), nicht anklagend.",
    "- Konstruktive Kritik ist erlaubt und gewünscht, wenn's mal nicht rund läuft — aber immer lösungsorientiert nach vorne, nie als Vorwurf nach hinten. Motivierend statt beschämend.",
    "- Kein schlechtes Gewissen erzeugen. Viele ADHSler tragen schon ein chronisches schlechtes Gewissen mit sich herum — deine Aufgabe ist, das abzunehmen, nicht zu verstärken. Kein Zeigefinger, kein Urteil — aber Ansprechen ist trotzdem erlaubt (und gewünscht), solange es unterstützend statt vorwurfsvoll klingt.",
    "- Plane, organisiere, behalte den Überblick über alle Lebensbereiche — die Person muss die Zusammenhänge zwischen Schlaf, Training, Ernährung, Supplementen und Tageslicht nicht selbst im Kopf zusammenhalten. Das übernimmst du.",
    "- Behalte im Hinterkopf: Gewohnheiten und Routinen halten meist erst, wenn die gesundheitliche Grundlage stimmt (regelmäßiger Schlaf, Bewegung, Morgenroutine, Hormonhaushalt). Wenn es an einer Stelle hakt, denk mit, ob die eigentliche Ursache woanders liegt, statt nur das Symptom zu behandeln.",
    "",
    "Antwort-Struktur & Prinzipien:",
    "1. Sofort auf den Punkt kommen: keine langen Einleitungen oder rhetorischen Fragen.",
    "2. Logistik abnehmen: wenn es um Mahlzeiten, Schlaf, Trinken oder Workouts geht, gib konkrete, vorgekaute Mikroschritte (\"Next Small Step\").",
    "3. Maximale Scannbarkeit: kurze Absätze, Fettdruck und klare Bullet Points.",
    "4. Wenn ein Plan/eine Übersicht (z. B. Trainingsplan, Ernährungs-Makros, Tagesablauf) sinnvoll ist, formatier sie klar mit Überschriften/Stichpunkten in normalem Fließtext — NIE als rohes JSON oder Code-Block in deiner sichtbaren Antwort (die strukturierte Übernahme passiert separat, erst wenn die Person aktiv auf \"Übernehmen\" tippt).",
    "",
    "Ziel: befreie das Gehirn der Person von der Planungs- und Denk-Last, damit sie ohne mentale Blockade direkt ins Handeln kommt — ohne ihr dabei die Kontrolle wegzunehmen.",
  ].join("\n");
}

function mitVollerPersona(coachName, rollenbeschreibung) {
  const name = coachName?.trim() || STANDARD_COACH_NAME;
  return `${coachPersonaBlock(name)}\n\n${rollenbeschreibung}`;
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
      "Du bist ein warmherziger, kurz angebundener Morgen-Assistent für Menschen mit ADHS. " +
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
    const system = mitVollerPersona(coachName, systemPrompt);
    const messages = verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text }));
    const antwort = await sendeAnfrage({ system, messages, json: false });
    return antwort.trim();
  },

  /**
   * Wie coachChat(), aber ruft onTeilantwort(bisherigerText) bei jedem
   * neuen Textstück auf (siehe sendeAnfrageStreamend()) — lässt den Chat
   * wortweise mitschreiben statt lange still zu stehen.
   *
   * @param {{systemPrompt: string, verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string, onTeilantwort: (text: string) => void}} params
   * @returns {Promise<string>}
   */
  async coachChatStreamend({ systemPrompt, verlauf, coachName, onTeilantwort }) {
    const system = mitVollerPersona(coachName, systemPrompt);
    const messages = verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text }));
    const antwort = await sendeAnfrageStreamend({ system, messages, onTeilantwort });
    return antwort.trim();
  },

  /**
   * Bestimmt, ob und zu welchem Themenbereich das bisherige Gespräch schon
   * konkret genug ist, um etwas zu übernehmen — für den globalen Coach auf
   * der Startseite, der (anders als die Bereichs-Chats) nicht von vornherein
   * weiß, worum es geht. Läuft im Hintergrund nach jeder Coach-Antwort, damit
   * der "Übernehmen"-Knopf nur dann erscheint, wenn es wirklich etwas zu
   * übernehmen gibt, statt schon nach der ersten Antwort auf eine Small-Talk-
   * Frage aufzutauchen.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{bereich: "gewohnheit"|"supplement"|"medikament"|"hydration"|"tageslicht"|"training"|"ernaehrung"|"keiner"}>}
   */
  async bereichErkennen({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Klassifikations-Assistent für eine bestehende App, kein Gesprächspartner.",
        "Analysiere das bisherige Gespräch und entscheide, ob es inhaltlich schon konkret genug ist,",
        "um es in genau einen der folgenden Themenbereiche zu übernehmen:",
        "gewohnheit (neue Gewohnheit/Routine), supplement (neues Supplement),",
        "medikament (neues Medikament/Hormon), hydration (Trinkziel/-erinnerungen),",
        "tageslicht (Tageslicht-/Freiluft-Ziel), training (Trainingsplan), ernaehrung (Rezepte/Mahlzeiten).",
        "Nutze 'keiner', wenn noch nichts Konkretes besprochen/vorgeschlagen wurde (z. B. reiner Small Talk oder eine allgemeine Frage ohne Vorschlag).",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        'Format exakt: { "bereich": "gewohnheit"|"supplement"|"medikament"|"hydration"|"tageslicht"|"training"|"ernaehrung"|"keiner" }',
      ].join(" ")
    );
    const messages = verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text }));
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    return { bereich: data.bereich || "keiner" };
  },

  /**
   * Extrahiert aus einem geführten Trainings-Gespräch (siehe coachChat())
   * den finalen, strukturierten Plan — gleiches JSON-Format wie
   * trainingsplanVorschlag(), damit sich das Ergebnis genauso direkt an
   * wochenplanHinzufuegen() weiterreichen lässt.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<Array<{wochentag: string, arten: string[], uebungenListe: Array<{name: string, saetze: string, wiederholungen: string, gewicht: string}>}>>}
   */
  async trainingsplanAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Trainingsplan-Assistent für eine bestehende App.",
        "Fasse das vorangegangene Gespräch jetzt als finalen Plan zusammen.",
        "Jede Übung bekommt ihre EIGENEN Sätze/Wiederholungen/Gewicht, nicht nur ein einziger Wert für die ganze Einheit.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "einheiten": [ { "wochentag": "Mo"|"Di"|"Mi"|"Do"|"Fr"|"Sa"|"So", ' +
          '"arten": string[] (nur aus: "Krafttraining","Cardio","Bodyweight","Sonstiges"), ' +
          '"uebungenListe": [ { "name": string, "saetze": string, "wiederholungen": string, ' +
          '"gewicht": string (z. B. "20 kg", leer wenn nicht genannt) } ] (leeres Array wenn keine einzelnen Übungen genannt wurden) } ] }',
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
   * Extrahiert aus einem geführten Morgen-/Abendroutine-Gespräch (siehe
   * coachChat()) eine fertige Kette von Routine-Schritten — Format entspricht
   * 1:1 dem, was routineSchrittHinzufuegen() je Schritt erwartet (siehe
   * useRoutineData.js), lässt sich also direkt in einer Schleife weiterreichen.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<Array<{name: string, dauerMin: number}>>}
   */
  async routineAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der eine Morgen- oder Abendroutine als feste Kette von Schritten anlegt.",
        "Fasse das vorangegangene Gespräch jetzt als fertige Schritt-Kette zusammen, in der besprochenen Reihenfolge.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "schritte": [ { "name": string, "dauerMin": number (Minuten, Schätzung falls nicht genannt, z. B. 2 oder 5) } ] }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse die oben besprochene Schritt-Kette jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!Array.isArray(data.schritte) || !data.schritte.length) throw new Error("Unerwartetes Format: 'schritte' fehlt oder ist leer.");
    return data.schritte;
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
   * der Zeiten entspricht dem, was ZeitErinnerungenCard erwartet
   * ({zeit, menge}), lässt sich also direkt an die bestehende Liste anhängen.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{zielMl: number|null, zeiten: Array<{zeit: string, menge: string}>, istZustandMenge: string, istZustandGetraenke: string}>}
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
          '"zeiten": [ { "zeit": "HH:MM", "menge": string (z. B. "300") } ] (leeres Array wenn keine Erinnerungszeiten besprochen wurden), ' +
          '"istZustandMenge": string (wie viel die Person laut Gespräch aktuell täglich trinkt, z. B. "ca. 1 Liter" — leer wenn nicht genannt), ' +
          '"istZustandGetraenke": string (was sie außer Wasser trinkt, z. B. "viel Kaffee, ab und zu Saft" — leer wenn nicht genannt) }',
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

  /**
   * Extrahiert aus einem geführten Supplement-Gespräch (siehe coachChat())
   * ein neues Supplement — Format entspricht dem, was supplementHinzufuegen()
   * erwartet (siehe SupplementeView.jsx: { name, tageszeiten, hinweis }).
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{name: string, tageszeiten: string[], hinweis: string}>}
   */
  async supplementAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der neue Supplemente für Nutzer anlegt.",
        "Fasse das vorangegangene Gespräch jetzt als fertiges Supplement zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string, "tageszeiten": string[] (nur aus: "Morgens","Mittags","Abends"), ' +
          '"hinweis": string (nur aus: "Zur Mahlzeit","Nüchtern","Vor dem Schlafen","Vor dem Training","Nach dem Training" — leer wenn nichts davon passt) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben besprochene Supplement jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.name || !Array.isArray(data.tageszeiten)) throw new Error("Unerwartetes Format: 'name'/'tageszeiten' fehlen.");
    return data;
  },

  /**
   * Extrahiert aus einem geführten Medikamenten-Gespräch (siehe coachChat())
   * ein neues Medikament/Hormon — Format entspricht dem, was
   * hormonHinzufuegen() erwartet (siehe MedikamenteView.jsx).
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{name: string, menge: string, kategorie: string, einnahmeart: string, intervallTyp: string, intervallDays: number, customDays: string, onDays: string, offDays: string, weekdays: string[], eigenerStart: string, uhrzeiten: string[]}>}
   */
  async medikamentAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der neue Medikamente/Hormone für Nutzer anlegt.",
        "Fasse das vorangegangene Gespräch jetzt als fertiges Medikament zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string, "menge": string (z. B. "50mg"), ' +
          '"kategorie": "Hormone"|"Blutdruck"|"Diabetes"|"Cholesterin"|"Schmerzmittel"|"Sonstige", ' +
          '"einnahmeart": "Injektion"|"Tablette (oral)"|"Kapsel"|"Pulver"|"Tropfen"|"Nasenspray", ' +
          '"intervallTyp": "fixed"|"custom"|"cycle"|"weekdays" (fixed = alle X Tage, custom = eigene Tagesanzahl, cycle = X Tage an/Y Tage ab, weekdays = feste Wochentage), ' +
          '"intervallDays": number (nur bei "fixed", sonst 1), "customDays": string (nur bei "custom"), ' +
          '"onDays": string, "offDays": string (nur bei "cycle"), "weekdays": string[] (nur bei "weekdays", aus "Mo","Di","Mi","Do","Fr","Sa","So"), ' +
          '"eigenerStart": string ("YYYY-MM-DD" falls genannt, sonst leer), "uhrzeiten": string[] (eine oder mehrere "HH:MM") }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben besprochene Medikament jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.name) throw new Error("Unerwartetes Format: 'name' fehlt.");
    return data;
  },

  /**
   * Extrahiert aus einem geführten Peptid-Gespräch (siehe coachChat()) ein
   * neues Peptid — gleiches Intervall-/Uhrzeiten-Format wie
   * medikamentAusChat(), aber ohne "kategorie" (die gibt es bei Peptiden
   * nicht, siehe PeptidView.jsx: addCustomPreparat() + setDoseBatch()).
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{name: string, menge: string, einnahmeart: string, intervallTyp: string, intervallDays: number, customDays: string, onDays: string, offDays: string, weekdays: string[], eigenerStart: string, uhrzeiten: string[]}>}
   */
  async peptidAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der neue Peptide für Nutzer anlegt.",
        "Fasse das vorangegangene Gespräch jetzt als fertiges Peptid zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string, "menge": string (z. B. "250mcg"), ' +
          '"einnahmeart": "Injektion"|"Tablette (oral)"|"Kapsel"|"Pulver"|"Tropfen"|"Nasenspray", ' +
          '"intervallTyp": "fixed"|"custom"|"cycle"|"weekdays" (fixed = alle X Tage, custom = eigene Tagesanzahl, cycle = X Tage an/Y Tage ab, weekdays = feste Wochentage), ' +
          '"intervallDays": number (nur bei "fixed", sonst 1), "customDays": string (nur bei "custom"), ' +
          '"onDays": string, "offDays": string (nur bei "cycle"), "weekdays": string[] (nur bei "weekdays", aus "Mo","Di","Mi","Do","Fr","Sa","So"), ' +
          '"eigenerStart": string ("YYYY-MM-DD" falls genannt, sonst leer), "uhrzeiten": string[] (eine oder mehrere "HH:MM") }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben besprochene Peptid jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.name) throw new Error("Unerwartetes Format: 'name' fehlt.");
    return data;
  },

  /**
   * Extrahiert aus einem geführten Schlaf-Gespräch (siehe coachChat()) einen
   * fertigen Schlaf-Eintrag — Format entspricht dem, was schlafHinzufuegen()
   * erwartet (siehe SchlafView.jsx).
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{stunden: number, schlafqualitaet: string, einschlafzeit: string, durchgeschlafen: boolean|null, erholt: boolean|null, traeume: string, bemerkungen: string}>}
   */
  async schlafAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der einen Schlaf-Eintrag für die letzte Nacht erfasst.",
        "Fasse das vorangegangene Gespräch jetzt als fertigen Schlaf-Eintrag zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "stunden": number (Schlafdauer in Stunden, z. B. 7.5), ' +
          '"schlafqualitaet": string (z. B. "Gut","Mittel","Schlecht" — leer wenn nicht genannt), ' +
          '"einschlafzeit": string ("HH:MM" falls genannt, sonst leer), ' +
          '"durchgeschlafen": boolean|null (null wenn nicht besprochen), "erholt": boolean|null (null wenn nicht besprochen), ' +
          '"traeume": string (kurz, leer wenn nichts erzählt), "bemerkungen": string (sonstiges, leer wenn nichts) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse den oben besprochenen Schlaf-Eintrag jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (typeof data.stunden !== "number") throw new Error("Unerwartetes Format: 'stunden' fehlt oder ist keine Zahl.");
    return data;
  },

  /**
   * Extrahiert aus einem frei geführten Onboarding-Gespräch (Phase 2 der
   * Coach-Begleitung, siehe OnboardingCoachFreitext.jsx) Name, Ziele und
   * persönliche Daten — Gegenstück zu OnboardingCoachGuide.jsx (Phase 1,
   * feste Frage-für-Frage-Sequenz), hier antwortet die Person frei und in
   * beliebiger Reihenfolge, die KI ordnet danach zu.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string, zieleOptionen: string[]}} params
   * @returns {Promise<{name: string, ziele: string[], geschlecht: string, geburtsdatum: string, groesse: string, gewichtStart: string}>}
   */
  async onboardingAusChat({ verlauf, coachName, zieleOptionen }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der aus einem frei geführten Einrichtungsgespräch die genannten Angaben herausliest.",
        "Fasse das vorangegangene Gespräch jetzt zusammen — nur das, was die Person tatsächlich genannt hat, nichts erfinden.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string (leer wenn nicht genannt), ' +
          `"ziele": string[] (nur aus dieser Liste: ${zieleOptionen.join(", ")} — leeres Array wenn nichts genannt), ` +
          '"geschlecht": "Weiblich"|"Männlich"|"Divers"|"" (leer wenn nicht genannt), ' +
          '"geburtsdatum": string ("YYYY-MM-DD" falls genannt, sonst leer), ' +
          '"groesse": string (Größe in cm, nur die Zahl, leer wenn nicht genannt), ' +
          '"gewichtStart": string (Gewicht in kg, nur die Zahl, leer wenn nicht genannt) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse das oben Besprochene jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    return parseJsonAntwort(antwort);
  },

  /**
   * Extrahiert aus einem Gespräch über den Schlafrhythmus (Onboarding-
   * Kategorien-Schritt "Schlaf", siehe OnboardingCategoriesView.jsx) eine
   * gewünschte Bett-/Aufwachzeit — anders als schlafAusChat() geht es hier
   * um ein Ziel/Rhythmus, nicht um einen Eintrag für eine bestimmte Nacht.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{bettzeit: string, aufwachzeit: string, istZustand: string}>}
   */
  async schlafzielAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der beim Einrichten eines gewünschten Schlafrhythmus hilft (übliche Bett- und Aufwachzeit, nicht ein einzelner Eintrag für eine Nacht).",
        "Fasse das vorangegangene Gespräch jetzt zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        'Format exakt: { "bettzeit": string ("HH:MM"), "aufwachzeit": string ("HH:MM"), ' +
          '"istZustand": string (Zusammenfassung, wie der aktuelle/bisherige Schlaf der Person laut Gespräch ist — z. B. "unruhig, wacht oft auf, schläft meist erst nach 23 Uhr ein" — leer wenn nichts dazu gesagt wurde) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse den oben besprochenen Schlafrhythmus jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    return parseJsonAntwort(antwort);
  },

  /**
   * Extrahiert aus einem Gespräch über eine geplante Mahlzeit (Onboarding-
   * Kategorien-Schritt "Ernährung", siehe OnboardingCategoriesView.jsx)
   * Name, Zutaten, Wochentage und Uhrzeit — anders als
   * ernaehrungsplanAusChat() (mehrere fertige Rezepte mit Nährwerten) geht
   * es hier um einen einzelnen Mahlzeit-Slot im Wochenplan.
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{name: string, zutaten: Array<{name: string, menge: string}>, wochentage: string[], uhrzeit: string, istZustand: string}>}
   */
  async mahlzeitplanAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der eine Mahlzeit für den Wochenplan einrichtet.",
        "Fasse das vorangegangene Gespräch jetzt zusammen.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "name": string, "zutaten": [ { "name": string, "menge": string } ] (leeres Array wenn keine genannt), ' +
          '"wochentage": string[] (aus "Mo","Di","Mi","Do","Fr","Sa","So" — alle 7, wenn "täglich" gesagt wurde), ' +
          '"uhrzeit": string ("HH:MM", Standard "08:00" wenn nicht genannt), ' +
          '"istZustand": string (Zusammenfassung, wie sich die Person laut Gespräch aktuell ernährt — leer wenn nichts dazu gesagt wurde) }',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse die oben besprochene Mahlzeit jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.name) throw new Error("Unerwartetes Format: 'name' fehlt.");
    return data;
  },

  /**
   * Extrahiert aus einem Gespräch über Laborwerte (Onboarding-Schritt
   * "Laborwerte", siehe OnboardingLaborwerteView.jsx / ProfilTab) die
   * genannten Werte als flache Name→Wert-Liste — Format entspricht dem,
   * was setBiomarkerWert() erwartet (ein Aufruf je Wert).
   *
   * @param {{verlauf: Array<{rolle: "nutzer"|"coach", text: string}>, coachName?: string}} params
   * @returns {Promise<{werte: Record<string, string>}>}
   */
  async laborwerteAusChat({ verlauf, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du bist ein Assistent für eine bestehende App, der genannte Laborwerte erfasst.",
        "Fasse das vorangegangene Gespräch jetzt zusammen — nur Werte, die die Person tatsächlich genannt hat.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        "Format exakt:",
        '{ "werte": { [laborwertName: string]: string } } (Schlüssel ist der übliche Name des Laborwerts, z. B. "Vitamin D", "Testosteron gesamt", "TSH" — Wert ist die genannte Zahl inkl. Einheit falls genannt, z. B. "45 ng/ml")',
      ].join(" ")
    );
    const messages = [
      ...verlauf.map((e) => ({ role: e.rolle === "coach" ? "assistant" : "user", content: e.text })),
      { role: "user", content: "Fasse die oben genannten Laborwerte jetzt als JSON zusammen, wie vereinbart." },
    ];
    const antwort = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwort);
    if (!data.werte || typeof data.werte !== "object") throw new Error("Unerwartetes Format: 'werte' fehlt.");
    return data;
  },

  /**
   * Bereinigt eine gesprochene oder getippte Antwort auf EINE einzelne
   * Onboarding-Frage (siehe OnboardingCoachGuide.jsx) zum reinen Feldwert —
   * z. B. "ich wiege ungefähr 75 Kilo" → "75". Anders als die …AusChat-
   * Funktionen kein ganzes Gespräch, sondern eine einzelne Frage/Antwort,
   * damit die Person das Ergebnis vor dem Speichern noch bestätigen kann.
   *
   * @param {{frage: string, antwort: string, feldTyp: "text"|"number", coachName?: string}} params
   * @returns {Promise<{wert: string}>}
   */
  async feldAntwortInterpretieren({ frage, antwort, feldTyp, coachName }) {
    const system = mitPersona(
      coachName,
      [
        "Du hilfst dabei, eine gesprochene oder getippte Antwort auf eine einzelne Frage in einem Formularfeld zu erfassen.",
        `Die gestellte Frage war: "${frage}"`,
        `Erwarteter Feldtyp: ${feldTyp === "number" ? "eine Zahl, ohne Einheit" : "ein kurzer Text"}.`,
        "Extrahiere aus der Antwort NUR den eigentlichen Wert für dieses Feld, ohne Füllwörter, ohne ganze Sätze.",
        "Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Fließtext davor oder danach.",
        'Format exakt: { "wert": string }',
      ].join(" ")
    );
    const messages = [{ role: "user", content: antwort }];
    const antwortJson = await sendeAnfrage({ system, messages, json: true });
    const data = parseJsonAntwort(antwortJson);
    return { wert: (data.wert ?? antwort).toString() };
  },
};
