import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { wissensBasisFuerPfade } from "../utils/wissensBasis";

// Symptom-Kacheln für den Akutmodus (HomeView.jsx/AkutModusKarte.jsx,
// Nutzerinnen-Vorgabe 16.08.: ein Knopf für Momente akuter
// ADHS-Symptomatik, der zu einer Lösung führt). Jede Kachel bringt ihren
// eigenen kuratierten Kontext aus der App-Wissensbasis mit (siehe
// wissensBasisFuerPfade in utils/wissensBasis.js) — dieselbe Technik wie
// beim Lexikon (useLexikon.js), hier aber mit mehreren Quelldateien pro
// Symptom statt einem ganzen Themenordner.
export const AKUT_SYMPTOME = [
  { label: "😵 Reizüberflutung", pfade: ["allgemein/reizueberflutung"] },
  { label: "🌊 Zu viele Aufgaben auf einmal", pfade: ["allgemein/reizueberflutung", "allgemein/routinen-aufbau"] },
  { label: "🌀 Komme nicht in Gang", pfade: ["allgemein/prokrastination"] },
  { label: "😤 Innere Unruhe, bin kirre", pfade: ["allgemein/reizueberflutung", "training/training-bei-adhs"] },
  { label: "🎯 Kann mich nicht konzentrieren", pfade: ["hydration/hydration-bei-adhs", "training/training-bei-adhs"] },
  { label: "😣 Gedankenrasen, komme nicht runter", pfade: ["abendroutine/abendroutine-bei-adhs", "allgemein/routinen-aufbau"] },
  { label: "💥 Sehr gereizt, kurz vorm Explodieren", pfade: ["allgemein/reizueberflutung", "medikamente/medikamente-bei-adhs"] },
];

// Fallback-Kontext für frei formulierte Beschreibungen (kein Symptom aus
// der Liste ausgewählt) — die drei bereichsübergreifenden Dateien unter
// allgemein/ decken die häufigsten akuten ADHS-Zustände ab.
const FREITEXT_PFADE = ["allgemein/reizueberflutung", "allgemein/prokrastination", "allgemein/routinen-aufbau"];

export function useAkutModus() {
  const [antwort, setAntwort] = useState(null);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState(null);

  const hilfeAnfordern = useCallback(async (beschreibung, pfade) => {
    const trimmed = beschreibung.trim();
    if (!trimmed) return;
    setLaden(true);
    setFehler(null);
    setAntwort(null);
    try {
      const kontext = wissensBasisFuerPfade(pfade?.length ? pfade : FREITEXT_PFADE);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("lexikon", {
        body: { frage: trimmed, kategorie: "Akutmodus", kontext, modus: "akut" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      setAntwort(data.antwort || "Keine Antwort erhalten.");
    } catch (err) {
      setFehler(err.message || "Antwort konnte gerade nicht geladen werden.");
    } finally {
      setLaden(false);
    }
  }, []);

  // Für vorher als "Akut-Übung" markierte Gewohnheiten (siehe
  // gewohnheitAkutFavoritUmschalten in useGewohnheitenData.js,
  // GewohnheitenView.jsx): statt eines Symptoms wird direkt die von der
  // Person selbst gewählte Übung (z. B. "Isometrisches Training",
  // "Atemübung") an den Akutmodus-Prompt übergeben, der ohnehin schon
  // "kurz anerkennen + konkrete Schritte" verlangt — das ergibt von
  // selbst die gewünschte "Kumpel führt durch die Übung"-Anleitung, ohne
  // eine dritte Prompt-Variante in der Edge Function zu brauchen.
  const uebungAnfordern = useCallback(
    (uebungsName) => {
      hilfeAnfordern(
        `Ich möchte jetzt meine vorher festgelegte Akut-Übung machen: "${uebungsName}". Führ mich kurz und warmherzig da durch.`,
        ["training/training-bei-adhs", "allgemein/reizueberflutung"]
      );
    },
    [hilfeAnfordern]
  );

  const zuruecksetzen = useCallback(() => {
    setAntwort(null);
    setFehler(null);
  }, []);

  return { antwort, laden, fehler, hilfeAnfordern, uebungAnfordern, zuruecksetzen };
}

// Schlanke Dokumentation des Akutmodus (Nutzerinnen-Vorgabe 16.08.: "wie
// oft hatte er so einen Anfall, wie ist er damit umgegangen, ist es
// besser geworden" — siehe akutmodus_log, Migration 0076). Bewusst nur
// Aktion + optionales Vorher/Nachher-Gefühl, keine Verzweigung zu
// Supplementen/Medikamenten (das ist ein größerer, separater
// Ausbauschritt, siehe Übergabeprotokoll).
export async function akutmodusEreignisLoggen(userId, aktion, detail, gefuehlDanach) {
  const { error } = await supabase
    .from("akutmodus_log")
    .insert({ user_id: userId, aktion, detail: detail || null, gefuehl_danach: gefuehlDanach || null });
  if (error) console.error(error);
}
