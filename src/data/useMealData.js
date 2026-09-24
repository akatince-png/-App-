import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";

function rowToWochenplan(r) {
  return {
    id: r.id,
    wochentag: r.wochentag,
    mealId: r.meal_id,
    tageszeit: r.tageszeit || "",
    uhrzeit: r.uhrzeit ? r.uhrzeit.slice(0, 5) : "",
    sortOrder: r.sort_order,
  };
}

export function useMealData(userId, hauptprotokollId, belohnungPufferMin) {
  const [mahlzeiten, setMahlzeiten] = useState([]);
  const [mahlzeitErledigt, setMahlzeitErledigt] = useState({});
  // Siehe useGewohnheitenData.js: verhindert, dass schnelles Doppeltippen
  // denselben veralteten State liest und dadurch einen Toggle-Tap verliert.
  const pendingErledigtRef = useRef({});
  const [mahlzeitErledigtAt, setMahlzeitErledigtAt] = useState({});
  // Leichte, optionale Notiz pro Tages-Eintrag (17.09., Konsistenz-Check) —
  // bewusst kein volles Verträglichkeits-/Nebenwirkungs-Formular wie bei
  // Medikamenten/Supplementen (passt inhaltlich nicht zu Mahlzeiten), aber
  // wenigstens ein Freitext-Feld, siehe Migration 0093.
  const [mahlzeitNotizen, setMahlzeitNotizen] = useState({});
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
          hauptprotokollId: m.hauptprotokoll_id || null,
          zutaten: (ingredients || [])
            .filter((i) => i.meal_id === m.id)
            .map((i) => ({ id: i.id, name: i.name, menge: i.menge || "", mengeGramm: i.menge_gramm ?? "", kcalPro100g: i.kcal_pro_100g ?? "" })),
        }))
      );
      const nextErledigt = {};
      const nextErledigtAt = {};
      const nextNotizen = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.meal_id}__${row.tageszeit}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
        if (row.notizen) nextNotizen[k] = row.notizen;
      });
      setMahlzeitErledigt(nextErledigt);
      setMahlzeitErledigtAt(nextErledigtAt);
      setMahlzeitNotizen(nextNotizen);
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
        .insert({ user_id: userId, hauptprotokoll_id: hauptprotokollId || null, name, tageszeiten: neueMahlzeit.tageszeiten || [], hinweis: neueMahlzeit.hinweis || "" })
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
          hauptprotokollId: meal.hauptprotokoll_id || null,
          zutaten: insertedZutaten.map((z) => ({ id: z.id, name: z.name, menge: z.menge, mengeGramm: z.menge_gramm ?? "", kcalPro100g: z.kcal_pro_100g ?? "" })),
        },
      ]);
      return { ok: true, meal: { id: meal.id, name: meal.name } };
    },
    [userId, hauptprotokollId]
  );

  const mahlzeitAendern = useCallback(async (id, felder) => {
    let vorher;
    setMahlzeiten((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        vorher = m;
        return { ...m, ...felder };
      })
    );
    const { error } = await supabase.from("meals").update(felder).eq("id", id);
    if (error) {
      console.error(error);
      if (vorher) setMahlzeiten((prev) => prev.map((m) => (m.id === id ? vorher : m)));
    }
  }, []);

  const mahlzeitEntfernen = useCallback(async (id) => {
    // Bug-Fix: bei Fehlschlag verschwanden Mahlzeit UND ihre Wochenplan-
    // Zuweisungen trotzdem sofort, bis zum nächsten Neuladen — wirkte wie
    // gelöscht, tauchten dann aber wieder auf, ohne jede Fehlermeldung.
    let vorherigeMahlzeit;
    let vorherigerIndex;
    let entfernteZuweisungen;
    setMahlzeiten((prev) => {
      vorherigerIndex = prev.findIndex((m) => m.id === id);
      vorherigeMahlzeit = prev[vorherigerIndex];
      return prev.filter((m) => m.id !== id);
    });
    setMealWochenplan((prev) => {
      entfernteZuweisungen = prev.filter((w) => w.mealId === id);
      return prev.filter((w) => w.mealId !== id);
    });
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigeMahlzeit) {
        setMahlzeiten((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigeMahlzeit);
          return next;
        });
      }
      if (entfernteZuweisungen?.length) {
        setMealWochenplan((prev) => [...prev, ...entfernteZuweisungen]);
      }
    }
  }, []);

  // Zutaten werden nur beim Anlegen einer Mahlzeit geschrieben — zum
  // nachträglichen Bearbeiten von Gramm/Kcal einzelner Zutaten fehlte
  // bisher ein eigener Update-Pfad.
  const zutatAendern = useCallback(async (mealId, zutatId, felder) => {
    let vorherigeZutat;
    setMahlzeiten((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? {
              ...m,
              zutaten: m.zutaten.map((z) => {
                if (z.id !== zutatId) return z;
                vorherigeZutat = z;
                return { ...z, ...felder };
              }),
            }
          : m
      )
    );
    const patch = {};
    if ("menge" in felder) patch.menge = felder.menge;
    if ("mengeGramm" in felder) patch.menge_gramm = felder.mengeGramm ? Number(felder.mengeGramm) : null;
    if ("kcalPro100g" in felder) patch.kcal_pro_100g = felder.kcalPro100g ? Number(felder.kcalPro100g) : null;
    const { error } = await supabase.from("meal_ingredients").update(patch).eq("id", zutatId);
    if (error) {
      console.error(error);
      if (vorherigeZutat) {
        setMahlzeiten((prev) =>
          prev.map((m) => (m.id === mealId ? { ...m, zutaten: m.zutaten.map((z) => (z.id === zutatId ? vorherigeZutat : z)) } : m))
        );
      }
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
      let vorherigerPfad;
      setMahlzeiten((prev) =>
        prev.map((m) => {
          if (m.id !== mealId) return m;
          vorherigerPfad = m.fotoPath;
          return { ...m, fotoPath: path };
        })
      );
      const { error } = await supabase.from("meals").update({ foto_path: path }).eq("id", mealId);
      if (error) {
        console.error(error);
        setMahlzeiten((prev) => prev.map((m) => (m.id === mealId ? { ...m, fotoPath: vorherigerPfad } : m)));
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId]
  );

  const toggleMahlzeitErledigt = useCallback(
    async (datum, id, zeit) => {
      const k = `${datum}__${id}__${zeit}`;
      const aktuellerWert = k in pendingErledigtRef.current ? pendingErledigtRef.current[k] : mahlzeitErledigt[k];
      const nextVal = !aktuellerWert;
      const vorherigeErledigtAt = mahlzeitErledigtAt[k] ?? null;
      pendingErledigtRef.current[k] = nextVal;
      const nowIso = new Date().toISOString();
      setMahlzeitErledigt((prev) => ({ ...prev, [k]: nextVal }));
      setMahlzeitErledigtAt((prev) => ({ ...prev, [k]: nextVal ? nowIso : null }));
      const { error } = await supabase.from("meal_logs").upsert(
        { user_id: userId, meal_id: id, log_date: datum, tageszeit: zeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "meal_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        pendingErledigtRef.current[k] = aktuellerWert;
        setMahlzeitErledigt((prev) => ({ ...prev, [k]: aktuellerWert }));
        setMahlzeitErledigtAt((prev) => ({ ...prev, [k]: vorherigeErledigtAt }));
        return;
      }
      // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): nur beim Abhaken, nicht
      // beim Rückgängigmachen, und nur innerhalb des Admin-Puffers nach der
      // geplanten Uhrzeit. `zeit` ist hier oft nur eine Tageszeit-Bezeichnung
      // ("Frühstück") statt einer echten Uhrzeit — istRechtzeitig() erkennt
      // das (kein "HH:MM"-Muster) und lässt es dann unbegrenzt durch, statt
      // fälschlich abzulehnen.
      if (nextVal && istRechtzeitig(zeit, belohnungPufferMin)) {
        const mahlzeitName = mahlzeiten.find((m) => m.id === id)?.name || "Mahlzeit";
        feuereBelohnung({ text: `„${mahlzeitName}" erledigt`, icon: "utensils", punkte: 1 });
      }
    },
    [mahlzeitErledigt, mahlzeitErledigtAt, userId, belohnungPufferMin, mahlzeiten]
  );

  // Speichert/ändert die optionale Notiz zu einem bereits bestätigten
  // Tages-Eintrag (17.09., Konsistenz-Check) — bewusst nur für bereits
  // erledigte Einträge gedacht (siehe TagesplanView.jsx: das Notiz-Symbol
  // erscheint erst nach dem Bestätigen), `erledigt` bleibt deshalb einfach
  // auf dem aktuellen Wert stehen statt hier neu gesetzt zu werden.
  const mahlzeitNotizSpeichern = useCallback(
    async (datum, id, zeit, text) => {
      const k = `${datum}__${id}__${zeit}`;
      const vorher = mahlzeitNotizen[k];
      setMahlzeitNotizen((prev) => ({ ...prev, [k]: text }));
      const { error } = await supabase.from("meal_logs").upsert(
        { user_id: userId, meal_id: id, log_date: datum, tageszeit: zeit, erledigt: mahlzeitErledigt[k] ?? true, notizen: text || null },
        { onConflict: "meal_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        setMahlzeitNotizen((prev) => ({ ...prev, [k]: vorher }));
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [userId, mahlzeitErledigt, mahlzeitNotizen]
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
    let vorherigeZuweisung;
    let vorherigerIndex;
    setMealWochenplan((prev) => {
      vorherigerIndex = prev.findIndex((w) => w.id === id);
      vorherigeZuweisung = prev[vorherigerIndex];
      return prev.filter((w) => w.id !== id);
    });
    const { error } = await supabase.from("meal_wochenplan").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigeZuweisung) {
        setMealWochenplan((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigeZuweisung);
          return next;
        });
      }
    }
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
    mahlzeitNotizen,
    mahlzeitNotizSpeichern,
    mealWochenplan,
    wochenplanMahlzeitSetzen,
    wochenplanMahlzeitEntfernen,
  };
}
