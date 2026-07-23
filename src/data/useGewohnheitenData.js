import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Nutzt weiterhin die routines/routine_logs-Tabellen (frühere "Routinen"-
// Bündelfunktion) — jetzt als einfacher, eigenständiger Gewohnheiten-Tracker:
// eine Gewohnheit pro Zeile, täglich im Tagesplan abhakbar, mit optionalem
// eigenem Tage-Ziel statt einer festen Vorgabe.
export function useGewohnheitenData(userId) {
  const [gewohnheiten, setGewohnheiten] = useState([]);
  const [gewohnheitErledigt, setGewohnheitErledigt] = useState({});

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: rows }, { data: logs }] = await Promise.all([
      supabase.from("routines").select("*").eq("user_id", userId).order("sort_order").order("created_at"),
      supabase.from("routine_logs").select("*").eq("user_id", userId),
    ]);
    setGewohnheiten(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || "🌱",
        uhrzeit: r.uhrzeit ? r.uhrzeit.slice(0, 5) : "",
        zielTage: r.ziel_tage ?? null,
      }))
    );
    const nextErledigt = {};
    (logs || []).forEach((row) => {
      nextErledigt[`${row.log_date}__${row.routine_id}`] = true;
    });
    setGewohnheitErledigt(nextErledigt);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const gewohnheitHinzufuegen = useCallback(
    async (neu) => {
      const name = neu.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("routines")
        .insert({ user_id: userId, name, icon: neu.icon || "🌱", uhrzeit: neu.uhrzeit || null, ziel_tage: neu.zielTage || null })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setGewohnheiten((prev) => [
        ...prev,
        { id: data.id, name: data.name, icon: data.icon, uhrzeit: data.uhrzeit?.slice(0, 5) || "", zielTage: data.ziel_tage ?? null },
      ]);
      return { ok: true, id: data.id };
    },
    [userId]
  );

  const gewohnheitEntfernen = useCallback(async (id) => {
    setGewohnheiten((prev) => prev.filter((g) => g.id !== id));
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const gewohnheitZielAktualisieren = useCallback(async (id, zielTage) => {
    setGewohnheiten((prev) => prev.map((g) => (g.id === id ? { ...g, zielTage } : g)));
    const { error } = await supabase.from("routines").update({ ziel_tage: zielTage || null }).eq("id", id);
    if (error) console.error(error);
  }, []);

  const toggleGewohnheitErledigt = useCallback(
    async (datum, gewohnheitId) => {
      const k = `${datum}__${gewohnheitId}`;
      const nextVal = !gewohnheitErledigt[k];
      setGewohnheitErledigt((prev) => ({ ...prev, [k]: nextVal }));
      if (nextVal) {
        const { error } = await supabase
          .from("routine_logs")
          .upsert({ user_id: userId, routine_id: gewohnheitId, log_date: datum }, { onConflict: "routine_id,log_date" });
        if (error) console.error(error);
      } else {
        const { error } = await supabase.from("routine_logs").delete().eq("routine_id", gewohnheitId).eq("log_date", datum);
        if (error) console.error(error);
      }
    },
    [gewohnheitErledigt, userId]
  );

  // Gesamtzahl bisher erledigter Tage — unabhängig von einem eventuellen Ziel.
  const gesamtTage = useCallback(
    (gewohnheitId) => Object.entries(gewohnheitErledigt).filter(([k, v]) => v && k.endsWith(`__${gewohnheitId}`)).length,
    [gewohnheitErledigt]
  );

  // Aktuelle Serie ununterbrochener Tage (zählt ab heute oder — falls heute
  // noch offen — ab gestern rückwärts, damit ein noch nicht abgehakter
  // "heutiger" Tag die Serie nicht sofort auf 0 zurücksetzt).
  const aktuelleSerie = useCallback(
    (gewohnheitId) => {
      let serie = 0;
      const d = new Date();
      if (!gewohnheitErledigt[`${toLocalISODate(d)}__${gewohnheitId}`]) d.setDate(d.getDate() - 1);
      while (gewohnheitErledigt[`${toLocalISODate(d)}__${gewohnheitId}`]) {
        serie++;
        d.setDate(d.getDate() - 1);
      }
      return serie;
    },
    [gewohnheitErledigt]
  );

  return {
    gewohnheiten,
    gewohnheitErledigt,
    gewohnheitHinzufuegen,
    gewohnheitEntfernen,
    gewohnheitZielAktualisieren,
    toggleGewohnheitErledigt,
    gesamtTage,
    aktuelleSerie,
  };
}
