import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { addDays } from "../utils/dates";

function rowToHormonDosierung(row) {
  return {
    menge: row.menge || "",
    intervallDays: row.intervall_mode === "custom" ? "custom" : row.intervall_days,
    customDays: row.custom_days != null ? String(row.custom_days) : "",
    eigenerStart: row.eigener_start || "",
    uhrzeit: row.uhrzeit ? row.uhrzeit.slice(0, 5) : "20:00",
  };
}

export function useHormoneData(userId, startdatum, dauer) {
  const [hormone, setHormone] = useState([]);
  const [hormonDosierung, setHormonDosierung] = useState({});
  const [hormonErledigt, setHormonErledigt] = useState({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: rows }, { data: logs }] = await Promise.all([
        supabase.from("hormones").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("hormone_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      const nextDosierung = {};
      (rows || []).forEach((row) => (nextDosierung[row.name] = rowToHormonDosierung(row)));
      setHormone((rows || []).map((r) => r.name));
      setHormonDosierung(nextDosierung);

      const nextErledigt = {};
      (logs || []).forEach((row) => {
        nextErledigt[`${row.dose_date}__${row.hormone_name}`] = row.erledigt;
      });
      setHormonErledigt(nextErledigt);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hormonHinzufuegen = useCallback(
    async (neuesHormon) => {
      const name = neuesHormon.name.trim();
      if (!name || hormone.includes(name)) return;
      const patch = {
        user_id: userId,
        name,
        menge: neuesHormon.menge,
        intervall_mode: neuesHormon.intervallDays === "custom" ? "custom" : "fixed",
        intervall_days: neuesHormon.intervallDays === "custom" ? 7 : neuesHormon.intervallDays,
        custom_days: neuesHormon.customDays ? Number(neuesHormon.customDays) : null,
        eigener_start: neuesHormon.eigenerStart || null,
        uhrzeit: neuesHormon.uhrzeit || "20:00",
      };
      const { error } = await supabase.from("hormones").insert(patch);
      if (error) {
        console.error(error);
        return;
      }
      setHormone((prev) => [...prev, name]);
      setHormonDosierung((prev) => ({ ...prev, [name]: { ...neuesHormon } }));
    },
    [hormone, userId]
  );

  const hormonEntfernen = useCallback(
    async (name) => {
      setHormone((prev) => prev.filter((h) => h !== name));
      setHormonDosierung((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      const { error } = await supabase.from("hormones").delete().eq("user_id", userId).eq("name", name);
      if (error) console.error(error);
    },
    [userId]
  );

  const toggleHormonErledigt = useCallback(
    async (datumStr, name) => {
      const k = `${datumStr}__${name}`;
      const nextVal = !hormonErledigt[k];
      setHormonErledigt((prev) => ({ ...prev, [k]: nextVal }));
      const { error } = await supabase.from("hormone_logs").upsert(
        { user_id: userId, hormone_name: name, dose_date: datumStr, erledigt: nextVal },
        { onConflict: "user_id,hormone_name,dose_date" }
      );
      if (error) console.error(error);
    },
    [hormonErledigt, userId]
  );

  const hormonPlan = useMemo(() => {
    const totalDays = (parseInt(dauer, 10) || 12) * 7;
    const dosen = [];
    hormone.forEach((h) => {
      const d = hormonDosierung[h];
      if (!d) return;
      const days = d.intervallDays === "custom" ? Number(d.customDays) || 7 : d.intervallDays;
      const start = new Date(d.eigenerStart || startdatum);
      for (let n = 0; n < totalDays; n += days) {
        dosen.push({ date: addDays(start, Math.round(n)), name: h, menge: d.menge, uhrzeit: d.uhrzeit || "20:00" });
      }
    });
    dosen.sort((a, b) => a.date - b.date || a.uhrzeit.localeCompare(b.uhrzeit));
    return dosen;
  }, [hormone, hormonDosierung, startdatum, dauer]);

  return {
    hormone,
    hormonDosierung,
    hormonHinzufuegen,
    hormonEntfernen,
    hormonErledigt,
    toggleHormonErledigt,
    hormonPlan,
  };
}
