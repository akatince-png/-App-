import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LINK_TABLE = {
  peptid: "routine_peptide_items",
  hormon: "routine_hormon_items",
  supplement: "routine_supplement_items",
  mahlzeit: "routine_meal_items",
};
const LINK_REF_COLUMN = {
  peptid: "protocol_peptide_id",
  hormon: "hormone_id",
  supplement: "supplement_id",
  mahlzeit: "meal_id",
};
const LINK_SELECT = {
  peptid: "id, routine_id, protocol_peptide_id, protocol_peptide(id, name, menge)",
  hormon: "id, routine_id, hormone_id, hormones(id, name, menge)",
  supplement: "id, routine_id, supplement_id, supplements(id, name, hinweis)",
  mahlzeit: "id, routine_id, meal_id, meals(id, name, hinweis)",
};

function itemLabel(type, row) {
  if (type === "peptid") return { name: row.protocol_peptide?.name || "?", detail: row.protocol_peptide?.menge || "" };
  if (type === "hormon") return { name: row.hormones?.name || "?", detail: row.hormones?.menge || "" };
  if (type === "supplement") return { name: row.supplements?.name || "?", detail: row.supplements?.hinweis || "" };
  return { name: row.meals?.name || "?", detail: row.meals?.hinweis || "" };
}

export function useRoutines(userId) {
  const [routinen, setRoutinen] = useState([]);
  const [routineErledigt, setRoutineErledigt] = useState({});

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: routineRows }, ...linkResults] = await Promise.all([
      supabase.from("routines").select("*").eq("user_id", userId).order("sort_order").order("created_at"),
      ...Object.keys(LINK_TABLE).map((type) => supabase.from(LINK_TABLE[type]).select(LINK_SELECT[type]).eq("user_id", userId)),
    ]);
    const { data: logs } = await supabase.from("routine_logs").select("*").eq("user_id", userId);

    const itemsByRoutine = {};
    Object.keys(LINK_TABLE).forEach((type, i) => {
      (linkResults[i].data || []).forEach((row) => {
        const { name, detail } = itemLabel(type, row);
        if (!itemsByRoutine[row.routine_id]) itemsByRoutine[row.routine_id] = [];
        itemsByRoutine[row.routine_id].push({ linkId: row.id, type, refId: row[LINK_REF_COLUMN[type]], name, detail });
      });
    });

    setRoutinen(
      (routineRows || []).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || "⭐",
        uhrzeit: r.uhrzeit ? r.uhrzeit.slice(0, 5) : null,
        items: itemsByRoutine[r.id] || [],
      }))
    );

    const nextErledigt = {};
    (logs || []).forEach((row) => {
      nextErledigt[`${row.log_date}__${row.routine_id}`] = true;
    });
    setRoutineErledigt(nextErledigt);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const routineHinzufuegen = useCallback(
    async (neueRoutine) => {
      const name = neueRoutine.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("routines")
        .insert({ user_id: userId, name, icon: neueRoutine.icon || "⭐", uhrzeit: neueRoutine.uhrzeit || null })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setRoutinen((prev) => [...prev, { id: data.id, name: data.name, icon: data.icon, uhrzeit: data.uhrzeit?.slice(0, 5) || null, items: [] }]);
      return { ok: true, id: data.id };
    },
    [userId]
  );

  const routineEntfernen = useCallback(async (id) => {
    setRoutinen((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const routineItemHinzufuegen = useCallback(
    async (routineId, type, refId) => {
      const table = LINK_TABLE[type];
      const column = LINK_REF_COLUMN[type];
      const { error } = await supabase.from(table).insert({ routine_id: routineId, user_id: userId, [column]: refId });
      if (error) {
        console.error(error);
        return { ok: false, error: error.code === "23505" ? "Ist schon in dieser Routine enthalten." : `Hinzufügen fehlgeschlagen: ${error.message}` };
      }
      await load();
      return { ok: true };
    },
    [userId, load]
  );

  const routineItemEntfernen = useCallback(
    async (type, linkId) => {
      const table = LINK_TABLE[type];
      setRoutinen((prev) => prev.map((r) => ({ ...r, items: r.items.filter((i) => i.linkId !== linkId) })));
      const { error } = await supabase.from(table).delete().eq("id", linkId);
      if (error) console.error(error);
    },
    []
  );

  const toggleRoutineErledigt = useCallback(
    async (datum, routineId) => {
      const k = `${datum}__${routineId}`;
      const nextVal = !routineErledigt[k];
      setRoutineErledigt((prev) => ({ ...prev, [k]: nextVal }));
      if (nextVal) {
        const { error } = await supabase
          .from("routine_logs")
          .upsert({ user_id: userId, routine_id: routineId, log_date: datum }, { onConflict: "routine_id,log_date" });
        if (error) console.error(error);
      } else {
        const { error } = await supabase.from("routine_logs").delete().eq("routine_id", routineId).eq("log_date", datum);
        if (error) console.error(error);
      }
    },
    [routineErledigt, userId]
  );

  return {
    routinen,
    routineErledigt,
    routineHinzufuegen,
    routineEntfernen,
    routineItemHinzufuegen,
    routineItemEntfernen,
    toggleRoutineErledigt,
  };
}
