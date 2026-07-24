import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";

function rowToWochenplan(r) {
  return { id: r.id, wochentag: r.wochentag, mealId: r.meal_id, tageszeit: r.tageszeit || "", uhrzeit: r.uhrzeit || "", sortOrder: r.sort_order };
}

export function useMealData(userId) {
  const [mahlzeiten, setMahlzeiten] = useState([]);
  const [mahlzeitErledigt, setMahlzeitErledigt] = useState({});
  const [mahlzeitErledigtAt, setMahlzeitErledigtAt] = useState({});
  const [mealWochenplan, setMealWochenplan] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: meals }, { data: ingredients }, { data: logs }, { data: wochenplan }] = await Promise.all([
        supabase.from("meals").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("meal_ingredients").select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("meal_logs").select("*").eq("user_id", userId),
        supabase.from("meal_wochenplan").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setMahlzeiten(
        (meals || []).map((m) => ({
          id: m.id,
          name: m.name,
          tageszeiten: m.tageszeiten || [],
          hinweis: m.hinweis || "",
          fotoPath: m.foto_path || null,
          zutaten: (ingredients || [])
            .filter((i) => i.meal_id === m.id)
            .map((i) => ({ id: i.id, name: i.name, menge: i.menge || "", mengeGramm: i.menge_gramm ?? "", kcalPro100g: i.kcal_pro_100g ?? "" })),
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
      setMealWochenplan((wochenplan || []).map(rowToWochenplan));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const mahlzeitHinzufuegen = useCallback(
    async (neueMahlzeit) => {
      const name = neueMahlzeit.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      const zutaten = (neueMahlzeit.zutaten || []).filter((z) => z.name.trim());

      const { data: meal, error } = await supabase
        .from("meals")
        .insert({ user_id: userId, name, tageszeiten: neueMahlzeit.tageszeiten || [], hinweis: neueMahlzeit.hinweis || "" })
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
          .insert(
            zutaten.map((z, i) => ({
              meal_id: meal.id,
              user_id: userId,
              name: z.name.trim(),
              menge: z.menge || "",
              menge_gramm: z.mengeGramm ? Number(z.mengeGramm) : null,
              kcal_pro_100g: z.kcalPro100g ? Number(z.kcalPro100g) : null,
              sort_order: i,
            }))
          )
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
          fotoPath: meal.foto_path || null,
          zutaten: insertedZutaten.map((z) => ({ id: z.id, name: z.name, menge: z.menge, mengeGramm: z.menge_gramm ?? "", kcalPro100g: z.kcal_pro_100g ?? "" })),
        },
      ]);
      return { ok: true, meal: { id: meal.id, name: meal.name } };
    },
    [userId]
  );

  const mahlzeitAendern = useCallback(async (id, felder) => {
    setMahlzeiten((prev) => prev.map((m) => (m.id === id ? { ...m, ...felder } : m)));
    const { error } = await supabase.from("meals").update(felder).eq("id", id);
    if (error) console.error(error);
  }, []);

  const mahlzeitEntfernen = useCallback(async (id) => {
    setMahlzeiten((prev) => prev.filter((m) => m.id !== id));
    setMealWochenplan((prev) => prev.filter((w) => w.mealId !== id));
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  // Zutaten werden nur beim Anlegen einer Mahlzeit geschrieben — zum
  // nachträglichen Bearbeiten von Gramm/Kcal einzelner Zutaten fehlte
  // bisher ein eigener Update-Pfad.
  const zutatAendern = useCallback(async (mealId, zutatId, felder) => {
    setMahlzeiten((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, zutaten: m.zutaten.map((z) => (z.id === zutatId ? { ...z, ...felder } : z)) } : m))
    );
    const patch = {};
    if ("menge" in felder) patch.menge = felder.menge;
    if ("mengeGramm" in felder) patch.menge_gramm = felder.mengeGramm ? Number(felder.mengeGramm) : null;
    if ("kcalPro100g" in felder) patch.kcal_pro_100g = felder.kcalPro100g ? Number(felder.kcalPro100g) : null;
    const { error } = await supabase.from("meal_ingredients").update(patch).eq("id", zutatId);
    if (error) {
      console.error(error);
      return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
    }
    return { ok: true };
  }, []);

  const setMahlzeitFoto = useCallback(
    async (mealId, file) => {
      let path;
      try {
        path = await uploadPhoto(userId, file, "mahlzeiten");
      } catch (err) {
        console.error(err);
        return { ok: false, error: `Foto-Upload fehlgeschlagen: ${err.message}` };
      }
      setMahlzeiten((prev) => prev.map((m) => (m.id === mealId ? { ...m, fotoPath: path } : m)));
      const { error } = await supabase.from("meals").update({ foto_path: path }).eq("id", mealId);
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId]
  );

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

  // Weist eine Mahlzeit einem Wochentag zu — bewusst ein einfacher Insert
  // statt Upsert-auf-Einzelplatz wie beim Training-Wochenplan: mehrere
  // Mahlzeiten am selben Tag (auch mit derselben Tageszeit-Kennung) sind
  // hier der Normalfall, nicht die Ausnahme.
  const wochenplanMahlzeitSetzen = useCallback(
    async (wochentag, { mealId, tageszeit, uhrzeit }) => {
      const { data, error } = await supabase
        .from("meal_wochenplan")
        .insert({ user_id: userId, wochentag, meal_id: mealId, tageszeit: tageszeit || null, uhrzeit: uhrzeit || null })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToWochenplan(data);
      setMealWochenplan((prev) => [...prev, neu]);
      return { ok: true };
    },
    [userId]
  );

  const wochenplanMahlzeitEntfernen = useCallback(async (id) => {
    setMealWochenplan((prev) => prev.filter((w) => w.id !== id));
    const { error } = await supabase.from("meal_wochenplan").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return {
    mahlzeiten,
    mahlzeitHinzufuegen,
    mahlzeitAendern,
    mahlzeitEntfernen,
    zutatAendern,
    setMahlzeitFoto,
    mahlzeitErledigt,
    mahlzeitErledigtAt,
    toggleMahlzeitErledigt,
    mealWochenplan,
    wochenplanMahlzeitSetzen,
    wochenplanMahlzeitEntfernen,
  };
}
