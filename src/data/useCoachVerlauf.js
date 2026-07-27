import { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Persistenter Gesprächsverlauf pro Lebensbereich (z. B. "training",
// "ernaehrung") — lädt/speichert Coach-Nachrichten in Supabase statt nur im
// Browser-State von KiChat.jsx, damit frühere Gespräche beim erneuten
// Öffnen sichtbar bleiben UND der Coach sie automatisch als Gedächtnis für
// persönlichere Antworten nutzen kann (voller geladener Verlauf fließt in
// jede neue KI-Anfrage mit ein).
export function useCoachVerlauf(userId) {
  const coachVerlaufLaden = useCallback(
    async (bereich) => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("coach_nachrichten")
        .select("rolle, text")
        .eq("user_id", userId)
        .eq("bereich", bereich)
        .order("erstellt_am");
      if (error) {
        console.error(error);
        return [];
      }
      return data || [];
    },
    [userId]
  );

  const coachNachrichtSpeichern = useCallback(
    async (bereich, rolle, text) => {
      if (!userId) return;
      const { error } = await supabase.from("coach_nachrichten").insert({ user_id: userId, bereich, rolle, text });
      if (error) console.error(error);
    },
    [userId]
  );

  return { coachVerlaufLaden, coachNachrichtSpeichern };
}
