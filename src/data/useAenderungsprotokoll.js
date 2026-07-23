import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToEintrag(r) {
  return {
    id: r.id,
    kategorie: r.kategorie,
    itemName: r.item_name,
    aktion: r.aktion,
    detail: r.detail,
    grund: r.grund || "",
    erstelltAm: r.created_at,
  };
}

// Bereichsübergreifendes Audit-Log für Änderungen an laufenden Plänen —
// eigenständiger Hook statt in eine Kategorie-Hook gemischt, weil er von
// allen sieben Kategorie-Ansichten gleichermaßen aufgerufen wird.
export function useAenderungsprotokoll(userId) {
  const [protokollEintraege, setProtokollEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("aenderungsprotokoll")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (cancelled || !data) return;
      setProtokollEintraege(data.map(rowToEintrag));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const aenderungVermerken = useCallback(
    async ({ kategorie, itemName, aktion, detail, grund }) => {
      const { data, error } = await supabase
        .from("aenderungsprotokoll")
        .insert({ user_id: userId, kategorie, item_name: itemName, aktion, detail: detail || "", grund: grund?.trim() || null })
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setProtokollEintraege((prev) => [rowToEintrag(data), ...prev]);
    },
    [userId]
  );

  return { protokollEintraege, aenderungVermerken };
}
