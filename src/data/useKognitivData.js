import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Konzentrationstraining (25.09.): ein Ergebnis je gespielter Runde, siehe
// utils/kognitiv.js und Migration 0111.
const zeile = (r) => ({ id: r.id, spiel: r.spiel, level: r.level, richtig: r.richtig, gesamt: r.gesamt, reaktionMs: r.reaktion_ms, dauerSek: r.dauer_sek, erstelltAm: r.erstellt_am });

export function useKognitivData(userId) {
  const [kognitivErgebnisse, setErgebnisse] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let ab = false;
    (async () => {
      const seit = new Date(Date.now() - 120 * 86400000).toISOString();
      const { data, error } = await supabase.from("kognitiv_ergebnisse").select("*").eq("user_id", userId).gte("erstellt_am", seit).order("erstellt_am");
      if (ab) return;
      if (error) console.error(error);
      setErgebnisse((data || []).map(zeile));
    })();
    return () => {
      ab = true;
    };
  }, [userId]);

  const kognitivSpeichern = useCallback(
    async ({ spiel, level, richtig, gesamt, reaktionMs, dauerSek }) => {
      const row = { user_id: userId, spiel, level, richtig, gesamt, reaktion_ms: reaktionMs ?? null, dauer_sek: dauerSek ?? null };
      const { data, error } = await supabase.from("kognitiv_ergebnisse").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setErgebnisse((prev) => [...prev, zeile(data)]);
      return { ok: true };
    },
    [userId]
  );

  return { kognitivErgebnisse, kognitivSpeichern };
}
