import React from "react";
import { accentSoft } from "./theme";
import { tagebuchZeile } from "../utils/tagebuch";

// Bestätigung nach "Übernehmen" in Aka (ui/Aka.jsx) — eine Anzeige für
// alle Bereiche, passend zu dem, was useUniversellerCoach() zurückgibt.
function Box({ children }) {
  return <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>{children}</div>;
}

export default function AkaErgebnis({ ergebnis }) {
  if (!ergebnis?.bereich) return <Box>Ich konnte noch nichts Konkretes zum Übernehmen finden — magst du genauer sagen, worum es gehen soll?</Box>;
  const { bereich, daten } = ergebnis;
  switch (bereich) {
    case "gewohnheit":
      return (
        <Box>
          "{daten.name}" wurde angelegt{daten.uhrzeit ? ` · ${daten.uhrzeit} Uhr` : daten.urzeitVon ? ` · ${daten.urzeitVon}–${daten.urzeitBis} Uhr` : ""}
          {daten.menge ? ` · ${daten.menge}` : ""}
        </Box>
      );
    case "supplement":
      return (
        <Box>
          "{daten.name}" wurde angelegt · {(daten.tageszeiten || []).join(", ")}
          {daten.hinweis ? ` · ${daten.hinweis}` : ""}
        </Box>
      );
    case "medikament":
      return (
        <Box>
          "{daten.name}" wurde angelegt · {daten.kategorie}
          {daten.menge ? ` · ${daten.menge}` : ""}
        </Box>
      );
    case "hydration":
      return (
        <Box>
          {daten.zielMl ? `Tagesziel auf ${daten.zielMl} ml gesetzt. ` : ""}
          {daten.zeiten.length > 0 ? `${daten.zeiten.length} neue Erinnerungszeit${daten.zeiten.length === 1 ? "" : "en"} hinzugefügt.` : ""}
        </Box>
      );
    case "tageslicht":
      return <Box>Tagesziel auf {daten.zielMinuten} Minuten gesetzt.</Box>;
    case "training":
      return (
        <Box>
          {daten.length} Einheit{daten.length === 1 ? "" : "en"} in den Wochenplan übernommen.
        </Box>
      );
    case "ernaehrung":
      return (
        <Box>
          {daten.length} Rezept{daten.length === 1 ? "" : "e"} als Mahlzeiten angelegt.
        </Box>
      );
    case "schlaf":
      return (
        <Box>
          Schlaf-Eintrag mit {daten.stunden} h gespeichert{daten.schlafqualitaet ? ` (${daten.schlafqualitaet})` : ""}.
        </Box>
      );
    case "workflow":
      return (
        <Box>
          "{daten.name}" wurde angelegt · {daten.arbeitMin} Min. Arbeit / {daten.pauseMin} Min. Pause
          {daten.uhrzeit ? ` · ${daten.uhrzeit} Uhr` : ""}
        </Box>
      );
    case "morgenroutine":
    case "abendroutine":
      return (
        <Box>
          {daten.length} Schritt{daten.length === 1 ? "" : "e"} zur {bereich === "morgenroutine" ? "Morgenroutine" : "Abendroutine"} hinzugefügt:{" "}
          {daten.map((s) => s.name).join(", ")}
        </Box>
      );
    case "atemroutine":
      return <Box>Atem-Zeiten angelegt: {daten.map((z) => `${z.uhrzeit} ${z.name} (${z.dauerMinuten} Min.)`).join(", ")}. Sie stehen jetzt unter „Als Nächstes“.</Box>;
    case "tagebuch":
      return <Box>Im Tagebuch festgehalten: {tagebuchZeile(daten)}{daten.notiz ? " · 🔒 Notiz (privat)" : ""}</Box>;
    case "schichtplan":
      return (
        <Box>
          Zeiten je Schicht gespeichert: {daten.varianten.map((v) => `${v.name} (☀ ${v.morgenStart || "–"} · 🌙 ${v.abendStart || "–"})`).join(", ")}
          {daten.planText ? ` · Schichtplan ${daten.planText}` : ""}. Anpassen unter „📅 Plan“ auf der Startseite.
        </Box>
      );
    default:
      return null;
  }
}
