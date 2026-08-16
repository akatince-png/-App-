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

  const zuruecksetzen = useCallback(() => {
    setAntwort(null);
    setFehler(null);
  }, []);

  return { antwort, laden, fehler, hilfeAnfordern, zuruecksetzen };
}
