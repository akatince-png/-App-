import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToEintrag(r) {
  return { id: r.id, bereich: r.bereich || "", titel: r.titel, text: r.text, erstelltAm: r.erstellt_am };
}

// Wissens-Basis-Verwaltung (13.08., "Aka lernt mit") — Gegenstück zu den
// statischen .md-Dateien unter src/wissen/ (siehe utils/wissensBasis.js):
// hier trägt die Admin jederzeit direkt aus der App neues Wissen ein, ohne
// Deploy. Lesen dürfen alle eingeloggten Personen (fließt über KiChat.jsx
// in den Gesprächskontext ein), Schreiben bleibt der Admin vorbehalten
// (RLS in 0046_coach_wissen.sql) — die Schreib-Funktionen hier greifen bei
// einer Nicht-Admin einfach nicht (RLS lehnt ab), die Admin-Ansicht ist
// aber ohnehin nur für Admins erreichbar (AdminWissenView.jsx).
export function useCoachWissen(userId) {
  const [coachWissen, setCoachWissen] = useState([]);

  const laden = useCallback(async () => {
    const { data, error } = await supabase.from("coach_wissen").select("*").order("erstellt_am", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setCoachWissen((data || []).map(rowToEintrag));
  }, []);

  useEffect(() => {
    if (!userId) return;
    laden();
  }, [userId, laden]);

  const coachWissenHinzufuegen = useCallback(async (eintrag) => {
    if (!eintrag.titel?.trim() || !eintrag.text?.trim()) {
      return { ok: false, error: "Bitte Titel und Text eingeben." };
    }
    const { data, error } = await supabase
      .from("coach_wissen")
      .insert({ bereich: eintrag.bereich || null, titel: eintrag.titel.trim(), text: eintrag.text.trim() })
      .select()
      .single();
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    const neu = rowToEintrag(data);
    setCoachWissen((prev) => [neu, ...prev]);
    return { ok: true, eintrag: neu };
  }, []);

  const coachWissenEntfernen = useCallback(async (id) => {
    setCoachWissen((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("coach_wissen").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return { coachWissen, coachWissenHinzufuegen, coachWissenEntfernen };
}
