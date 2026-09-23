import React from "react";
import KiChat from "./KiChat";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";
import { getCoachName } from "../utils/coachStorage";

// Aka auf JEDER Seite (Nutzerinnen-Wunsch 23.09.: "schade, dass ich die KI
// nicht in allen Bereichen heranziehen kann" — z. B. unter "Mehr",
// im Archiv, bei Bildschirmzeit, Lexikon, Atemübungen oder im Admin-
// Bereich verschwand der Orb). Seiten mit eigenem, fachlich zugeschnittenem
// Aka (Home, Tagesplan, die Bereichs-Seiten in "Alle Pläne") behalten ihren
// eigenen; alle übrigen bekommen hier denselben universellen Aka wie im
// Tagesplan, der in jeden Bereich der App eintragen kann. Coachees sehen
// ihn wie überall nicht (Gate in KiChat.jsx).
export default function GlobalerAka() {
  const { handleBereitschaftPruefen, handleUniverselleUebernahme } = useUniversellerCoach();
  return (
    <KiChat
      systemPrompt="Du bist ein hilfsbereiter Assistent für eine App zur Selbstverwaltung von Gesundheits- und ADHS-Routinen. Beantworte Fragen zu jedem Bereich der App. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein neues Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, neue Rezepte, ein Schlaf-Eintrag für die letzte Nacht, ein neues Workflow-Preset), frag von dir aus alle dafür nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — antworte dabei immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
      einleitung={`Hi, ich bin ${getCoachName()}! Frag mich einfach, oder ich richte direkt etwas für dich ein.`}
      pruefeBereitschaft={handleBereitschaftPruefen}
      onUebernehmen={handleUniverselleUebernahme}
      uebernehmenLabels={BEREICH_LABELS}
    />
  );
}
