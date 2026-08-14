import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToProjekt(r) {
  return { id: r.id, name: r.name, farbeIndex: r.farbe_index };
}

function rowToZeitblock(r) {
  return {
    id: r.id,
    projektId: r.projekt_id,
    titel: r.titel || "",
    datum: r.datum,
    startUhrzeit: r.start_uhrzeit ? r.start_uhrzeit.slice(0, 5) : "",
    endUhrzeit: r.end_uhrzeit ? r.end_uhrzeit.slice(0, 5) : "",
    notiz: r.notiz || "",
  };
}

// Projekte & Zeitblöcke (14.08., Nutzerin-Vorgabe): "Arbeit blocken" oder
// eigene Projekte mit farbigen Zeitblöcken, ohne eigene neue Plan-Seite —
// klinkt sich stattdessen über buildDayItems()/KATEGORIE_META in den
// bestehenden Tagesplan/Wochenplan und die Wochen-/Monatsübersicht ein
// (siehe dayItems.js, kategorie "zeitblock").
export function useZeitbloecke(userId) {
  const [projekte, setProjekte] = useState([]);
  const [zeitbloecke, setZeitbloecke] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: p }, { data: z }] = await Promise.all([
        supabase.from("projekte").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("zeitbloecke").select("*").eq("user_id", userId).order("datum").order("start_uhrzeit"),
      ]);
      if (cancelled) return;
      if (p) setProjekte(p.map(rowToProjekt));
      if (z) setZeitbloecke(z.map(rowToZeitblock));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Jedes neue Projekt bekommt automatisch die nächste Farbe aus der
  // Palette (siehe PROJEKT_FARBEN in dayItems.js) — kein Farbwähler nötig,
  // Nutzerinnen-Vorgabe: "sollen dann verschiedene Farben kriegen".
  const projektHinzufuegen = useCallback(
    async (name) => {
      if (!name?.trim()) return { ok: false, error: "Bitte einen Namen für das Projekt eingeben." };
      const row = { user_id: userId, name: name.trim(), farbe_index: projekte.length };
      const { data, error } = await supabase.from("projekte").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToProjekt(data);
      setProjekte((prev) => [...prev, neu]);
      return { ok: true, projekt: neu };
    },
    [userId, projekte]
  );

  const projektEntfernen = useCallback(async (id) => {
    setProjekte((prev) => prev.filter((p) => p.id !== id));
    setZeitbloecke((prev) => prev.filter((z) => z.projektId !== id));
    const { error } = await supabase.from("projekte").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const zeitblockHinzufuegen = useCallback(
    async (block) => {
      if (!block.projektId || !block.datum || !block.startUhrzeit) {
        return { ok: false, error: "Bitte Projekt, Datum und Startzeit angeben." };
      }
      const row = {
        user_id: userId,
        projekt_id: block.projektId,
        titel: block.titel || null,
        datum: block.datum,
        start_uhrzeit: block.startUhrzeit,
        end_uhrzeit: block.endUhrzeit || null,
        notiz: block.notiz || null,
      };
      const { data, error } = await supabase.from("zeitbloecke").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToZeitblock(data);
      setZeitbloecke((prev) => [...prev, neu]);
      return { ok: true, zeitblock: neu };
    },
    [userId]
  );

  const zeitblockBearbeiten = useCallback(async (id, block) => {
    const row = {
      projekt_id: block.projektId,
      titel: block.titel || null,
      datum: block.datum,
      start_uhrzeit: block.startUhrzeit,
      end_uhrzeit: block.endUhrzeit || null,
      notiz: block.notiz || null,
    };
    const { data, error } = await supabase.from("zeitbloecke").update(row).eq("id", id).select().single();
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    const aktualisiert = rowToZeitblock(data);
    setZeitbloecke((prev) => prev.map((z) => (z.id === id ? aktualisiert : z)));
    return { ok: true, zeitblock: aktualisiert };
  }, []);

  const zeitblockEntfernen = useCallback(async (id) => {
    setZeitbloecke((prev) => prev.filter((z) => z.id !== id));
    const { error } = await supabase.from("zeitbloecke").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return {
    projekte,
    projektHinzufuegen,
    projektEntfernen,
    zeitbloecke,
    zeitblockHinzufuegen,
    zeitblockBearbeiten,
    zeitblockEntfernen,
  };
}
