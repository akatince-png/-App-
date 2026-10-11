import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { addDays, toLocalISODate } from "../utils/dates";

// Blutdruck-Protokoll (11.10., Migration 0127): manuelle Messungen der
// letzten 365 Tage.
const zuMessung = (r) => ({
  id: r.id,
  datum: r.datum,
  uhrzeit: r.uhrzeit ? String(r.uhrzeit).slice(0, 5) : "",
  systolisch: r.systolisch,
  diastolisch: r.diastolisch,
  puls: r.puls ?? null,
  notiz: r.notiz || "",
});

export function useBlutdruck(userId) {
  const [blutdruckMessungen, setMessungen] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let abbruch = false;
    (async () => {
      const { data, error } = await supabase
        .from("blutdruck_messungen")
        .select("*")
        .eq("user_id", userId)
        .gte("datum", toLocalISODate(addDays(new Date(), -365)))
        .order("datum")
        .order("uhrzeit");
      if (abbruch) return;
      if (error) return console.error(error);
      setMessungen((data || []).map(zuMessung));
    })();
    return () => {
      abbruch = true;
    };
  }, [userId]);

  const blutdruckSpeichern = useCallback(
    async ({ systolisch, diastolisch, puls = null, notiz = "", datum = null, uhrzeit = null }) => {
      const jetzt = new Date();
      const row = {
        user_id: userId,
        datum: datum || toLocalISODate(jetzt),
        uhrzeit: uhrzeit || `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`,
        systolisch,
        diastolisch,
        puls: puls ?? null,
        notiz: String(notiz || "").trim().slice(0, 200) || null,
      };
      const { data, error } = await supabase.from("blutdruck_messungen").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zuMessung(data);
      setMessungen((p) => [...p, neu]);
      return { ok: true, messung: neu };
    },
    [userId]
  );

  const blutdruckLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("blutdruck_messungen").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setMessungen((p) => p.filter((m) => m.id !== id));
    return { ok: true };
  }, []);

  return { blutdruckMessungen, blutdruckSpeichern, blutdruckLoeschen };
}
