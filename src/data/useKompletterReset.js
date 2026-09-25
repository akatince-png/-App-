import { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Alle Tabellen, die beim kompletten Zurücksetzen geleert werden (12.09.,
// Nutzerin-Vorgabe: "Ich muss doch alles auf Null setzen können und neue
// Protokolle starten können, kann ich nicht" — die einzelnen Lösch-Wege je
// Kategorie/Archiv/Protokolle reichen ihr nicht, sie will als Admin einen
// einzigen Knopf für einen kompletten Neustart). Bewusst NUR Protokoll-/
// Tracking-Daten (Konfiguration + Logs je Kategorie) — NICHT: das Konto/
// Profil selbst (`profiles`, sonst bräuchte sie einen neuen Account), Team-
// Daten (gehören nicht nur ihr), Spotify-Verbindung/Playlists (keine
// "Protokoll"-Daten, müsste sie sonst neu verknüpfen), Push-Geräte-
// Registrierung, Coach-Wissen (globale Wissensbasis), Übungsbilder-Katalog,
// Quest-Katalog (nur der eigene Fortschritt wäre relevant, aber es gibt
// aktuell keine Quest-Fortschritt-Tabelle mit eigenem Löschpfad) und
// Nachrichten an den Coach (Kommunikationsverlauf, kein Tracking).
//
// `protocol_peptide` fehlt bewusst in der expliziten Liste: die Zeilen
// hängen per Fremdschlüssel an `protocols` (on delete cascade, siehe
// Migration 0001) und werden beim Löschen der zugehörigen protocols-Zeile
// automatisch mitentfernt — eine zusätzliche explizite Löschung wäre nur
// redundant.
// Reihenfolge bewusst "Kind-Tabellen vor Eltern-Tabellen" (z. B.
// meal_ingredients/meal_wochenplan vor meals, teilprotokolle vor
// hauptprotokolle) und nacheinander statt parallel abgearbeitet — auch
// wenn die meisten Fremdschlüssel in dieser App "on delete cascade"
// verwenden (ein Löschen der Eltern-Zeile würde die Kinder ohnehin
// automatisch mitnehmen), ist das sicherer, als sich bei über 40 Tabellen
// blind auf ausnahmslos jede Fremdschlüssel-Definition zu verlassen.
const RESET_TABELLEN = [
  "hormone_logs",
  "supplement_logs",
  "meal_logs",
  "meal_wochenplan",
  "meal_ingredients",
  "peptide_logs",
  "routine_schritt_logs",
  "routine_durchlaeufe",
  "routine_logs",
  "hydration_logs",
  "tageslicht_logs",
  "bildschirmzeit_logs",
  "training_sessions",
  "training_wochenplan",
  "sleep_entries",
  "checkins",
  "blutwerte_archiv",
  "aenderungsprotokoll",
  "baustein_versionen",
  "wochenprotokoll_snapshots",
  "teilprotokolle",
  "errungenschaften",
  "atemuebung_logs",
  "tagebuch_eintraege",
  "moment_eintraege",
  "denkpause_ergebnisse",
  "akutmodus_log",
  "drink_logs",
  "drink_recipe_ingredients",
  "zeitbloecke",
  "tagesplan_ausnahmen",
  "hormones",
  "supplements",
  "meals",
  "protocols",
  "hauptprotokolle",
  "routine_schritte",
  "routine_einstellungen",
  // Schichtarbeit (25.09.): Plan vor den Varianten.
  "routine_schichtplan",
  "routine_varianten",
  // Lücken geschlossen (24.09.): Quest-Fortschritt, Routine-Zuordnungen
  // und eigene Atemübungen blieben beim kompletten Reset bisher stehen.
  "quest_fortschritt",
  "routine_hormon_items",
  "routine_meal_items",
  "routine_peptide_items",
  "routine_supplement_items",
  "atemuebungen",
  "atem_zeiten",
  "routines",
  "hydration_settings",
  "tageslicht_settings",
  "bildschirmzeit_settings",
  "training_templates",
  "training_programme",
  "workflow_plaene",
  "workflow_presets",
  "biomarkers",
  "custom_messwerte",
  "projekte",
  "drink_recipes",
];

// "Nur Fortschritt auf Null" (24.09., Nutzerinnen-Wunsch: "von Null an neu
// anfangen", ohne alles neu einrichten zu müssen): löscht alles, woraus
// Punkte, Level, Serien, Abzeichen, Gehirn und Verläufe berechnet werden —
// die Einrichtung (Medikamente, Supplemente, Mahlzeiten, Routinen,
// Gewohnheiten, Trainingspläne, Ziele, Protokolle) bleibt. Bewusst NICHT
// gelöscht: Blutwerte-Archiv (medizinische Werte), Änderungsprotokoll/
// Baustein-Versionen (Historie der Einrichtung), Nachrichten, Tagebuch.
// Trainings: nur Einträge bis heute (künftig geplante bleiben).
// Hinweis RLS: quest_fortschritt und wochenprotokoll_snapshots darf laut
// Datenbank-Regeln nur ein Admin löschen — bei Coachees bleiben sie still
// stehen (gewollt: Quest-Fortschritt/Wochenprotokolle sind auch Daten des
// Coaches).
const FORTSCHRITT_TABELLEN = [
  "hormone_logs",
  "supplement_logs",
  "meal_logs",
  "peptide_logs",
  "routine_schritt_logs",
  "routine_durchlaeufe",
  "routine_logs",
  "hydration_logs",
  "tageslicht_logs",
  "bildschirmzeit_logs",
  "sleep_entries",
  "checkins",
  "atemuebung_logs",
  "denkpause_ergebnisse",
  "akutmodus_log",
  "drink_logs",
  "wochenprotokoll_snapshots",
  "quest_fortschritt",
  "errungenschaften",
];

function heuteIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useKompletterReset(userId) {
  const fortschrittZuruecksetzen = useCallback(async () => {
    const fehlgeschlagen = [];
    for (const tabelle of FORTSCHRITT_TABELLEN) {
      const { error } = await supabase.from(tabelle).delete().eq("user_id", userId);
      if (error) {
        console.error(tabelle, error);
        fehlgeschlagen.push(tabelle);
      }
    }
    const heute = heuteIso();
    const { error: trainingFehler } = await supabase.from("training_sessions").delete().eq("user_id", userId).lte("datum", heute);
    if (trainingFehler) {
      console.error(trainingFehler);
      fehlgeschlagen.push("training_sessions");
    }
    // Laufende Protokolle beginnen heute neu — sonst zählen Wochen-/
    // Monatsansicht die leeren Tage seit dem alten Start als Pausen.
    const { error: startFehler } = await supabase.from("hauptprotokolle").update({ startdatum: heute }).eq("user_id", userId).eq("status", "active");
    if (startFehler) {
      console.error(startFehler);
      fehlgeschlagen.push("hauptprotokolle (Startdatum)");
    }
    if (fehlgeschlagen.length > 0) {
      return { ok: false, error: `Nicht alles konnte zurückgesetzt werden: ${fehlgeschlagen.join(", ")}` };
    }
    return { ok: true };
  }, [userId]);

  const allesZuruecksetzen = useCallback(async () => {
    const fehlgeschlagen = [];
    for (const tabelle of RESET_TABELLEN) {
      const { error } = await supabase.from(tabelle).delete().eq("user_id", userId);
      if (error) {
        console.error(tabelle, error);
        fehlgeschlagen.push(tabelle);
      }
    }
    if (fehlgeschlagen.length > 0) {
      return { ok: false, error: `${fehlgeschlagen.length} von ${RESET_TABELLEN.length} Bereichen konnten nicht geleert werden: ${fehlgeschlagen.join(", ")}` };
    }
    // Onboarding erneut nötig machen, damit "neue Protokolle starten"
    // tatsächlich wieder beim Einrichtungs-Assistenten landet, nicht bei
    // einer leeren, aber "fertig eingerichteten" App.
    const { error: profilFehler } = await supabase
      .from("profiles")
      .update({ onboarding_complete: false, category_ziele: {} })
      .eq("id", userId);
    if (profilFehler) {
      console.error(profilFehler);
      return { ok: false, error: "Alle Bereiche wurden geleert, aber das Profil konnte nicht auf 'Onboarding nötig' zurückgesetzt werden." };
    }
    return { ok: true };
  }, [userId]);

  return { allesZuruecksetzen, fortschrittZuruecksetzen };
}
