import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToEintrag(r) {
  return {
    id: r.id,
    datum: r.datum,
    art: r.art,
    name: r.name || "",
    dauerMin: r.dauer_min,
    uebungen: r.uebungen || [],
    distanzKm: r.distanz_km,
    puls: r.puls,
    runden: r.runden,
    rpe: r.rpe,
    kalorien: r.kalorien,
    energielevel: r.energielevel || "",
    schmerzen: r.schmerzen || "",
    bemerkungen: r.bemerkungen || "",
  };
}

export function useTrainingData(userId) {
  const [trainingEintraege, setTrainingEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("datum", { ascending: false })
        .order("created_at", { ascending: false });
      if (cancelled || !data) return;
      setTrainingEintraege(data.map(rowToEintrag));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const trainingHinzufuegen = useCallback(
    async (eintrag) => {
      if (!eintrag.art) return { ok: false, error: "Bitte eine Trainingsart wählen." };
      const row = {
        user_id: userId,
        datum: eintrag.datum,
        art: eintrag.art,
        name: eintrag.name || "",
        dauer_min: eintrag.dauerMin ? Number(eintrag.dauerMin) : null,
        uebungen: eintrag.uebungen || [],
        distanz_km: eintrag.distanzKm ? Number(eintrag.distanzKm) : null,
        puls: eintrag.puls ? Number(eintrag.puls) : null,
        runden: eintrag.runden ? Number(eintrag.runden) : null,
        rpe: eintrag.rpe ? Number(eintrag.rpe) : null,
        kalorien: eintrag.kalorien ? Number(eintrag.kalorien) : null,
        energielevel: eintrag.energielevel || null,
        schmerzen: eintrag.schmerzen || null,
        bemerkungen: eintrag.bemerkungen || "",
      };
      const { data, error } = await supabase.from("training_sessions").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setTrainingEintraege((prev) => [rowToEintrag(data), ...prev]);
      return { ok: true };
    },
    [userId]
  );

  const trainingEntfernen = useCallback(async (id) => {
    setTrainingEintraege((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("training_sessions").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return { trainingEintraege, trainingHinzufuegen, trainingEntfernen };
}
