import React from "react";
import KiChat from "./KiChat";
import AkaErgebnis from "./AkaErgebnis";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";
import { getCoachName } from "../utils/coachStorage";

// Aka — EIN Assistent für die ganze App (Nutzerinnen-Wunsch 23.09.: "so
// darstellen, als wenn Aka von Anfang an auf allen Seiten über den gleichen
// Code, die gleiche Systematik verfügbar gewesen wäre"). Früher hatte jede
// Bereichsseite ihren eigenen KiChat mit eigener, kopierter Speicher-Logik,
// und nur die restlichen Seiten bekamen einen universellen Aka.
//
// Jetzt wird Aka genau einmal zentral gemountet (AuthenticatedApp.jsx), auf
// jeder Seite gleich:
// - dieselbe Aktions-Logik überall (useUniversellerCoach): Aka kann auf jeder
//   Seite in jeden Bereich eintragen, auch Routine-Schritte;
// - die Seite gibt nur den Fokus vor: kurzer Gesprächsschwerpunkt im Prompt,
//   passende Begrüßung und den Verlaufs-Schlüssel (`bereich`). Unter diesem
//   Schlüssel liegen der gespeicherte Chatverlauf und die bereichsbezogenen
//   Admin-Hinweise; die Schlüssel sind dieselben wie früher bei den
//   Einzel-Chats, bestehende Verläufe bleiben also erhalten.
//   Seiten ohne eigenen Fokus teilen sich den allgemeinen Verlauf "home".
//
// Coachees sehen Aka wie bisher nicht (Gate in KiChat.jsx). Die geführte
// KI-Einrichtung im Onboarding hat eigene Chats und läuft nicht hierüber.

const ALLGEMEIN = {
  bereich: "home",
  fokus: null,
  begruessung: "Frag mich was — ich kann dir auch direkt bei jedem Bereich der App helfen, z. B. eine neue Gewohnheit anlegen, ein Supplement hinzufügen oder einen Trainingsplan aufstellen.",
};

const AKA_SEITEN = {
  home: ALLGEMEIN,
  tagesplan: {
    bereich: "home",
    fokus: "Die Person schaut gerade auf ihren Tagesplan — beantworte Fragen zu ihrem Tag bevorzugt.",
    begruessung: "Frag mich was zu deinem Tag, oder ich helf dir direkt bei jedem Bereich der App weiter.",
  },
  wochenuebersicht: {
    bereich: "home",
    fokus: "Die Person schaut gerade auf ihre Wochenübersicht — beantworte Fragen zu ihrer Woche bevorzugt.",
    begruessung: "Frag mich was zu deiner Woche, oder ich helf dir direkt bei jedem Bereich der App weiter.",
  },
  routinen: {
    bereich: "gewohnheiten",
    fokus:
      "Die Person ist gerade bei ihren Gewohnheiten/Routinen. Für eine neue Gewohnheit: frag nach, was noch fehlt (Uhrzeit oder Zeitfenster, Umfang/Menge, Zieltage oder offen fortlaufend). Für einen Workflow (Arbeits-/Pause-Intervalle): Name, Arbeits- und Pausenintervall in Minuten, Gesamtdauer, optional feste Wochentage/Uhrzeit.",
    begruessung: "Welche Gewohnheit möchtest du dir aufbauen — oder soll ich dir einen Workflow mit Arbeits- und Pausenzeiten einrichten?",
  },
  morgenroutine: {
    bereich: "morgenroutine",
    fokus:
      "Die Person ist gerade bei ihrer Morgenroutine. Hilf, sie als feste Kette von 3–6 kurzen Schritten aufzubauen: frag, was sie morgens sowieso schon macht (kein Neuanfang von null), in welcher Reihenfolge und wie lange jeder Schritt ungefähr dauert.",
    begruessung: "Lass uns deine Morgenroutine als feste Schritt-Kette aufbauen — was machst du morgens sowieso schon?",
  },
  abendroutine: {
    bereich: "abendroutine",
    fokus:
      "Die Person ist gerade bei ihrer Abendroutine. Hilf, sie als feste Kette von 3–6 kurzen Schritten aufzubauen: frag, was sie abends sowieso schon macht (kein Neuanfang von null), in welcher Reihenfolge und wie lange jeder Schritt ungefähr dauert.",
    begruessung: "Lass uns deine Abendroutine als feste Schritt-Kette aufbauen — was machst du abends sowieso schon?",
  },
  supplemente: {
    bereich: "supplemente",
    fokus:
      "Die Person ist gerade bei ihren Supplementen. Für ein neues Supplement: frag nach Tageszeit(en) (Morgens/Mittags/Abends) und ob es einen Hinweis gibt (zur Mahlzeit, nüchtern, vor/nach dem Training), falls das noch fehlt.",
    begruessung: "Welches Supplement möchtest du hinzufügen?",
  },
  medikamente: {
    bereich: "medikamente",
    fokus:
      "Die Person ist gerade bei ihren Medikamenten. Für ein neues Medikament: frag nach Dosierung/Menge, Einnahmeart (Injektion, Tablette, Kapsel, Pulver, Tropfen, Nasenspray, bei Cannabis: Blüte zum Rauchen/Verdampfen, Esswaren), Kategorie, Rhythmus (täglich, alle X Tage, bestimmte Wochentage oder Zyklus wie 'X Tage nehmen, Y Tage Pause') und Uhrzeit(en). THC-/CBD-Gehalt und Konsum-Details trägt die Person danach manuell im Formular nach.",
    begruessung: "Welches Medikament möchtest du hinzufügen?",
  },
  hydration: {
    bereich: "hydration",
    fokus: "Die Person ist gerade im Bereich Wasser (Trinken). Für ein Trinkziel: frag, wie viel sie aktuell trinkt und wann sie erinnert werden möchte.",
    begruessung: "Wie viel trinkst du aktuell am Tag, und wann möchtest du an Wasser erinnert werden?",
  },
  tageslicht: {
    bereich: "tageslicht",
    fokus:
      "Die Person ist gerade bei Tageslicht. Für ein Tagesziel in Minuten: frag, wie viel Zeit sie aktuell draußen verbringt (z. B. Bürojob vs. viel unterwegs) und was realistisch machbar wäre.",
    begruessung: "Wie viel Zeit verbringst du aktuell so am Tag draußen im Tageslicht?",
  },
  schlaf: {
    bereich: "schlaf",
    fokus:
      "Die Person ist gerade bei Schlaf. Für einen Eintrag zur letzten Nacht: frag nach Schlafdauer, Schlafqualität, ob durchgeschlafen und erholt aufgewacht wurde — Träume und Bemerkungen sind optional.",
    begruessung: "Wie hast du geschlafen?",
  },
  training: {
    bereich: "training",
    fokus:
      "Die Person ist gerade beim Training. Sei ein erfahrener, geduldiger Trainingscoach: hilf, einen passenden Trainingsplan zu entwickeln, frag nach Erfahrung, verfügbaren Tagen und Zielen, mach konkrete Vorschläge und geh auf Korrekturen ein.",
    begruessung: "Erzähl mir, wie dein Training aussehen soll — z. B. Erfahrungslevel, wie viele Tage pro Woche du Zeit hast und worauf du Lust hast (Kraft, Cardio, Bodyweight, …).",
  },
  ernaehrung: {
    bereich: "ernaehrung",
    fokus:
      "Die Person ist gerade bei Ernährung. Sei ein erfahrener, geduldiger Ernährungscoach: hilf, passende Rezepte zu finden, nutze die Profil-/Check-in-Daten aus der Zusammenfassung und frag nach Vorlieben, Abneigungen, Unverträglichkeiten oder Zeitaufwand, wenn relevant.",
    begruessung: "Worauf hast du Lust, oder was für Ziele hast du bei der Ernährung?",
  },
};

const GRUNDPROMPT =
  "Du bist der Assistent einer App zur Selbstverwaltung von Gesundheits- und ADHS-Routinen (Supplemente, Medikamente, Training, Schlaf, Ernährung, Wasser/Trinken, Tageslicht, Gewohnheiten, Morgen-/Abendroutine, Workflows). Beantworte Fragen zu jedem Bereich. Nutze die mitgegebene Zusammenfassung der Trackingdaten, um Zusammenhänge zwischen den Bereichen anzusprechen, wenn es zur Frage passt. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, Rezepte, ein Schlaf-Eintrag für die letzte Nacht, ein Workflow-Preset, Schritte für die Morgen-/Abendroutine), frag von dir aus alle nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — egal, auf welcher Seite die Person gerade ist. Antworte immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.";

function akaSeite(view) {
  return AKA_SEITEN[view] || ALLGEMEIN;
}

export default function Aka({ view }) {
  const { handleBereitschaftPruefen, handleUniverselleUebernahme } = useUniversellerCoach();
  const seite = akaSeite(view);
  return (
    <KiChat
      // Neuer Verlaufs-Schlüssel → Chat frisch mit dem passenden Verlauf laden.
      key={seite.bereich}
      bereich={seite.bereich}
      systemPrompt={seite.fokus ? `${GRUNDPROMPT}\n\nAktuelle Seite: ${seite.fokus}` : GRUNDPROMPT}
      einleitung={`Hi, ich bin ${getCoachName()}! ${seite.begruessung}`}
      pruefeBereitschaft={handleBereitschaftPruefen}
      onUebernehmen={handleUniverselleUebernahme}
      uebernehmenLabels={BEREICH_LABELS}
      renderErgebnis={(ergebnis) => <AkaErgebnis ergebnis={ergebnis} />}
    />
  );
}
