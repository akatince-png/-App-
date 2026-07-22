import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToTemplate(r) {
  return {
    id: r.id,
    name: r.name,
    art: r.art,
    uhrzeit: r.uhrzeit || "",
    uebungen: r.uebungen || [],
    dauerMin: r.dauer_min,
    distanzKm: r.distanz_km,
    puls: r.puls,
    runden: r.runden,
    intervallArbeitSek: r.intervall_arbeit_sek,
    intervallPauseSek: r.intervall_pause_sek,
  };
}

function rowToWochenplan(r) {
  return { id: r.id, wochentag: r.wochentag, art: r.art, uhrzeit: r.uhrzeit || "", templateId: r.template_id };
}

export function useTrainingTemplates(userId) {
  const [templates, setTemplates] = useState([]);
  const [wochenplan, setWochenplan] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: t }, { data: w }] = await Promise.all([
        supabase.from("training_templates").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("training_wochenplan").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      if (t) setTemplates(t.map(rowToTemplate));
      if (w) setWochenplan(w.map(rowToWochenplan));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const templateSpeichern = useCallback(
    async (vorlage) => {
      if (!vorlage.name?.trim()) return { ok: false, error: "Bitte einen Namen für die Vorlage eingeben." };
      const row = {
        user_id: userId,
        name: vorlage.name.trim(),
        art: vorlage.art,
        uhrzeit: vorlage.uhrzeit || null,
        uebungen: vorlage.uebungen || [],
        dauer_min: vorlage.dauerMin ? Number(vorlage.dauerMin) : null,
        distanz_km: vorlage.distanzKm ? Number(vorlage.distanzKm) : null,
        puls: vorlage.puls ? Number(vorlage.puls) : null,
        runden: vorlage.runden ? Number(vorlage.runden) : null,
        intervall_arbeit_sek: vorlage.intervallArbeitSek ? Number(vorlage.intervallArbeitSek) : null,
        intervall_pause_sek: vorlage.intervallPauseSek ? Number(vorlage.intervallPauseSek) : null,
      };
      const { data, error } = await supabase.from("training_templates").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      const neu = rowToTemplate(data);
      setTemplates((prev) => [...prev, neu]);
      return { ok: true, template: neu };
    },
    [userId]
  );

  const templateEntfernen = useCallback(async (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("training_templates").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const wochenplanSetzen = useCallback(
    async (wochentag, { art, templateId, uhrzeit }) => {
      const { data, error } = await supabase
        .from("training_wochenplan")
        .upsert({ user_id: userId, wochentag, art, uhrzeit: uhrzeit || null, template_id: templateId || null }, { onConflict: "user_id,wochentag" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return;
      }
      const neu = rowToWochenplan(data);
      setWochenplan((prev) => [...prev.filter((w) => w.wochentag !== wochentag), neu]);
    },
    [userId]
  );

  const wochenplanEntfernen = useCallback(
    async (wochentag) => {
      setWochenplan((prev) => prev.filter((w) => w.wochentag !== wochentag));
      const { error } = await supabase.from("training_wochenplan").delete().eq("user_id", userId).eq("wochentag", wochentag);
      if (error) console.error(error);
    },
    [userId]
  );

  return {
    trainingTemplates: templates,
    templateSpeichern,
    templateEntfernen,
    trainingWochenplan: wochenplan,
    wochenplanSetzen,
    wochenplanEntfernen,
  };
}
