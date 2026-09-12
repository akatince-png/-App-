import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToAusnahme(r) {
  return {
    id: r.id,
    kategorie: r.kategorie,
    refId: r.ref_id,
    datum: r.datum,
    uhrzeit: r.uhrzeit,
    name: r.name,
    detail: r.detail,
    entfaellt: r.entfaellt,
    grund: r.grund || "",
    erstelltAm: r.erstellt_am,
  };
}

function ausnahmeKey({ kategorie, refId, datum }) {
  return `${kategorie}__${refId}__${datum}`;
}

// Einzeltag-Ausnahmen für wiederkehrende Pläne ("nur heute anders", siehe
// Migration 0080) — betrifft nur die fünf Kategorien, die keine eigene
// Tages-Zeile in der DB haben (Supplemente, Hormone/Medikamente,
// Ernährung, Gewohnheiten, Workflows). Training/Zeitblöcke brauchen das
// nicht, siehe buildDayItems()/dayItems.js.
export function useTagesplanAusnahmen(userId) {
  const [ausnahmen, setAusnahmen] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("tagesplan_ausnahmen").select("*").eq("user_id", userId);
      if (cancelled || !data) return;
      setAusnahmen(data.map(rowToAusnahme));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Map für O(1)-Nachschlagen in buildDayItems() statt eines linearen
  // Arrays-Scans pro Tagesplan-Eintrag.
  const ausnahmenNachSchluessel = useMemo(() => {
    const map = new Map();
    ausnahmen.forEach((a) => map.set(ausnahmeKey(a), a));
    return map;
  }, [ausnahmen]);

  const ausnahmeSetzen = useCallback(
    async ({ kategorie, refId, datum, uhrzeit, name, detail, entfaellt, grund }) => {
      const payload = {
        user_id: userId,
        kategorie,
        ref_id: refId,
        datum,
        uhrzeit: uhrzeit ?? null,
        name: name ?? null,
        detail: detail ?? null,
        entfaellt: !!entfaellt,
        grund: grund?.trim() || null,
      };
      const { data, error } = await supabase
        .from("tagesplan_ausnahmen")
        .upsert(payload, { onConflict: "user_id,kategorie,ref_id,datum" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToAusnahme(data);
      setAusnahmen((prev) => [...prev.filter((a) => !(a.kategorie === kategorie && a.refId === refId && a.datum === datum)), neu]);
      return { ok: true, ausnahme: neu };
    },
    [userId]
  );

  const ausnahmeEntfernen = useCallback(async (id) => {
    let vorherige;
    setAusnahmen((prev) => {
      vorherige = prev.find((a) => a.id === id);
      return prev.filter((a) => a.id !== id);
    });
    const { error } = await supabase.from("tagesplan_ausnahmen").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherige) setAusnahmen((prev) => [...prev, vorherige]);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }, []);

  return { ausnahmen, ausnahmenNachSchluessel, ausnahmeSetzen, ausnahmeEntfernen };
}
