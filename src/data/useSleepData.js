import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSleepData(userId) {
  const [schlafEintraege, setSchlafEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("sleep_entries")
        .select("datum, stunden, schlafqualitaet, einschlafzeit, durchgeschlafen, erholt, traeume, bemerkungen")
        .eq("user_id", userId)
        .order("datum");
      if (cancelled || !data) return;
      setSchlafEintraege(
        data.map((r) => ({
          datum: r.datum,
          stunden: Number(r.stunden),
          schlafqualitaet: r.schlafqualitaet || "",
          einschlafzeit: r.einschlafzeit || "",
          durchgeschlafen: r.durchgeschlafen,
          erholt: r.erholt,
          traeume: r.traeume || "",
          bemerkungen: r.bemerkungen || "",
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const schlafHinzufuegen = useCallback(
    async (eintrag) => {
      if (!eintrag.stunden) return { ok: false, error: "Bitte die Stunden eintragen." };
      const stunden = Number(eintrag.stunden);
      // Detailfelder sind optional (progressive disclosure) — nur mitschicken,
      // was der Nutzer tatsächlich ausgefüllt hat, statt leere Werte zu überschreiben.
      const details = {};
      if (eintrag.schlafqualitaet) details.schlafqualitaet = eintrag.schlafqualitaet;
      if (eintrag.einschlafzeit) details.einschlafzeit = eintrag.einschlafzeit;
      if (eintrag.durchgeschlafen != null) details.durchgeschlafen = eintrag.durchgeschlafen;
      if (eintrag.erholt != null) details.erholt = eintrag.erholt;
      if (eintrag.traeume) details.traeume = eintrag.traeume;
      if (eintrag.bemerkungen) details.bemerkungen = eintrag.bemerkungen;

      const { error } = await supabase
        .from("sleep_entries")
        .upsert({ user_id: userId, datum: eintrag.datum, stunden, ...details }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setSchlafEintraege((prev) =>
        [...prev.filter((e) => e.datum !== eintrag.datum), { datum: eintrag.datum, stunden, ...details }].sort((a, b) =>
          a.datum.localeCompare(b.datum)
        )
      );
      return { ok: true };
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
