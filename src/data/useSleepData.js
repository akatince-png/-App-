import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSleepData(userId) {
  const [schlafEintraege, setSchlafEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("sleep_entries").select("datum, stunden").eq("user_id", userId).order("datum");
      if (cancelled || !data) return;
      setSchlafEintraege(data.map((r) => ({ datum: r.datum, stunden: Number(r.stunden) })));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const schlafHinzufuegen = useCallback(
    async (eintrag) => {
      if (!eintrag.stunden) return;
      const stunden = Number(eintrag.stunden);
      const { error } = await supabase
        .from("sleep_entries")
        .upsert({ user_id: userId, datum: eintrag.datum, stunden }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return;
      }
      setSchlafEintraege((prev) =>
        [...prev.filter((e) => e.datum !== eintrag.datum), { datum: eintrag.datum, stunden }].sort((a, b) =>
          a.datum.localeCompare(b.datum)
        )
      );
    },
    [userId]
  );

  const schlafDurchschnitt7Tage = useMemo(() => {
    if (schlafEintraege.length === 0) return null;
    const letzte7 = schlafEintraege.slice(-7);
    const summe = letzte7.reduce((s, e) => s + e.stunden, 0);
    return Math.round((summe / letzte7.length) * 10) / 10;
  }, [schlafEintraege]);

  return { schlafEintraege, schlafHinzufuegen, schlafDurchschnitt7Tage };
}
