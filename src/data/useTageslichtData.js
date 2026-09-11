import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

const heute = () => toLocalISODate(new Date());

// Gleicher Aufbau wie useHydrationData.js — ein Log-Eintrag pro Tag mit
// laufender Gesamtzeit im Tageslicht/Freien (Minuten) statt vieler
// Einzelzeilen, plus ein Tagesziel als eigene Einstellung.
export function useTageslichtData(userId) {
  const [tageslichtEintraege, setTageslichtEintraege] = useState([]);
  const [tageslichtZielMinuten, setTageslichtZielMinuten] = useState(30);
  // Siehe useHydrationData.js für die ausführliche Begründung: verhindert,
  // dass schnelles Mehrfach-Tippen einen Tap verliert, weil zwei parallele
  // Aufrufe sonst denselben, noch nicht aktualisierten State als Basis nehmen.
  const pendingHeuteRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: logs }, { data: settings }] = await Promise.all([
        supabase.from("tageslicht_logs").select("datum, minuten").eq("user_id", userId).order("datum"),
        supabase.from("tageslicht_settings").select("ziel_minuten").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (logs) setTageslichtEintraege(logs.map((r) => ({ datum: r.datum, minuten: r.minuten })));
      if (settings) setTageslichtZielMinuten(settings.ziel_minuten);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const tageslichtHeuteMinuten = useMemo(() => {
    const eintrag = tageslichtEintraege.find((e) => e.datum === heute());
    return eintrag?.minuten ?? 0;
  }, [tageslichtEintraege]);

  const tageslichtHinzufuegen = useCallback(
    async (deltaMinuten) => {
      const datum = heute();
      const bisher =
        pendingHeuteRef.current?.datum === datum
          ? pendingHeuteRef.current.minuten
          : tageslichtEintraege.find((e) => e.datum === datum)?.minuten ?? 0;
      const neueMinuten = Math.max(0, bisher + deltaMinuten);
      pendingHeuteRef.current = { datum, minuten: neueMinuten };
      const { error } = await supabase
        .from("tageslicht_logs")
        .upsert({ user_id: userId, datum, minuten: neueMinuten }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        if (pendingHeuteRef.current?.datum === datum && pendingHeuteRef.current?.minuten === neueMinuten) {
          pendingHeuteRef.current = null;
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setTageslichtEintraege((prev) =>
        [...prev.filter((e) => e.datum !== datum), { datum, minuten: neueMinuten }].sort((a, b) => a.datum.localeCompare(b.datum))
      );
      return { ok: true };
    },
    [userId, tageslichtEintraege]
  );

  const tageslichtZielSetzen = useCallback(
    async (zielMinuten) => {
      const wert = Math.max(0, Number(zielMinuten) || 0);
      const vorher = tageslichtZielMinuten;
      setTageslichtZielMinuten(wert);
      const { error } = await supabase
        .from("tageslicht_settings")
        .upsert({ user_id: userId, ziel_minuten: wert }, { onConflict: "user_id" });
      if (error) {
        console.error(error);
        setTageslichtZielMinuten(vorher);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId, tageslichtZielMinuten]
  );

  return {
    tageslichtEintraege,
    tageslichtHeuteMinuten,
    tageslichtZielMinuten,
    tageslichtHinzufuegen,
    tageslichtZielSetzen,
  };
}
