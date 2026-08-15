import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Versionshistorie der Protokoll-Bausteine — manuell ausgelöste Snapshots
// (siehe MehrTab.jsx, "Version festhalten"), damit eine alte Einstellung
// erhalten bleibt, wenn ein Baustein verändert wird, statt einfach
// überschrieben zu werden. Sichtbar im Archiv (ProtokollLogView.jsx).
export function useBausteinVersionen(userId) {
  const [versionen, setVersionen] = useState([]);

  const laden = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("baustein_versionen")
      .select("*")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setVersionen(data || []);
  }, [userId]);

  useEffect(() => {
    laden();
  }, [laden]);

  const versionFesthalten = useCallback(
    async (hauptprotokollId, kategorie, snapshot, notiz) => {
      const { data, error } = await supabase
        .from("baustein_versionen")
        .insert({ user_id: userId, hauptprotokoll_id: hauptprotokollId, kategorie, snapshot, notiz: notiz || "" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setVersionen((prev) => [data, ...prev]);
      return { ok: true, version: data };
    },
    [userId]
  );

  const versionLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("baustein_versionen").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setVersionen((prev) => prev.filter((v) => v.id !== id));
    return { ok: true };
  }, []);

  return { versionen, versionFesthalten, versionLoeschen };
}
