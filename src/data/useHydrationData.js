import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";
import { feuereBelohnung } from "../utils/belohnungBus";

const heute = () => toLocalISODate(new Date());

export function useHydrationData(userId) {
  const [hydrationEintraege, setHydrationEintraege] = useState([]);
  const [hydrationZielMl, setHydrationZielMl] = useState(2500);
  // Hält den zuletzt SYNCHRON berechneten Stand fest (Bug-Fix: schnelles
  // Mehrfach-Tippen auf "+250 ml" verlor Taps, weil zwei fast gleichzeitig
  // gestartete Aufrufe beide denselben — noch nicht durch den ersten Aufruf
  // aktualisierten — `hydrationEintraege`-Stand als Basis nahmen, solange der
  // erste Request noch unterwegs war. Der Ref wird sofort (vor dem `await`)
  // geschrieben, dient nachfolgenden, schneller ausgelösten Aufrufen als
  // Basis und wird bei einem Fehler wieder verworfen, damit kein Phantom-
  // Stand entsteht, der nie tatsächlich gespeichert wurde.
  const pendingHeuteRef = useRef(null);

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
      const bisher =
        pendingHeuteRef.current?.datum === datum
          ? pendingHeuteRef.current.menge
          : hydrationEintraege.find((e) => e.datum === datum)?.mengeMl ?? 0;
      const neueMenge = Math.max(0, bisher + deltaMl);
      pendingHeuteRef.current = { datum, menge: neueMenge };
      const { error } = await supabase
        .from("hydration_logs")
        .upsert({ user_id: userId, datum, menge_ml: neueMenge }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        if (pendingHeuteRef.current?.datum === datum && pendingHeuteRef.current?.menge === neueMenge) {
          pendingHeuteRef.current = null;
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHydrationEintraege((prev) => {
        const bestehend = prev.find((e) => e.datum === datum) || {};
        return [...prev.filter((e) => e.datum !== datum), { ...bestehend, datum, mengeMl: neueMenge }].sort((a, b) =>
          a.datum.localeCompare(b.datum)
        );
      });
      // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): Hydration hat keine
      // geplante Uhrzeit, gegen die "rechtzeitig" geprüft werden könnte —
      // die Belohnung feiert stattdessen das erstmalige Erreichen des
      // Tagesziels (nicht jeden einzelnen Schluck-Tap).
      if (hydrationZielMl > 0 && bisher < hydrationZielMl && neueMenge >= hydrationZielMl) {
        feuereBelohnung({ text: "Trinkziel für heute erreicht", icon: "droplet", punkte: 1 });
      }
      return { ok: true };
    },
    [userId, hydrationEintraege, hydrationZielMl]
  );

  const hydrationZielSetzen = useCallback(
    async (zielMl) => {
      const wert = Math.max(0, Number(zielMl) || 0);
      const vorher = hydrationZielMl;
      setHydrationZielMl(wert);
      const { error } = await supabase.from("hydration_settings").upsert({ user_id: userId, ziel_ml: wert }, { onConflict: "user_id" });
      if (error) {
        console.error(error);
        setHydrationZielMl(vorher);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId, hydrationZielMl]
  );

  // Bug-Fix (Nutzerin-Vorgabe, 12.09.): ein einmal gesetztes Tagesziel
  // ließ sich nie wieder auf "gar nicht konfiguriert" zurückstellen — die
  // Home-Kachel blieb dadurch dauerhaft als "aktiv" hängen (Bedingung
  // `hydrationZielMl !== 2500`), selbst wenn alle Trinkmengen-Einträge
  // gelöscht wurden. Löscht die Einstellungs-Zeile komplett statt sie auf
  // einen Wert zu setzen, damit der Zustand wieder dem eines nie
  // eingerichteten Ziels entspricht (Standard 2500 ml).
  const hydrationZielZuruecksetzen = useCallback(async () => {
    const vorher = hydrationZielMl;
    setHydrationZielMl(2500);
    const { error } = await supabase.from("hydration_settings").delete().eq("user_id", userId);
    if (error) {
      console.error(error);
      setHydrationZielMl(vorher);
      return { ok: false, error: `Zurücksetzen fehlgeschlagen: ${error.message}` };
    }
    return { ok: true };
  }, [userId, hydrationZielMl]);

  // Optionaler Tages-Check-in (Elektrolyte/Durstgefühl/Bemerkung) — unabhängig
  // von der Trinkmenge, deshalb ein eigenes partielles Upsert auf dieselbe Zeile.
  const hydrationCheckinSpeichern = useCallback(
    async (felder) => {
      const datum = heute();
      const { error } = await supabase.from("hydration_logs").upsert({ user_id: userId, datum, ...felder }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHydrationEintraege((prev) => {
        const bestehend = prev.find((e) => e.datum === datum) || { mengeMl: 0 };
        return [...prev.filter((e) => e.datum !== datum), { ...bestehend, datum, ...felder }].sort((a, b) => a.datum.localeCompare(b.datum));
      });
      return { ok: true };
    },
    [userId]
  );

  // Bearbeiten/Löschen eines EINZELNEN Tages-Eintrags (17.09., Konsistenz-
  // Check) — bisher ließ sich nur der HEUTIGE Tag über hydrationHinzufuegen
  // (relativ, per Delta) ändern; ein vergangener Tag war weder korrigierbar
  // noch löschbar, anders als bei Medikamenten/Supplementen/Mahlzeiten/
  // Trainingseinheiten. Absolute Mengenangabe statt Delta, da hier — anders
  // als beim schnellen "+250 ml"-Tap — der Zielwert direkt bekannt ist.
  const hydrationEintragSetzen = useCallback(
    async (datum, mengeMl) => {
      const wert = Math.max(0, Number(mengeMl) || 0);
      const vorher = hydrationEintraege.find((e) => e.datum === datum);
      setHydrationEintraege((prev) => {
        const bestehend = prev.find((e) => e.datum === datum) || {};
        return [...prev.filter((e) => e.datum !== datum), { ...bestehend, datum, mengeMl: wert }].sort((a, b) => a.datum.localeCompare(b.datum));
      });
      const { error } = await supabase.from("hydration_logs").upsert({ user_id: userId, datum, menge_ml: wert }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        setHydrationEintraege((prev) => (vorher ? [...prev.filter((e) => e.datum !== datum), vorher] : prev.filter((e) => e.datum !== datum)));
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId, hydrationEintraege]
  );

  const hydrationEintragLoeschen = useCallback(
    async (datum) => {
      const vorher = hydrationEintraege.find((e) => e.datum === datum);
      setHydrationEintraege((prev) => prev.filter((e) => e.datum !== datum));
      const { error } = await supabase.from("hydration_logs").delete().eq("user_id", userId).eq("datum", datum);
      if (error) {
        console.error(error);
        if (vorher) setHydrationEintraege((prev) => [...prev, vorher].sort((a, b) => a.datum.localeCompare(b.datum)));
        return { ok: false, error: `Löschen fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId, hydrationEintraege]
  );

  return {
    hydrationEintraege,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    hydrationZielSetzen,
    hydrationZielZuruecksetzen,
    hydrationCheckinSpeichern,
    hydrationEintragSetzen,
    hydrationEintragLoeschen,
  };
}
