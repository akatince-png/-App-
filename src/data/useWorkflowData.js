import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getWorkflowPresets as getLokalePresets } from "../utils/intervallMusikStorage";

function rowToPreset(r) {
  return {
    id: r.id,
    name: r.name,
    arbeitMin: String(r.arbeit_min),
    pauseMin: String(r.pause_min),
    gesamtMin: String(r.gesamt_min),
    modus: r.modus || "durchgehend",
  };
}

function rowToPlan(r) {
  return {
    id: r.id,
    presetId: r.preset_id,
    wochentage: r.wochentage || [],
    uhrzeit: r.uhrzeit || "",
    gueltigVon: r.gueltig_von || "",
    gueltigBis: r.gueltig_bis || "",
    aktiv: r.aktiv !== false,
  };
}

// Workflow-Presets lagen bisher rein in localStorage (intervallMusikStorage.js)
// — der Tagesplan liest aber ausschließlich aus Supabase, ein rein lokales
// Preset konnte dort also nie auftauchen. Nutzerin-Vorgabe 15.08.: Workflows
// sollen sich wie ihre sonstigen Protokolle Tagen/Uhrzeiten zuordnen lassen
// (fest wiederkehrend, ab einem Datum, in einem Zeitraum, oder unbestimmt) —
// dafür müssen Presets serverseitig liegen (workflow_presets) plus eine
// eigene Zeitplan-Tabelle (workflow_plaene), siehe Migration 0062.
export function useWorkflowData(userId) {
  const [workflowPresets, setWorkflowPresets] = useState([]);
  const [workflowPlaene, setWorkflowPlaene] = useState([]);
  // Bug-Fix (13.09., Teil 60): siehe useAtemuebungenData.js — weder load()
  // noch die einmalige Lokal-zu-DB-Migration unten hatten einen
  // cancelled-Guard.
  const geladenAbgebrochenRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: presetRows }, { data: planRows }] = await Promise.all([
      supabase.from("workflow_presets").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("workflow_plaene").select("*").eq("user_id", userId).order("created_at"),
    ]);
    if (geladenAbgebrochenRef.current) return;
    setWorkflowPresets((presetRows || []).map(rowToPreset));
    setWorkflowPlaene((planRows || []).map(rowToPlan));
    return presetRows || [];
  }, [userId]);

  // Einmalige Migration: schon vorhandene, rein lokale Presets (vor dieser
  // Umstellung angelegt) in die DB übernehmen, MIT gleicher ID — sonst würde
  // eine bereits zugeordnete Spotify-Playlist (anlass = `workflow:${id}`,
  // siehe WorkflowTimer.jsx) ihre Zuordnung verlieren. Läuft nur, solange die
  // DB für diese Person noch leer ist, damit sie nicht bei jedem Login erneut
  // greift oder Duplikate erzeugt.
  useEffect(() => {
    if (!userId) return;
    geladenAbgebrochenRef.current = false;
    (async () => {
      const presetRows = await load();
      if (geladenAbgebrochenRef.current) return;
      if (presetRows === undefined || presetRows.length > 0) return;
      const lokale = getLokalePresets();
      if (!lokale.length) return;
      const rows = lokale.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        arbeit_min: Number(p.arbeitMin) || 25,
        pause_min: Number(p.pauseMin) || 5,
        gesamt_min: Number(p.gesamtMin) || 100,
        modus: p.modus || "durchgehend",
      }));
      const { error } = await supabase.from("workflow_presets").insert(rows);
      if (error) {
        // Falls z. B. eine lokale ID kein gültiges uuid-Format hat (sehr
        // alte, vor crypto.randomUUID erzeugte Presets): ohne die IDs erneut
        // versuchen, damit die Presets wenigstens nicht verloren gehen (nur
        // die Spotify-Zuordnung müsste in diesem Randfall neu gesetzt werden).
        console.error(error);
        const { error: fallbackError } = await supabase
          .from("workflow_presets")
          .insert(rows.map(({ id: _id, ...rest }) => rest));
        if (fallbackError) {
          console.error(fallbackError);
          return;
        }
      }
      if (geladenAbgebrochenRef.current) return;
      await load();
    })();
    return () => {
      geladenAbgebrochenRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const workflowPresetHinzufuegen = useCallback(
    async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("workflow_presets")
        .insert({ user_id: userId, name: trimmed })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToPreset(data);
      setWorkflowPresets((prev) => [...prev, neu]);
      return { ok: true, preset: neu };
    },
    [userId]
  );

  const workflowPresetAendern = useCallback(async (id, patch) => {
    let vorher;
    setWorkflowPresets((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        vorher = p;
        return { ...p, ...patch };
      })
    );
    const row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.arbeitMin !== undefined) row.arbeit_min = Number(patch.arbeitMin) || 25;
    if (patch.pauseMin !== undefined) row.pause_min = Number(patch.pauseMin) || 0;
    if (patch.gesamtMin !== undefined) row.gesamt_min = Number(patch.gesamtMin) || 25;
    if (patch.modus !== undefined) row.modus = patch.modus;
    const { error } = await supabase.from("workflow_presets").update(row).eq("id", id);
    if (error) {
      console.error(error);
      if (vorher) setWorkflowPresets((prev) => prev.map((p) => (p.id === id ? vorher : p)));
    }
  }, []);

  const workflowPresetLoeschen = useCallback(async (id) => {
    // Bug-Fix: bei Fehlschlag verschwanden Preset UND abhängige Pläne
    // trotzdem sofort, bis zum nächsten Neuladen — wirkte wie gelöscht,
    // tauchten dann aber wieder auf, ohne jede Fehlermeldung.
    let vorherigesPreset;
    let vorherigerIndex;
    let entferntePlaene;
    setWorkflowPresets((prev) => {
      vorherigerIndex = prev.findIndex((p) => p.id === id);
      vorherigesPreset = prev[vorherigerIndex];
      return prev.filter((p) => p.id !== id);
    });
    // workflow_plaene hat on-delete-cascade auf preset_id — lokal mit nachziehen.
    setWorkflowPlaene((prev) => {
      entferntePlaene = prev.filter((p) => p.presetId === id);
      return prev.filter((p) => p.presetId !== id);
    });
    const { error } = await supabase.from("workflow_presets").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigesPreset) {
        setWorkflowPresets((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigesPreset);
          return next;
        });
      }
      if (entferntePlaene?.length) {
        setWorkflowPlaene((prev) => [...prev, ...entferntePlaene]);
      }
    }
  }, []);

  const workflowPlanHinzufuegen = useCallback(
    async (plan) => {
      const row = {
        user_id: userId,
        preset_id: plan.presetId,
        wochentage: plan.wochentage || [],
        uhrzeit: plan.uhrzeit || null,
        gueltig_von: plan.gueltigVon || null,
        gueltig_bis: plan.gueltigBis || null,
      };
      const { data, error } = await supabase.from("workflow_plaene").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToPlan(data);
      setWorkflowPlaene((prev) => [...prev, neu]);
      return { ok: true, plan: neu };
    },
    [userId]
  );

  const workflowPlanEntfernen = useCallback(async (id) => {
    let vorherigerPlan;
    let vorherigerIndex;
    setWorkflowPlaene((prev) => {
      vorherigerIndex = prev.findIndex((p) => p.id === id);
      vorherigerPlan = prev[vorherigerIndex];
      return prev.filter((p) => p.id !== id);
    });
    const { error } = await supabase.from("workflow_plaene").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigerPlan) {
        setWorkflowPlaene((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigerPlan);
          return next;
        });
      }
    }
  }, []);

  return {
    workflowPresets,
    workflowPlaene,
    workflowPresetHinzufuegen,
    workflowPresetAendern,
    workflowPresetLoeschen,
    workflowPlanHinzufuegen,
    workflowPlanEntfernen,
  };
}
