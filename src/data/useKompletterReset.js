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

export function useKompletterReset(userId) {
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

  return { allesZuruecksetzen };
}
