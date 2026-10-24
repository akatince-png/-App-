import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Spielstand EINER Person für den Steckbrief (24.10.): Punkte gesamt und
// der letzten 7 Tage, aktive Tage, Serie, Zahl der Abzeichen (RPC
// person_spielstand, Migration 0129) plus die verdienten Abzeichen selbst.
// Funktioniert für die eigene Person und – als Admin – für jede Person.
export function usePersonSpielstand(personId) {
  const [stand, setStand] = useState(null);
  const [abzeichen, setAbzeichen] = useState([]);
  const [ladend, setLadend] = useState(true);

  useEffect(() => {
    if (!personId) return;
    let abgebrochen = false;
    (async () => {
      setLadend(true);
      const [spiel, badges] = await Promise.all([
        supabase.rpc("person_spielstand", { p_person: personId }),
        supabase.from("errungenschaften").select("badge_key, erreicht_am").eq("user_id", personId).order("erreicht_am", { ascending: false }),
      ]);
      if (abgebrochen) return;
      if (spiel.error) console.error(spiel.error);
      if (badges.error) console.error(badges.error);
      setStand(spiel.data?.[0] || null);
      setAbzeichen(badges.data || []);
      setLadend(false);
    })();
    return () => {
      abgebrochen = true;
    };
  }, [personId]);

  return { stand, abzeichen, ladend };
}
