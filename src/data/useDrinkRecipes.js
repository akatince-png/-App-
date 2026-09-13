import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useDrinkRecipes(userId) {
  const [rezepte, setRezepte] = useState([]);
  const [rezeptErledigt, setRezeptErledigt] = useState({});
  const [rezeptErledigtAt, setRezeptErledigtAt] = useState({});
  // Doppeltipp-Schutz (13.09.): siehe pendingErledigtRef in
  // useGewohnheitenData.js.
  const pendingErledigtRef = useRef({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: recipes }, { data: ingredients }, { data: logs }] = await Promise.all([
        supabase.from("drink_recipes").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("drink_recipe_ingredients").select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("drink_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setRezepte(
        (recipes || []).map((r) => ({
          id: r.id,
          name: r.name,
          hinweis: r.hinweis || "",
          zutaten: (ingredients || [])
            .filter((i) => i.recipe_id === r.id)
            .map((i) => ({ id: i.id, name: i.name, menge: i.menge || "" })),
        }))
      );
      const nextErledigt = {};
      const nextErledigtAt = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.recipe_id}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
      });
      setRezeptErledigt(nextErledigt);
      setRezeptErledigtAt(nextErledigtAt);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const rezeptHinzufuegen = useCallback(
    async (neuesRezept) => {
      const name = neuesRezept.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen für den Drink eingeben." };
      const zutaten = (neuesRezept.zutaten || []).filter((z) => z.name.trim());
      if (zutaten.length === 0) return { ok: false, error: "Bitte mindestens eine Zutat hinzufügen." };

      const { data: recipe, error } = await supabase
        .from("drink_recipes")
        .insert({ user_id: userId, name, hinweis: neuesRezept.hinweis || "" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }

      const { data: insertedZutaten, error: zutatenError } = await supabase
        .from("drink_recipe_ingredients")
        .insert(
          zutaten.map((z, i) => ({
            recipe_id: recipe.id,
            user_id: userId,
            name: z.name.trim(),
            menge: z.menge || "",
            sort_order: i,
          }))
        )
        .select();
      if (zutatenError) {
        console.error(zutatenError);
        return { ok: false, error: `Zutaten speichern fehlgeschlagen: ${zutatenError.message}` };
      }

      setRezepte((prev) => [
        ...prev,
        {
          id: recipe.id,
          name: recipe.name,
          hinweis: recipe.hinweis,
          zutaten: (insertedZutaten || []).map((z) => ({ id: z.id, name: z.name, menge: z.menge })),
        },
      ]);
      return { ok: true };
    },
    [userId]
  );

  const rezeptEntfernen = useCallback(async (id) => {
    // Bug-Fix: bei Fehlschlag verschwand das Rezept trotzdem sofort aus der
    // Liste, bis zum nächsten Neuladen — wirkte wie gelöscht, tauchte dann
    // aber wieder auf, ohne jede Fehlermeldung.
    let vorherigesRezept;
    let vorherigerIndex;
    setRezepte((prev) => {
      vorherigerIndex = prev.findIndex((r) => r.id === id);
      vorherigesRezept = prev[vorherigerIndex];
      return prev.filter((r) => r.id !== id);
    });
    const { error } = await supabase.from("drink_recipes").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigesRezept) {
        setRezepte((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigesRezept);
          return next;
        });
      }
    }
  }, []);

  const toggleRezeptErledigt = useCallback(
    async (datum, recipeId) => {
      const k = `${datum}__${recipeId}`;
      const aktuellerWert = k in pendingErledigtRef.current ? pendingErledigtRef.current[k] : rezeptErledigt[k];
      const vorherErledigt = rezeptErledigt[k];
      const vorherErledigtAt = rezeptErledigtAt[k] ?? null;
      const nextVal = !aktuellerWert;
      pendingErledigtRef.current[k] = nextVal;
      const nowIso = new Date().toISOString();
      setRezeptErledigt((prev) => ({ ...prev, [k]: nextVal }));
      setRezeptErledigtAt((prev) => ({ ...prev, [k]: nextVal ? nowIso : null }));
      const { error } = await supabase.from("drink_logs").upsert(
        { user_id: userId, recipe_id: recipeId, log_date: datum, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "recipe_id,log_date" }
      );
      if (error) {
        console.error(error);
        pendingErledigtRef.current[k] = aktuellerWert;
        setRezeptErledigt((prev) => ({ ...prev, [k]: vorherErledigt }));
        setRezeptErledigtAt((prev) => ({ ...prev, [k]: vorherErledigtAt }));
      }
    },
    [rezeptErledigt, rezeptErledigtAt, userId]
  );

  return {
    rezepte,
    rezeptHinzufuegen,
    rezeptEntfernen,
    rezeptErledigt,
    rezeptErledigtAt,
    toggleRezeptErledigt,
  };
}
