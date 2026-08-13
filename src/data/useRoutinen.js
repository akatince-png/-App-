import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToSchritt(r) {
  return { id: r.id, routine: r.routine, reihenfolge: r.reihenfolge, name: r.name, dauerMin: r.dauer_min };
}

function rowToDurchlauf(r) {
  return {
    id: r.id,
    routine: r.routine,
    datum: r.datum,
    schritte: r.schritte || [],
    gestartetUm: r.gestartet_um,
    abgeschlossenUm: r.abgeschlossen_um,
  };
}

// Geführte Morgen-/Abendroutine (Phase 1, 13.08.) — Konfiguration
// (routine_schritte: was gehört dazu, Reihenfolge, geplante Dauer) getrennt
// von den tatsächlichen Durchläufen (routine_durchlaeufe: was wurde wann
// wirklich gemacht, wie lange hat's gedauert) — siehe RoutineAblauf.jsx.
export function useRoutinen(userId) {
  const [schritte, setSchritte] = useState([]);
  const [durchlaeufe, setDurchlaeufe] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: s }, { data: d }] = await Promise.all([
        supabase.from("routine_schritte").select("*").eq("user_id", userId).order("routine").order("reihenfolge"),
        supabase.from("routine_durchlaeufe").select("*").eq("user_id", userId).order("gestartet_um", { ascending: false }),
      ]);
      if (cancelled) return;
      if (s) setSchritte(s.map(rowToSchritt));
      if (d) setDurchlaeufe(d.map(rowToDurchlauf));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const schrittHinzufuegen = useCallback(
    async (routine, name, dauerMin) => {
      if (!name?.trim()) return { ok: false, error: "Bitte einen Namen für den Schritt eingeben." };
      const bisherige = schritte.filter((sc) => sc.routine === routine);
      const reihenfolge = bisherige.length ? Math.max(...bisherige.map((sc) => sc.reihenfolge)) + 1 : 0;
      const row = { user_id: userId, routine, reihenfolge, name: name.trim(), dauer_min: Number(dauerMin) || 5 };
      const { data, error } = await supabase.from("routine_schritte").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToSchritt(data);
      setSchritte((prev) => [...prev, neu]);
      return { ok: true, schritt: neu };
    },
    [userId, schritte]
  );

  const schrittEntfernen = useCallback(async (id) => {
    setSchritte((prev) => prev.filter((sc) => sc.id !== id));
    const { error } = await supabase.from("routine_schritte").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  // Tauscht die Reihenfolge zweier benachbarter Schritte innerhalb derselben
  // Routine — reicht für "einen Schritt nach oben/unten verschieben", ohne
  // eine komplette Drag&Drop-Umsortierung bauen zu müssen.
  const schrittVerschieben = useCallback(
    async (id, richtung) => {
      const schritt = schritte.find((sc) => sc.id === id);
      if (!schritt) return;
      const geschwister = schritte.filter((sc) => sc.routine === schritt.routine).sort((a, b) => a.reihenfolge - b.reihenfolge);
      const idx = geschwister.findIndex((sc) => sc.id === id);
      const zielIdx = richtung === "hoch" ? idx - 1 : idx + 1;
      if (zielIdx < 0 || zielIdx >= geschwister.length) return;
      const ziel = geschwister[zielIdx];
      setSchritte((prev) =>
        prev.map((sc) => {
          if (sc.id === schritt.id) return { ...sc, reihenfolge: ziel.reihenfolge };
          if (sc.id === ziel.id) return { ...sc, reihenfolge: schritt.reihenfolge };
          return sc;
        })
      );
      await Promise.all([
        supabase.from("routine_schritte").update({ reihenfolge: ziel.reihenfolge }).eq("id", schritt.id),
        supabase.from("routine_schritte").update({ reihenfolge: schritt.reihenfolge }).eq("id", ziel.id),
      ]);
    },
    [schritte]
  );

  // Speichert einen abgeschlossenen Durchlauf — geplant vs. tatsächlich
  // gebrauchte Zeit je Schritt, damit die Aufwach-/Einschlaf-Routine
  // hinterher nachvollziehbar ist (Nutzerinnen-Vorgabe: Zeitgefühl-Problem
  // bei ADHS, "muss irgendwann getrackt/nachvollziehbar sein").
  const durchlaufSpeichern = useCallback(
    async ({ routine, schritte: schritteProtokoll, gestartetUm }) => {
      const row = {
        user_id: userId,
        routine,
        datum: new Date().toISOString().slice(0, 10),
        schritte: schritteProtokoll,
        gestartet_um: gestartetUm,
        abgeschlossen_um: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("routine_durchlaeufe").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToDurchlauf(data);
      setDurchlaeufe((prev) => [neu, ...prev]);
      return { ok: true, durchlauf: neu };
    },
    [userId]
  );

  return {
    routineSchritte: schritte,
    routineDurchlaeufe: durchlaeufe,
    routineSchrittHinzufuegen: schrittHinzufuegen,
    routineSchrittEntfernen: schrittEntfernen,
    routineSchrittVerschieben: schrittVerschieben,
    routineDurchlaufSpeichern: durchlaufSpeichern,
  };
}
