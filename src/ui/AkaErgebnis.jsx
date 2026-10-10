import React, { useState } from "react";
import { accentSoft } from "./theme";
import { tagebuchZeile } from "../utils/tagebuch";

// Bestätigung nach "Übernehmen" in Aka (ui/Aka.jsx) — eine Anzeige für
// alle Bereiche, passend zu dem, was useUniversellerCoach() zurückgibt.
function Box({ children }) {
  return <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>{children}</div>;
}

const datumKurz = (d) => {
  const [j, m, t] = String(d).split("-");
  return t ? `${t}.${m}.${j}` : d;
};

// Löschen nie ohne Rückfrage (10.10.): Aka findet den Eintrag, gelöscht wird
// erst nach „Ja, löschen“.
function LoeschenFrage({ ergebnis }) {
  const [stand, setStand] = useState("frage");
  const [fehler, setFehler] = useState(null);
  const { typName, name } = ergebnis.daten;
  if (stand === "fertig") return <Box>🗑 {typName} „{name}“ gelöscht.</Box>;
  if (stand === "nein") return <Box>Okay, „{name}“ bleibt.</Box>;
  const knopf = { border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
  return (
    <Box>
      <div data-aka-loeschen-frage>
        Soll ich {typName} „{name}“ wirklich löschen?
      </div>
      {fehler && <div style={{ color: "#C0392B", marginTop: 4 }}>{fehler}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          disabled={stand === "laeuft"}
          onClick={async () => {
            setStand("laeuft");
            setFehler(null);
            try {
              await ergebnis.bestaetigen();
              setStand("fertig");
            } catch (e) {
              setFehler(e.message);
              setStand("frage");
            }
          }}
          style={{ ...knopf, background: "#C0392B", color: "#fff" }}
        >
          Ja, löschen
        </button>
        <button type="button" onClick={() => setStand("nein")} style={{ ...knopf, background: "transparent", color: "inherit", border: "1px solid currentColor" }}>
          Nein
        </button>
      </div>
    </Box>
  );
}

export default function AkaErgebnis({ ergebnis }) {
  if (!ergebnis?.bereich) return <Box>Ich konnte noch nichts Konkretes zum Übernehmen finden — magst du genauer sagen, worum es gehen soll?</Box>;
  const { bereich, daten } = ergebnis;
  switch (bereich) {
    // Direkte Befehle (10.10., „Aka wie Siri“).
    case "oeffnen":
      return <Box>„{daten.name}“ ist geöffnet.</Box>;
    case "wasser":
      return <Box>💧 {daten.ml} ml Wasser eingetragen.</Box>;
    case "tageslicht-log":
      return <Box>☀️ {daten.minuten} Min. Tageslicht eingetragen.</Box>;
    case "abgehakt":
      return <Box>✓ Abgehakt: {daten.join(", ")}</Box>;
    case "geaendert":
      return <Box>✏️ „{daten.name}“ geändert: {daten.was.join(" · ")}</Box>;
    case "gegessen":
      return <Box>🍽️ „{daten.text}“ eingetragen · ≈ {daten.kcal} kcal · {daten.eiweiss} g Eiweiß</Box>;
    case "einnahme":
      return <Box>⚡ {daten.name} festgehalten (zusätzlich zum Plan).</Box>;
    case "nickerchen":
      return <Box>😴 Nickerchen {daten.minuten} Min. festgehalten.</Box>;
    case "gestartet":
      return <Box>▶ {daten.name} gestartet.</Box>;
    case "verschoben":
      return <Box>📅 „{daten.titel}“ liegt jetzt auf dem {datumKurz(daten.datum)}.</Box>;
    case "startzeit":
      return <Box>⏰ {daten.routine === "morgen" ? "Morgenroutine" : "Abendroutine"} startet jetzt um {daten.uhrzeit} Uhr.</Box>;
    case "loeschen-frage":
      return <LoeschenFrage ergebnis={ergebnis} />;
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
    case "fokus":
      return (
        <Box>
          🎯 Fokus-Runde läuft: {daten.ziel || "deine Sache"} · {daten.dauerMinuten} Min. Handy weg, ich melde mich, wenn die Zeit um ist. Wer aus dem Team gerade dabei ist, siehst du unter „Gemeinsam fokussieren“.
        </Box>
      );
    case "matrix":
      return <Box>🗂️ In der Aufgaben-Matrix: {daten.map((a) => `${a.titel}${a.uhrzeit ? ` (${a.uhrzeit})` : ""}`).join(" · ")}. Die Farbe ergibt sich von selbst, Rotes steht heute im Tagesplan.</Box>;
    case "alltag":
      return (
        <Box>
          🗓️ Im Kalender „Mein Alltag“: {daten.map((e) => `${e.titel} ${e.datum ? e.datum.split("-").reverse().join(".") : e.wochentage.join(", ")} ${e.start}–${e.ende}`).join(" · ")}
          {ergebnis.konflikte?.length > 0 && (
            <div data-aka-konflikt style={{ marginTop: 6 }}>
              ⚠️ Achtung: {ergebnis.konflikte.map((k) => `„${k.eintrag}“ überschneidet sich mit ${k.mit} (${k.tag} ${String(Math.floor(k.von / 60)).padStart(2, "0")}:${String(k.von % 60).padStart(2, "0")})`).join("; ")}. Sag mir eine andere Zeit, oder tippe den Eintrag im Kalender an und ändere ihn.
            </div>
          )}
        </Box>
      );
    case "aussehen":
      return <Box>{daten.abendsDunkel ? "🌙 Ab deiner Abendroutine wird die App jetzt dunkel." : "☀️ Die App bleibt jetzt auch abends hell."} Ändern kannst du das jederzeit unter Mehr → Aussehen.</Box>;
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
