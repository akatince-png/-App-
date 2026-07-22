import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useMealData(userId) {
  const [mahlzeiten, setMahlzeiten] = useState([]);
  const [mahlzeitErledigt, setMahlzeitErledigt] = useState({});
  const [mahlzeitErledigtAt, setMahlzeitErledigtAt] = useState({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: meals }, { data: ingredients }, { data: logs }] = await Promise.all([
        supabase.from("meals").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("meal_ingredients").select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("meal_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setMahlzeiten(
        (meals || []).map((m) => ({
          id: m.id,
          name: m.name,
          tageszeiten: m.tageszeiten || [],
          hinweis: m.hinweis || "",
          zutaten: (ingredients || [])
            .filter((i) => i.meal_id === m.id)
            .map((i) => ({ id: i.id, name: i.name, menge: i.menge || "" })),
        }))
      );
      const nextErledigt = {};
      const nextErledigtAt = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.meal_id}__${row.tageszeit}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
      });
      setMahlzeitErledigt(nextErledigt);
      setMahlzeitErledigtAt(nextErledigtAt);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const mahlzeitHinzufuegen = useCallback(
    async (neueMahlzeit) => {
      const name = neueMahlzeit.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      if (!neueMahlzeit.tageszeiten?.length) return { ok: false, error: "Bitte mindestens eine Tageszeit wählen." };
      const zutaten = (neueMahlzeit.zutaten || []).filter((z) => z.name.trim());

      const { data: meal, error } = await supabase
        .from("meals")
        .insert({ user_id: userId, name, tageszeiten: neueMahlzeit.tageszeiten, hinweis: neueMahlzeit.hinweis || "" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }

      let insertedZutaten = [];
      if (zutaten.length > 0) {
        const { data, error: zutatenError } = await supabase
          .from("meal_ingredients")
          .insert(zutaten.map((z, i) => ({ meal_id: meal.id, user_id: userId, name: z.name.trim(), menge: z.menge || "", sort_order: i })))
          .select();
        if (zutatenError) {
          console.error(zutatenError);
          return { ok: false, error: `Zutaten speichern fehlgeschlagen: ${zutatenError.message}` };
        }
        insertedZutaten = data || [];
      }

      setMahlzeiten((prev) => [
        ...prev,
        {
          id: meal.id,
          name: meal.name,
          tageszeiten: meal.tageszeiten,
          hinweis: meal.hinweis,
          zutaten: insertedZutaten.map((z) => ({ id: z.id, name: z.name, menge: z.menge })),
        },
      ]);
      return { ok: true };
    },
    [userId]
  );

  const mahlzeitEntfernen = useCallback(async (id) => {
    setMahlzeiten((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const toggleMahlzeitErledigt = useCallback(
    async (datum, id, zeit) => {
      const k = `${datum}__${id}__${zeit}`;
      const nextVal = !mahlzeitErledigt[k];
      const nowIso = new Date().toISOString();
      setMahlzeitErledigt((prev) => ({ ...prev, [k]: nextVal }));
      setMahlzeitErledigtAt((prev) => ({ ...prev, [k]: nextVal ? nowIso : null }));
      const { error } = await supabase.from("meal_logs").upsert(
        { user_id: userId, meal_id: id, log_date: datum, tageszeit: zeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "meal_id,log_date,tageszeit" }
      );
      if (error) console.error(error);
    },
    [mahlzeitErledigt, userId]
  );

  return {
    mahlzeiten,
    mahlzeitHinzufuegen,
    mahlzeitEntfernen,
    mahlzeitErledigt,
    mahlzeitErledigtAt,
    toggleMahlzeitErledigt,
  };
}
