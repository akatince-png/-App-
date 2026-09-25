import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Kontext-Tagebuch (25.09.): ein Eintrag pro Tag (tagebuch_eintraege).
// Freie Notizen sind standardmäßig privat (notiz_teilen = false); der
// Coach liest nur über admin_tagebuch(), das die Notiz ohne Freigabe weglässt.
export function zeileZuEintrag(r) {
  return {
    datum: r.datum,
    stimmung: r.stimmung,
    orte: r.orte || [],
    personen: r.personen || [],
    essen: r.essen || [],
    tagesart: r.tagesart || [],
    koerper: r.koerper || [],
    notiz: r.notiz || "",
    notizTeilen: r.notiz_teilen ?? r.notiz_geteilt ?? false,
    auto: r.auto || {},
  };
}

export function useTagebuch(userId) {
  const [eintraege, setEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let abgebrochen = false;
    (async () => {
      const seit = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("tagebuch_eintraege").select("*").eq("user_id", userId).gte("datum", seit).order("datum");
      if (abgebrochen) return;
      if (error) console.error(error);
      setEintraege((data || []).map(zeileZuEintrag));
    })();
    return () => {
      abgebrochen = true;
    };
  }, [userId]);

  const tagebuchSpeichern = useCallback(
    async (e) => {
      if (!e?.datum || !e.stimmung) return { ok: false, error: "Bitte zuerst antippen, wie der Tag war." };
      const row = {
        user_id: userId,
        datum: e.datum,
        stimmung: e.stimmung,
        orte: e.orte || [],
        personen: e.personen || [],
        essen: e.essen || [],
        tagesart: e.tagesart || [],
        koerper: e.koerper || [],
        notiz: e.notiz?.trim() || null,
        notiz_teilen: !!e.notizTeilen,
        auto: e.auto || {},
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("tagebuch_eintraege").upsert(row, { onConflict: "user_id,datum" }).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zeileZuEintrag(data);
      setEintraege((prev) => [...prev.filter((x) => x.datum !== neu.datum), neu].sort((a, b) => (a.datum < b.datum ? -1 : 1)));
      return { ok: true, eintrag: neu };
    },
    [userId]
  );

  return { tagebuchEintraege: eintraege, tagebuchSpeichern };
}
