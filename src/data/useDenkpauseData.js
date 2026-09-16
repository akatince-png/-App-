import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// "Denkpause" (Nutzerinnen-Vorgabe, 16.09.) — jeder Versuch (richtig oder
// falsch) wird protokolliert: richtige Antworten zahlen ins bestehende
// Punktesystem ein (siehe utils/errungenschaften.js), unter "Erfolge" wird
// zusätzlich pro Kategorie gezählt, wie viele gelöst/nicht gelöst wurden.
// Bewusst kein Limit beim Laden (wie z. B. atemuebung_logs mit .limit(50))
// — die Zählung unter "Erfolge" braucht die vollständige Historie, nicht
// nur die letzten Einträge.
export function useDenkpauseData(userId) {
  const [denkpauseErgebnisse, setDenkpauseErgebnisse] = useState([]);
  const geladenAbgebrochenRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("denkpause_ergebnisse")
      .select("id, kategorie, richtig, erstellt_am")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false });
    if (geladenAbgebrochenRef.current) return;
    if (error) {
      console.error(error);
      return;
    }
    setDenkpauseErgebnisse((data || []).map((r) => ({ id: r.id, kategorie: r.kategorie, richtig: r.richtig, erstelltAm: r.erstellt_am })));
  }, [userId]);

  useEffect(() => {
    geladenAbgebrochenRef.current = false;
    load();
    return () => {
      geladenAbgebrochenRef.current = true;
    };
  }, [load]);

  const denkpauseErgebnisVermerken = useCallback(
    async (kategorie, richtig) => {
      const { data, error } = await supabase.from("denkpause_ergebnisse").insert({ user_id: userId, kategorie, richtig }).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setDenkpauseErgebnisse((prev) => [{ id: data.id, kategorie: data.kategorie, richtig: data.richtig, erstelltAm: data.erstellt_am }, ...prev]);
      return { ok: true };
    },
    [userId]
  );

  return { denkpauseErgebnisse, denkpauseErgebnisVermerken };
}
