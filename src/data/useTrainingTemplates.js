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
    cardioArt: r.cardio_art || "",
    cardioModus: r.cardio_modus || "",
    intervallArbeitSek: r.intervall_arbeit_sek,
    intervallPauseSek: r.intervall_pause_sek,
  };
}

function rowToWochenplan(r) {
  return {
    id: r.id,
    wochentag: r.wochentag,
    uhrzeit: r.uhrzeit ? r.uhrzeit.slice(0, 5) : "",
    arten: Array.isArray(r.arten) ? r.arten : [],
    // Neu: je Übung eigene Sätze/Wiederholungen/Gewicht (13.08.).
    uebungenListe: Array.isArray(r.uebungen_liste) ? r.uebungen_liste : [],
    // Alt: ein Freitext + ein einzelnes Sätze/Wiederholungen-Paar für die
    // ganze Einheit — nur noch für bereits vor der Umstellung gespeicherte
    // Einheiten relevant (siehe wochenplanUebungenText in dayItems.js).
    saetze: r.saetze || "",
    wiederholungen: r.wiederholungen || "",
    uebungen: r.uebungen || "",
    warmup: { aktiv: !!r.warmup_aktiv, dauerMin: r.warmup_dauer_min ? String(r.warmup_dauer_min) : "", beschreibung: r.warmup_beschreibung || "" },
    cooldown: { aktiv: !!r.cooldown_aktiv, dauerMin: r.cooldown_dauer_min ? String(r.cooldown_dauer_min) : "", beschreibung: r.cooldown_beschreibung || "" },
    // Push-Erinnerung für diese eine Einheit (14.08., Nutzerin-Vorgabe) —
    // zusätzlich zum globalen Training-Schalter (profiles.erinnerungen.training,
    // siehe MehrTab.jsx), damit sich einzelne Tage abweichend stummschalten
    // lassen. Default true, falls die Spalte bei alten Zeilen noch nicht gesetzt ist.
    erinnerungAktiv: r.erinnerung_aktiv !== false,
  };
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
        cardio_art: vorlage.cardioArt || null,
        cardio_modus: vorlage.cardioModus || null,
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

  // Fügt eine weitere Trainingseinheit hinzu, statt die Zuweisung eines
  // Wochentags zu ersetzen — dadurch sind mehrere Einheiten am selben Tag zu
  // unterschiedlichen Uhrzeiten möglich (siehe 0030_training_wochenplan_einheiten).
  const wochenplanHinzufuegen = useCallback(
    async (einheit) => {
      const row = {
        user_id: userId,
        wochentag: einheit.wochentag,
        uhrzeit: einheit.uhrzeit || null,
        arten: einheit.arten || [],
        uebungen_liste: einheit.uebungenListe || [],
        warmup_aktiv: !!einheit.warmup?.aktiv,
        warmup_dauer_min: einheit.warmup?.dauerMin ? Number(einheit.warmup.dauerMin) : null,
        warmup_beschreibung: einheit.warmup?.beschreibung || null,
        cooldown_aktiv: !!einheit.cooldown?.aktiv,
        cooldown_dauer_min: einheit.cooldown?.dauerMin ? Number(einheit.cooldown.dauerMin) : null,
        cooldown_beschreibung: einheit.cooldown?.beschreibung || null,
        erinnerung_aktiv: einheit.erinnerungAktiv !== false,
      };
      const { data, error } = await supabase.from("training_wochenplan").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToWochenplan(data);
      setWochenplan((prev) => [...prev, neu]);
      return { ok: true, einheit: neu };
    },
    [userId]
  );

  const wochenplanEntfernen = useCallback(async (id) => {
    setWochenplan((prev) => prev.filter((w) => w.id !== id));
    const { error } = await supabase.from("training_wochenplan").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  // Bearbeitet eine bestehende Einheit, statt sie löschen + neu anlegen zu
  // müssen (Nutzerinnen-Vorgabe, 13.08. — z. B. nachträglich Aufwärmen/
  // Cool-down bei einer schon gespeicherten Einheit ergänzen).
  const wochenplanBearbeiten = useCallback(async (id, einheit) => {
    const row = {
      wochentag: einheit.wochentag,
      uhrzeit: einheit.uhrzeit || null,
      arten: einheit.arten || [],
      uebungen_liste: einheit.uebungenListe || [],
      warmup_aktiv: !!einheit.warmup?.aktiv,
      warmup_dauer_min: einheit.warmup?.dauerMin ? Number(einheit.warmup.dauerMin) : null,
      warmup_beschreibung: einheit.warmup?.beschreibung || null,
      cooldown_aktiv: !!einheit.cooldown?.aktiv,
      cooldown_dauer_min: einheit.cooldown?.dauerMin ? Number(einheit.cooldown.dauerMin) : null,
      cooldown_beschreibung: einheit.cooldown?.beschreibung || null,
      erinnerung_aktiv: einheit.erinnerungAktiv !== false,
    };
    const { data, error } = await supabase.from("training_wochenplan").update(row).eq("id", id).select().single();
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    const aktualisiert = rowToWochenplan(data);
    setWochenplan((prev) => prev.map((w) => (w.id === id ? aktualisiert : w)));
    return { ok: true, einheit: aktualisiert };
  }, []);

  // Schneller Ein-Knopf-Umschalter direkt in der Wochenplan-Tabelle (14.08.,
  // Nutzerin-Vorgabe) — anders als wochenplanBearbeiten oben ändert das NUR
  // die Erinnerung, ohne das ganze Formular öffnen zu müssen.
  const wochenplanErinnerungUmschalten = useCallback(async (id, aktiv) => {
    setWochenplan((prev) => prev.map((w) => (w.id === id ? { ...w, erinnerungAktiv: aktiv } : w)));
    const { error } = await supabase.from("training_wochenplan").update({ erinnerung_aktiv: aktiv }).eq("id", id);
    if (error) console.error(error);
  }, []);

  // "Für alle gleichzeitig" (14.08., Nutzerin-Vorgabe): ein Tastendruck statt
  // jede Zeile einzeln umzuschalten.
  const wochenplanErinnerungenAlleSetzen = useCallback(
    async (aktiv) => {
      setWochenplan((prev) => prev.map((w) => ({ ...w, erinnerungAktiv: aktiv })));
      const { error } = await supabase.from("training_wochenplan").update({ erinnerung_aktiv: aktiv }).eq("user_id", userId);
      if (error) console.error(error);
    },
    [userId]
  );

  return {
    trainingTemplates: templates,
    templateSpeichern,
    templateEntfernen,
    trainingWochenplan: wochenplan,
    wochenplanHinzufuegen,
    wochenplanBearbeiten,
    wochenplanEntfernen,
    wochenplanErinnerungUmschalten,
    wochenplanErinnerungenAlleSetzen,
  };
}
