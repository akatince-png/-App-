import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToEintrag(r) {
  return {
    id: r.id,
    datum: r.datum,
    uhrzeit: r.uhrzeit || "",
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
    erledigt: r.erledigt,
    intervallArbeitSek: r.intervall_arbeit_sek,
    intervallPauseSek: r.intervall_pause_sek,
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
        uhrzeit: eintrag.uhrzeit || null,
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
        erledigt: eintrag.erledigt !== false,
        intervall_arbeit_sek: eintrag.intervallArbeitSek ? Number(eintrag.intervallArbeitSek) : null,
        intervall_pause_sek: eintrag.intervallPauseSek ? Number(eintrag.intervallPauseSek) : null,
      };
      const { data, error } = await supabase.from("training_sessions").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      const neu = rowToEintrag(data);
      setTrainingEintraege((prev) => [neu, ...prev]);
      return { ok: true, eintrag: neu };
    },
    [userId]
  );

  const trainingEntfernen = useCallback(async (id) => {
    setTrainingEintraege((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("training_sessions").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const trainingErledigtSetzen = useCallback(async (id, erledigt) => {
    setTrainingEintraege((prev) => prev.map((e) => (e.id === id ? { ...e, erledigt } : e)));
    const { error } = await supabase.from("training_sessions").update({ erledigt }).eq("id", id);
    if (error) console.error(error);
  }, []);

  // Schließt ein Live-Workout ab: markiert erledigt und übernimmt optional die
  // tatsächlich gestoppte Dauer (z. B. von der Cardio-Stoppuhr).
  const trainingAbschliessen = useCallback(async (id, felder = {}) => {
    const patch = { erledigt: true };
    const lokalePatch = { erledigt: true };
    if (felder.dauerMin != null) {
      patch.dauer_min = felder.dauerMin;
      lokalePatch.dauerMin = felder.dauerMin;
    }
    if (felder.uebungen != null) {
      patch.uebungen = felder.uebungen;
      lokalePatch.uebungen = felder.uebungen;
    }
    setTrainingEintraege((prev) => prev.map((e) => (e.id === id ? { ...e, ...lokalePatch } : e)));
    const { error } = await supabase.from("training_sessions").update(patch).eq("id", id);
    if (error) console.error(error);
  }, []);

  // Nachträgliche, rein optionale Rückmeldung (RPE/Kalorien/Energielevel/
  // Schmerzen/Bemerkungen) — getrennt von trainingAbschliessen, weil sie erst
  // NACH dem Training sinnvoll ausfüllbar ist, nicht beim Anlegen/Abschließen.
  const trainingFeedbackSpeichern = useCallback(async (id, felder) => {
    const patch = {
      rpe: felder.rpe ? Number(felder.rpe) : null,
      kalorien: felder.kalorien ? Number(felder.kalorien) : null,
      energielevel: felder.energielevel || null,
      schmerzen: felder.schmerzen || null,
      bemerkungen: felder.bemerkungen || "",
    };
    setTrainingEintraege((prev) => prev.map((e) => (e.id === id ? { ...e, ...felder } : e)));
    const { error } = await supabase.from("training_sessions").update(patch).eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
    }
    return { ok: true };
  }, []);

  return {
    trainingEintraege,
    trainingHinzufuegen,
    trainingEntfernen,
    trainingErledigtSetzen,
    trainingAbschliessen,
    trainingFeedbackSpeichern,
  };
}
