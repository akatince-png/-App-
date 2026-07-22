import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const heute = () => new Date().toISOString().slice(0, 10);

export function useHydrationData(userId) {
  const [hydrationEintraege, setHydrationEintraege] = useState([]);
  const [hydrationZielMl, setHydrationZielMl] = useState(2500);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: logs }, { data: settings }] = await Promise.all([
        supabase
          .from("hydration_logs")
          .select("datum, menge_ml, elektrolyte, durstgefuehl, bemerkung")
          .eq("user_id", userId)
          .order("datum"),
        supabase.from("hydration_settings").select("ziel_ml").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (logs)
        setHydrationEintraege(
          logs.map((r) => ({
            datum: r.datum,
            mengeMl: r.menge_ml,
            elektrolyte: r.elektrolyte || false,
            durstgefuehl: r.durstgefuehl || "",
            bemerkung: r.bemerkung || "",
          }))
        );
      if (settings) setHydrationZielMl(settings.ziel_ml);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hydrationHeuteMl = useMemo(() => {
    const eintrag = hydrationEintraege.find((e) => e.datum === heute());
    return eintrag?.mengeMl ?? 0;
  }, [hydrationEintraege]);

  const hydrationHinzufuegen = useCallback(
    async (deltaMl) => {
      const datum = heute();
      const bisher = hydrationEintraege.find((e) => e.datum === datum)?.mengeMl ?? 0;
      const neueMenge = Math.max(0, bisher + deltaMl);
      const { error } = await supabase
        .from("hydration_logs")
        .upsert({ user_id: userId, datum, menge_ml: neueMenge }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return;
      }
      setHydrationEintraege((prev) => {
        const bestehend = prev.find((e) => e.datum === datum) || {};
        return [...prev.filter((e) => e.datum !== datum), { ...bestehend, datum, mengeMl: neueMenge }].sort((a, b) =>
          a.datum.localeCompare(b.datum)
        );
      });
    },
    [userId, hydrationEintraege]
  );

  const hydrationZielSetzen = useCallback(
    async (zielMl) => {
      const wert = Math.max(0, Number(zielMl) || 0);
      setHydrationZielMl(wert);
      const { error } = await supabase.from("hydration_settings").upsert({ user_id: userId, ziel_ml: wert }, { onConflict: "user_id" });
      if (error) console.error(error);
    },
    [userId]
  );

  // Optionaler Tages-Check-in (Elektrolyte/Durstgefühl/Bemerkung) — unabhängig
  // von der Trinkmenge, deshalb ein eigenes partielles Upsert auf dieselbe Zeile.
  const hydrationCheckinSpeichern = useCallback(
    async (felder) => {
      const datum = heute();
      const { error } = await supabase.from("hydration_logs").upsert({ user_id: userId, datum, ...felder }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return;
      }
      setHydrationEintraege((prev) => {
        const bestehend = prev.find((e) => e.datum === datum) || { mengeMl: 0 };
        return [...prev.filter((e) => e.datum !== datum), { ...bestehend, datum, ...felder }].sort((a, b) => a.datum.localeCompare(b.datum));
      });
    },
    [userId]
  );

  return {
    hydrationEintraege,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    hydrationZielSetzen,
    hydrationCheckinSpeichern,
  };
}
