import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSupplementData(userId) {
  const [supplemente, setSupplemente] = useState([]);
  const [supplementErledigt, setSupplementErledigt] = useState({});
  const [supplementErledigtAt, setSupplementErledigtAt] = useState({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: rows }, { data: logs }] = await Promise.all([
        supabase.from("supplements").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("supplement_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setSupplemente(
        (rows || []).map((r) => ({ id: r.id, name: r.name, tageszeiten: r.tageszeiten || [], hinweis: r.hinweis || "" }))
      );
      const nextErledigt = {};
      const nextErledigtAt = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.supplement_id}__${row.tageszeit}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
      });
      setSupplementErledigt(nextErledigt);
      setSupplementErledigtAt(nextErledigtAt);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const supplementHinzufuegen = useCallback(
    async (neuesSupplement) => {
      if (!neuesSupplement.name.trim() || neuesSupplement.tageszeiten.length === 0) return;
      const { data, error } = await supabase
        .from("supplements")
        .insert({
          user_id: userId,
          name: neuesSupplement.name,
          tageszeiten: neuesSupplement.tageszeiten,
          hinweis: neuesSupplement.hinweis,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setSupplemente((prev) => [...prev, { id: data.id, name: data.name, tageszeiten: data.tageszeiten, hinweis: data.hinweis }]);
    },
    [userId]
  );

  const supplementEntfernen = useCallback(async (id) => {
    setSupplemente((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("supplements").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const toggleSupplementErledigt = useCallback(
    async (datum, id, zeit) => {
      const k = `${datum}__${id}__${zeit}`;
      const nextVal = !supplementErledigt[k];
      const nowIso = new Date().toISOString();
      setSupplementErledigt((prev) => ({ ...prev, [k]: nextVal }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nextVal ? nowIso : null }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: id, log_date: datum, tageszeit: zeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) console.error(error);
    },
    [supplementErledigt, userId]
  );

  return {
    supplemente,
    supplementHinzufuegen,
    supplementEntfernen,
    supplementErledigt,
    supplementErledigtAt,
    toggleSupplementErledigt,
  };
}
