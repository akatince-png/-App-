import { supabase } from "../lib/supabaseClient";
import { plusTage } from "../utils/schichtplan";
import { ETAPPE_TAGE } from "../utils/kernprogramm";

// Programm (Etappe 1 Einführung) für mehrere Personen auf einmal starten
// (Coach-Übersicht, Team-Filter = "pro Team").
export async function kernprogrammStarten(personIds, start) {
  if (!personIds.length) return { ok: true, anzahl: 0 };
  const { data: auth } = await supabase.auth.getUser();
  const rows = personIds.map((id) => ({ user_id: id, nummer: 1, art: "einfuehrung", start, ende: plusTage(start, ETAPPE_TAGE - 1), erstellt_von: auth?.user?.id || null }));
  const { error } = await supabase.from("coaching_etappen").upsert(rows, { onConflict: "user_id,nummer", ignoreDuplicates: true });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, anzahl: rows.length };
}
