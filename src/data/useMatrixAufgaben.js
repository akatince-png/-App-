import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { addDays, toLocalISODate } from "../utils/dates";

// Aufgaben-Matrix (30.09., Migration 0121). Offene Aufgaben plus die der
// letzten 14 Tage erledigten (für „heute erledigt“ im Tagesplan).
const zuAufgabe = (r) => ({
  id: r.id,
  projektId: r.projekt_id || null,
  titel: r.titel,
  wichtig: r.wichtig,
  frist: r.frist || null,
  dauerMin: r.dauer_min || null,
  naechsterSchritt: r.naechster_schritt || "",
  quadrantManuell: r.quadrant_manuell || null,
  geplantAm: r.geplant_am || null,
  verschoben: r.verschoben || 0,
  erledigtAm: r.erledigt_am || null,
});
const zuZeile = (userId, a) => ({
  user_id: userId,
  projekt_id: a.projektId || null,
  titel: String(a.titel || "").trim().slice(0, 200),
  wichtig: a.wichtig ?? null,
  frist: a.frist || null,
  dauer_min: a.dauerMin ? Number(a.dauerMin) : null,
  naechster_schritt: a.naechsterSchritt?.trim() || null,
  quadrant_manuell: a.quadrantManuell || null,
  geplant_am: a.geplantAm || null,
  verschoben: a.verschoben || 0,
  erledigt_am: a.erledigtAm || null,
});

export function useMatrixAufgaben(userId) {
  const [matrixAufgaben, setAufgaben] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let abbruch = false;
    (async () => {
      const seit = toLocalISODate(addDays(new Date(), -14));
      const { data, error } = await supabase
        .from("matrix_aufgaben")
        .select("*")
        .eq("user_id", userId)
        .or(`erledigt_am.is.null,erledigt_am.gte.${seit}`)
        .order("created_at");
      if (abbruch) return;
      if (error) return console.error(error);
      setAufgaben((data || []).map(zuAufgabe));
    })();
    return () => {
      abbruch = true;
    };
  }, [userId]);

  // Anlegen oder ändern (mit id).
  const matrixAufgabeSpeichern = useCallback(
    async (aufgabe) => {
      const zeile = zuZeile(userId, aufgabe);
      if (!zeile.titel) return { ok: false, error: "Bitte kurz sagen, was zu tun ist." };
      const q = aufgabe.id ? supabase.from("matrix_aufgaben").update(zeile).eq("id", aufgabe.id) : supabase.from("matrix_aufgaben").insert(zeile);
      const { data, error } = await q.select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zuAufgabe(data);
      setAufgaben((p) => [...p.filter((x) => x.id !== neu.id), neu]);
      return { ok: true, aufgabe: neu };
    },
    [userId]
  );

  const matrixAufgabeLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("matrix_aufgaben").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setAufgaben((p) => p.filter((x) => x.id !== id));
    return { ok: true };
  }, []);

  return { matrixAufgaben, matrixAufgabeSpeichern, matrixAufgabeLoeschen };
}
