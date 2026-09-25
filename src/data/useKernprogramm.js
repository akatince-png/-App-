import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";
import { faelligeBausteine, programmStand, zeileZuEtappe } from "../utils/kernprogramm";
import { plusTage } from "../utils/schichtplan";

const zeileZuCheck = (r) => ({ wocheStart: r.woche_start, kernKey: r.kern_key, stoerung: r.stoerung || [], aenderung: r.aenderung || "", stimmung: r.stimmung });
const zeileZuTop3 = (r) => ({ datum: r.datum, punkte: r.punkte || [], ersterSchritt: r.erster_schritt || "", angefangen: r.angefangen });

// AKA-Kernprogramm (25.09.): Etappen (vom Coach angelegt), Wochen-Checks
// und der Morgen-Startblock "Top 3". Legt fehlende Pflicht-Schritte in der
// Morgen-/Abendroutine an, sobald ihre Einführungswoche beginnt.
export function useKernprogramm(userId, routinen) {
  const [etappen, setEtappen] = useState([]);
  const [checks, setChecks] = useState([]);
  const [top3, setTop3] = useState({});
  const heute = toLocalISODate(new Date());

  useEffect(() => {
    if (!userId) return;
    let abgebrochen = false;
    (async () => {
      const [{ data: e }, { data: c }, { data: t }] = await Promise.all([
        supabase.from("coaching_etappen").select("*").eq("user_id", userId).order("nummer"),
        supabase.from("wochen_checks").select("*").eq("user_id", userId).gte("woche_start", plusTage(toLocalISODate(new Date()), -120)),
        supabase.from("tages_top3").select("*").eq("user_id", userId).gte("datum", plusTage(toLocalISODate(new Date()), -30)),
      ]);
      if (abgebrochen) return;
      setEtappen((e || []).map(zeileZuEtappe));
      setChecks((c || []).map(zeileZuCheck));
      const m = {};
      (t || []).forEach((r) => (m[r.datum] = zeileZuTop3(r)));
      setTop3(m);
    })();
    return () => {
      abgebrochen = true;
    };
  }, [userId]);

  const stand = useMemo(() => programmStand(etappen, heute), [etappen, heute]);

  // Fehlende Pflicht-Schritte anlegen — erst wenn die Routine-Schritte
  // geladen sind, und je Schlüsselsatz nur einmal pro Sitzung versuchen.
  const { routineGeladen, routineSchritteAlle, routineKernSchritteAnlegen } = routinen;
  const versuchtRef = useRef("");
  useEffect(() => {
    if (!routineGeladen || !stand.aktiv || !routineKernSchritteAnlegen) return;
    const fehlend = faelligeBausteine(stand).filter((b) => b.routine && !routineSchritteAlle.some((s) => s.kernKey === b.key));
    const schluessel = `${userId}:${fehlend.map((b) => b.key).join(",")}`;
    if (!fehlend.length || versuchtRef.current === schluessel) return;
    versuchtRef.current = schluessel;
    routineKernSchritteAnlegen(fehlend);
  }, [routineGeladen, stand, routineSchritteAlle, routineKernSchritteAnlegen, userId]);

  const wochenCheckSpeichern = useCallback(
    async (wocheStart, { kernKey, stoerung, aenderung, stimmung }) => {
      const row = { user_id: userId, woche_start: wocheStart, kern_key: kernKey || null, stoerung: stoerung || [], aenderung: aenderung || null, stimmung: stimmung || null };
      const { error } = await supabase.from("wochen_checks").upsert(row, { onConflict: "user_id,woche_start" });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setChecks((prev) => [...prev.filter((c) => c.wocheStart !== wocheStart), zeileZuCheck(row)]);
      return { ok: true };
    },
    [userId]
  );

  const top3Speichern = useCallback(
    async (datum, felder) => {
      const alt = top3[datum] || { punkte: [], ersterSchritt: "", angefangen: null };
      const neu = { ...alt, ...felder, datum };
      const row = { user_id: userId, datum, punkte: (neu.punkte || []).map((p) => p.trim()).filter(Boolean), erster_schritt: neu.ersterSchritt?.trim() || null, angefangen: neu.angefangen ?? null };
      const { error } = await supabase.from("tages_top3").upsert(row, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setTop3((prev) => ({ ...prev, [datum]: zeileZuTop3(row) }));
      return { ok: true };
    },
    [userId, top3]
  );

  return {
    kernEtappen: etappen,
    kernStand: stand,
    kernWochenChecks: checks,
    kernTop3: top3,
    kernWochenCheckSpeichern: wochenCheckSpeichern,
    kernTop3Speichern: top3Speichern,
  };
}
