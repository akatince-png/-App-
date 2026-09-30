import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { addDays, toLocalISODate } from "../utils/dates";

// Spontan-Einträge (30.09., Migration 0122): Nickerchen und zusätzliche
// Einnahmen außerhalb des Plans (z. B. Pre-Workout). Letzte 30 Tage.
const zuEintrag = (r) => ({ id: r.id, art: r.art, datum: r.datum, uhrzeit: r.uhrzeit ? String(r.uhrzeit).slice(0, 5) : "", dauerMin: r.dauer_min || null, name: r.name || "" });

export function useSpontanEintraege(userId) {
  const [spontanEintraege, setEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let abbruch = false;
    (async () => {
      const { data, error } = await supabase.from("spontan_eintraege").select("*").eq("user_id", userId).gte("datum", toLocalISODate(addDays(new Date(), -30))).order("created_at");
      if (abbruch) return;
      if (error) return console.error(error);
      setEintraege((data || []).map(zuEintrag));
    })();
    return () => {
      abbruch = true;
    };
  }, [userId]);

  const spontanSpeichern = useCallback(
    async ({ art, dauerMin = null, name = "" }) => {
      const jetzt = new Date();
      const row = {
        user_id: userId,
        art,
        datum: toLocalISODate(jetzt),
        uhrzeit: `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`,
        dauer_min: dauerMin ? Number(dauerMin) : null,
        name: String(name || "").trim().slice(0, 80) || null,
      };
      if (art === "einnahme" && !row.name) return { ok: false, error: "Was hast du genommen?" };
      const { data, error } = await supabase.from("spontan_eintraege").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zuEintrag(data);
      setEintraege((p) => [...p, neu]);
      return { ok: true, eintrag: neu };
    },
    [userId]
  );

  const spontanEntfernen = useCallback(async (id) => {
    const { error } = await supabase.from("spontan_eintraege").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setEintraege((p) => p.filter((x) => x.id !== id));
    return { ok: true };
  }, []);

  return { spontanEintraege, spontanSpeichern, spontanEntfernen };
}
