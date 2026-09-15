import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

const heute = () => toLocalISODate(new Date());

// Gleicher Aufbau wie useTageslichtData.js — ein Log-Eintrag pro Tag mit
// laufender Gesamtzeit am Telefon (Minuten) statt vieler Einzelzeilen, plus
// ein Tagesziel als eigene Einstellung. Automatisches Auslesen vom Telefon
// selbst ist aus einer Browser-/PWA-App heraus nicht möglich (siehe
// Migration 0086) — bewusst rein manuelles Eintragen, wie bei jeder
// anderen Kategorie.
export function useBildschirmzeitData(userId) {
  const [bildschirmzeitEintraege, setBildschirmzeitEintraege] = useState([]);
  const [bildschirmzeitZielMinuten, setBildschirmzeitZielMinuten] = useState(60);
  // Siehe useHydrationData.js für die ausführliche Begründung: verhindert,
  // dass schnelles Mehrfach-Tippen einen Tap verliert, weil zwei parallele
  // Aufrufe sonst denselben, noch nicht aktualisierten State als Basis nehmen.
  const pendingHeuteRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: logs }, { data: settings }] = await Promise.all([
        supabase.from("bildschirmzeit_logs").select("datum, minuten").eq("user_id", userId).order("datum"),
        supabase.from("bildschirmzeit_settings").select("ziel_minuten").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (logs) setBildschirmzeitEintraege(logs.map((r) => ({ datum: r.datum, minuten: r.minuten })));
      if (settings) setBildschirmzeitZielMinuten(settings.ziel_minuten);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const bildschirmzeitHeuteMinuten = useMemo(() => {
    const eintrag = bildschirmzeitEintraege.find((e) => e.datum === heute());
    return eintrag?.minuten ?? 0;
  }, [bildschirmzeitEintraege]);

  const bildschirmzeitHinzufuegen = useCallback(
    async (deltaMinuten) => {
      const datum = heute();
      const bisher =
        pendingHeuteRef.current?.datum === datum
          ? pendingHeuteRef.current.minuten
          : bildschirmzeitEintraege.find((e) => e.datum === datum)?.minuten ?? 0;
      const neueMinuten = Math.max(0, bisher + deltaMinuten);
      pendingHeuteRef.current = { datum, minuten: neueMinuten };
      const { error } = await supabase
        .from("bildschirmzeit_logs")
        .upsert({ user_id: userId, datum, minuten: neueMinuten }, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        if (pendingHeuteRef.current?.datum === datum && pendingHeuteRef.current?.minuten === neueMinuten) {
          pendingHeuteRef.current = null;
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setBildschirmzeitEintraege((prev) =>
        [...prev.filter((e) => e.datum !== datum), { datum, minuten: neueMinuten }].sort((a, b) => a.datum.localeCompare(b.datum))
      );
      return { ok: true };
    },
    [userId, bildschirmzeitEintraege]
  );

  const bildschirmzeitZielSetzen = useCallback(
    async (zielMinuten) => {
      const wert = Math.max(0, Number(zielMinuten) || 0);
      const vorher = bildschirmzeitZielMinuten;
      setBildschirmzeitZielMinuten(wert);
      const { error } = await supabase
        .from("bildschirmzeit_settings")
        .upsert({ user_id: userId, ziel_minuten: wert }, { onConflict: "user_id" });
      if (error) {
        console.error(error);
        setBildschirmzeitZielMinuten(vorher);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      return { ok: true };
    },
    [userId, bildschirmzeitZielMinuten]
  );

  // Siehe hydrationZielZuruecksetzen()/tageslichtZielZuruecksetzen(): ein
  // einmal gesetztes Ziel muss sich wieder auf "gar nicht konfiguriert"
  // zurückstellen lassen, sonst bleibt die Home-Kachel dauerhaft "aktiv".
  const bildschirmzeitZielZuruecksetzen = useCallback(async () => {
    const vorher = bildschirmzeitZielMinuten;
    setBildschirmzeitZielMinuten(60);
    const { error } = await supabase.from("bildschirmzeit_settings").delete().eq("user_id", userId);
    if (error) {
      console.error(error);
      setBildschirmzeitZielMinuten(vorher);
      return { ok: false, error: `Zurücksetzen fehlgeschlagen: ${error.message}` };
    }
    return { ok: true };
  }, [userId, bildschirmzeitZielMinuten]);

  return {
    bildschirmzeitEintraege,
    bildschirmzeitHeuteMinuten,
    bildschirmzeitZielMinuten,
    bildschirmzeitHinzufuegen,
    bildschirmzeitZielSetzen,
    bildschirmzeitZielZuruecksetzen,
  };
}
