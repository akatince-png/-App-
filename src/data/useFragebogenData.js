import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Coaching-Fragebögen (z. B. "Der Passungs-Check") — bewusst getrennt vom
// Peptid-/Hormon-Hauptprotokoll-Modell: jede Zeile ist eine "Erhebung"
// eines Fragebogen-Typs, ein Typ kann mehrfach durchgearbeitet werden
// (siehe FRAGEBOGEN_TYPEN in constants.js).
export function useFragebogenData(userId) {
  const [fragebogenEintraege, setFragebogenEintraege] = useState([]);
  const [fragebogenLoading, setFragebogenLoading] = useState(true);

  const fragebogenLaden = useCallback(async () => {
    if (!userId) return;
    setFragebogenLoading(true);
    const { data, error } = await supabase
      .from("fragebogen_antworten")
      .select("*")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false });
    if (error) console.error(error);
    setFragebogenEintraege(data || []);
    setFragebogenLoading(false);
  }, [userId]);

  useEffect(() => {
    fragebogenLaden();
  }, [fragebogenLaden]);

  const fragebogenErstellen = useCallback(
    async (typ) => {
      const { data, error } = await supabase
        .from("fragebogen_antworten")
        .insert({ user_id: userId, typ, antworten: {}, auswertung: {} })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setFragebogenEintraege((prev) => [data, ...prev]);
      return { ok: true, eintrag: data };
    },
    [userId]
  );

  const fragebogenAktualisieren = useCallback(async (id, patch) => {
    const { data, error } = await supabase
      .from("fragebogen_antworten")
      .update({ ...patch, aktualisiert_am: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setFragebogenEintraege((prev) => prev.map((e) => (e.id === id ? data : e)));
    return { ok: true, eintrag: data };
  }, []);

  const fragebogenLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("fragebogen_antworten").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setFragebogenEintraege((prev) => prev.filter((e) => e.id !== id));
    return { ok: true };
  }, []);

  return {
    fragebogenEintraege,
    fragebogenLoading,
    fragebogenErstellen,
    fragebogenAktualisieren,
    fragebogenLoeschen,
  };
}
