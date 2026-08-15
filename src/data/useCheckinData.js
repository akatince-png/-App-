import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";

export function useCheckinData(userId) {
  const [gewichtsEintraege, setGewichtsEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("checkins").select("*").eq("user_id", userId).order("datum");
      if (cancelled || !data) return;
      setGewichtsEintraege(
        data.map((row) => ({
          datum: row.datum,
          fotos: row.fotos || [],
          ...row.values,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const gewichtHinzufuegen = useCallback(
    async (eintrag, aktiveMesswerte, combinedMesswertDefs, fotoFiles) => {
      const values = {};
      aktiveMesswerte.forEach((id) => {
        const def = combinedMesswertDefs.find((d) => d.id === id);
        const raw = eintrag[id];
        values[id] = def?.numeric && raw !== "" ? Number(raw) : raw ?? "";
      });

      const fotos = [];
      for (const f of fotoFiles || []) {
        try {
          const path = await uploadPhoto(userId, f.file, "checkins");
          fotos.push({ kategorie: f.kategorie, path });
        } catch (err) {
          console.error(err);
        }
      }

      const { data, error } = await supabase
        .from("checkins")
        .upsert({ user_id: userId, datum: eintrag.datum, values, fotos }, { onConflict: "user_id,datum" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setGewichtsEintraege((prev) =>
        [...prev.filter((e) => e.datum !== data.datum), { datum: data.datum, fotos: data.fotos, ...data.values }].sort((a, b) =>
          a.datum.localeCompare(b.datum)
        )
      );
    },
    [userId]
  );

  // Löscht einen einzelnen Check-in-Eintrag (Datum ist der eindeutige
  // Schlüssel je Nutzer, siehe onConflict oben) — für alte Test-Einträge
  // ohne echte Werte (Nutzerinnen-Vorgabe, 15.08.).
  const gewichtEntfernen = useCallback(
    async (datum) => {
      const { error } = await supabase.from("checkins").delete().eq("user_id", userId).eq("datum", datum);
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setGewichtsEintraege((prev) => prev.filter((e) => e.datum !== datum));
      return { ok: true };
    },
    [userId]
  );

  return { gewichtsEintraege, gewichtHinzufuegen, gewichtEntfernen };
}
