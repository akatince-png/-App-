import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSupplementData(userId) {
  const [supplemente, setSupplemente] = useState([]);
  const [supplementErledigt, setSupplementErledigt] = useState({});
  const [supplementErledigtAt, setSupplementErledigtAt] = useState({});
  const [supplementFeedback, setSupplementFeedback] = useState({});

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
      const nextFeedback = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.supplement_id}__${row.tageszeit}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
        nextFeedback[k] = {
          wirkung: row.wirkung || "",
          nebenwirkungen: row.nebenwirkungen || [],
          notizen: row.notizen || "",
        };
      });
      setSupplementErledigt(nextErledigt);
      setSupplementErledigtAt(nextErledigtAt);
      setSupplementFeedback(nextFeedback);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const supplementHinzufuegen = useCallback(
    async (neuesSupplement) => {
      if (!neuesSupplement.name.trim()) return { ok: false, error: "Bitte einen Namen eingeben." };
      if (neuesSupplement.tageszeiten.length === 0) return { ok: false, error: "Bitte mindestens eine Tageszeit wählen." };
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
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setSupplemente((prev) => [...prev, { id: data.id, name: data.name, tageszeiten: data.tageszeiten, hinweis: data.hinweis }]);
      return { ok: true };
    },
    [userId]
  );

  const supplementAendern = useCallback(async (id, felder) => {
    setSupplemente((prev) => prev.map((s) => (s.id === id ? { ...s, ...felder } : s)));
    const { error } = await supabase.from("supplements").update(felder).eq("id", id);
    if (error) console.error(error);
  }, []);

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

  const saveSupplementFeedback = useCallback(
    async (dose, draftFeedback) => {
      const k = `${dose.datum}__${dose.id}__${dose.zeit}`;
      const nowIso = new Date().toISOString();
      const record = { wirkung: draftFeedback.wirkung, nebenwirkungen: draftFeedback.nebenwirkungen, notizen: draftFeedback.notizen };
      setSupplementErledigt((prev) => ({ ...prev, [k]: true }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nowIso }));
      setSupplementFeedback((prev) => ({ ...prev, [k]: record }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: dose.id, log_date: dose.datum, tageszeit: dose.zeit, erledigt: true, erledigt_at: nowIso, ...record },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) console.error(error);
    },
    [userId]
  );

  const skipSupplementFeedback = useCallback(
    async (dose) => {
      const k = `${dose.datum}__${dose.id}__${dose.zeit}`;
      const nowIso = new Date().toISOString();
      setSupplementErledigt((prev) => ({ ...prev, [k]: true }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nowIso }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: dose.id, log_date: dose.datum, tageszeit: dose.zeit, erledigt: true, erledigt_at: nowIso },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) console.error(error);
    },
    [userId]
  );

  // Bestätigt alle noch offenen Supplemente einer Tageszeit an einem Tag auf einmal
  // (z. B. "Morgens" komplett abhaken), ohne bereits erledigte anzufassen.
  const confirmAlleTageszeit = useCallback(
    async (datum, zeit, ids) => {
      const offene = ids.filter((id) => !supplementErledigt[`${datum}__${id}__${zeit}`]);
      if (offene.length === 0) return;
      const nowIso = new Date().toISOString();
      setSupplementErledigt((prev) => {
        const next = { ...prev };
        offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = true));
        return next;
      });
      setSupplementErledigtAt((prev) => {
        const next = { ...prev };
        offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = nowIso));
        return next;
      });
      const { error } = await supabase.from("supplement_logs").upsert(
        offene.map((id) => ({ user_id: userId, supplement_id: id, log_date: datum, tageszeit: zeit, erledigt: true, erledigt_at: nowIso })),
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) console.error(error);
    },
    [supplementErledigt, userId]
  );

  return {
    supplemente,
    supplementHinzufuegen,
    supplementAendern,
    supplementEntfernen,
    supplementErledigt,
    supplementErledigtAt,
    toggleSupplementErledigt,
    confirmAlleTageszeit,
    supplementFeedback,
    saveSupplementFeedback,
    skipSupplementFeedback,
  };
}
