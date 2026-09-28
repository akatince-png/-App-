import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Kalender „Mein Alltag“ (28.09., Migration 0118): eigene Bereiche,
// Einträge (wöchentlich oder einmalig) und Abhaken je Tag. Im Verwalten-
// Modus arbeitet der Coach mit derselben userId (RLS: admin voller Zugriff).
const zuBereich = (r) => ({ id: r.id, name: r.name, icon: r.icon || "⭐", farbeIndex: r.farbe_index || 0 });
const zuEintrag = (r) => ({
  id: r.id,
  bereich: r.bereich,
  bereichId: r.bereich_id,
  titel: r.titel,
  start: String(r.start_zeit || "").slice(0, 5),
  ende: r.end_zeit ? String(r.end_zeit).slice(0, 5) : "",
  wochentage: r.wochentage || [],
  datum: r.datum || null,
  erinnerung: r.erinnerung !== false,
  notiz: r.notiz || "",
});
const zuZeile = (userId, e) => ({
  user_id: userId,
  bereich: e.bereichId ? "eigen" : e.bereich || "termin",
  bereich_id: e.bereichId || null,
  titel: String(e.titel || "").trim(),
  start_zeit: e.start,
  end_zeit: e.ende || null,
  wochentage: e.datum ? [] : e.wochentage || [],
  datum: e.datum || null,
  erinnerung: e.erinnerung !== false,
  notiz: e.notiz || null,
});

export function useAlltag(userId) {
  const [alltagBereiche, setBereiche] = useState([]);
  const [alltagEintraege, setEintraege] = useState([]);
  const [alltagErledigt, setErledigt] = useState({}); // { "eintragId|datum": true }

  useEffect(() => {
    if (!userId) return;
    let abbruch = false;
    (async () => {
      const seit = toLocalISODate(new Date(Date.now() - 60 * 86400000));
      const [b, e, d] = await Promise.all([
        supabase.from("alltag_bereiche").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("alltag_eintraege").select("*").eq("user_id", userId).order("start_zeit"),
        supabase.from("alltag_erledigt").select("eintrag_id, datum").eq("user_id", userId).gte("datum", seit),
      ]);
      if (abbruch) return;
      if (b.error || e.error) console.error(b.error || e.error);
      setBereiche((b.data || []).map(zuBereich));
      setEintraege((e.data || []).map(zuEintrag));
      setErledigt(Object.fromEntries((d.data || []).map((x) => [`${x.eintrag_id}|${x.datum}`, true])));
    })();
    return () => {
      abbruch = true;
    };
  }, [userId]);

  const alltagSpeichern = useCallback(
    async (eintrag) => {
      const zeile = zuZeile(userId, eintrag);
      if (!zeile.titel || !zeile.start_zeit) return { ok: false, error: "Bitte Titel und Uhrzeit angeben." };
      if (!zeile.datum && !zeile.wochentage.length) return { ok: false, error: "Bitte Wochentage wählen oder „Einmalig“ mit Datum." };
      const q = eintrag.id ? supabase.from("alltag_eintraege").update(zeile).eq("id", eintrag.id) : supabase.from("alltag_eintraege").insert(zeile);
      const { data, error } = await q.select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zuEintrag(data);
      setEintraege((prev) => [...prev.filter((x) => x.id !== neu.id), neu].sort((a, b) => a.start.localeCompare(b.start)));
      return { ok: true, eintrag: neu };
    },
    [userId]
  );

  const alltagLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("alltag_eintraege").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setEintraege((prev) => prev.filter((x) => x.id !== id));
    return { ok: true };
  }, []);

  const alltagAbhaken = useCallback(
    async (eintragId, datum) => {
      const schluessel = `${eintragId}|${datum}`;
      const war = !!alltagErledigt[schluessel];
      setErledigt((p) => ({ ...p, [schluessel]: !war }));
      const { error } = war
        ? await supabase.from("alltag_erledigt").delete().eq("eintrag_id", eintragId).eq("datum", datum)
        : await supabase.from("alltag_erledigt").insert({ user_id: userId, eintrag_id: eintragId, datum });
      if (error) {
        console.error(error);
        setErledigt((p) => ({ ...p, [schluessel]: war }));
        return { ok: false, error: error.message };
      }
      return { ok: true, erledigt: !war };
    },
    [userId, alltagErledigt]
  );

  const alltagBereichAnlegen = useCallback(
    async ({ name, icon }) => {
      const sauber = String(name || "").trim();
      if (!sauber) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("alltag_bereiche")
        .insert({ user_id: userId, name: sauber.slice(0, 40), icon: icon || "⭐", farbe_index: alltagBereiche.length })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zuBereich(data);
      setBereiche((p) => [...p, neu]);
      return { ok: true, bereich: neu };
    },
    [userId, alltagBereiche.length]
  );

  const alltagBereichLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("alltag_bereiche").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setBereiche((p) => p.filter((b) => b.id !== id));
    return { ok: true };
  }, []);

  return { alltagBereiche, alltagEintraege, alltagErledigt, alltagSpeichern, alltagLoeschen, alltagAbhaken, alltagBereichAnlegen, alltagBereichLoeschen };
}
