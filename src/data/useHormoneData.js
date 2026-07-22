import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { activeDoseDays } from "../utils/schedule";
import { toLocalISODate } from "../utils/dates";

function rowToHormonDosierung(row) {
  return {
    id: row.id,
    menge: row.menge || "",
    kategorie: row.kategorie || "Hormone",
    einnahmeart: row.einnahmeart || "Injektion",
    intervallTyp: row.intervall_mode || "fixed",
    intervallDays: row.intervall_days || 7,
    customDays: row.custom_days != null ? String(row.custom_days) : "",
    onDays: row.on_days != null ? String(row.on_days) : "",
    offDays: row.off_days != null ? String(row.off_days) : "",
    weekdays: row.weekdays || [],
    eigenerStart: row.eigener_start || "",
    uhrzeiten: row.uhrzeiten?.length ? row.uhrzeiten.map((t) => t.slice(0, 5)) : ["20:00"],
    fotoPath: row.foto_path || null,
  };
}

function toRow(userId, neuesHormon) {
  const isCustom = neuesHormon.intervallTyp === "custom";
  const isCycle = neuesHormon.intervallTyp === "cycle";
  const isWeekdays = neuesHormon.intervallTyp === "weekdays";
  return {
    user_id: userId,
    menge: neuesHormon.menge,
    kategorie: neuesHormon.kategorie || "Hormone",
    einnahmeart: neuesHormon.einnahmeart || "Injektion",
    intervall_mode: neuesHormon.intervallTyp || "fixed",
    intervall_days: !isCustom && !isCycle && !isWeekdays ? neuesHormon.intervallDays : null,
    custom_days: isCustom && neuesHormon.customDays ? Number(neuesHormon.customDays) : null,
    on_days: isCycle && neuesHormon.onDays ? Number(neuesHormon.onDays) : null,
    off_days: isCycle && neuesHormon.offDays !== "" ? Number(neuesHormon.offDays) : null,
    weekdays: isWeekdays ? neuesHormon.weekdays || [] : [],
    eigener_start: neuesHormon.eigenerStart || null,
    uhrzeiten: neuesHormon.uhrzeiten?.length ? neuesHormon.uhrzeiten : ["20:00"],
  };
}

export function useHormoneData(userId, startdatum, dauer) {
  const [hormone, setHormone] = useState([]);
  const [hormonDosierung, setHormonDosierung] = useState({});
  const [hormonErledigt, setHormonErledigt] = useState({});
  const [hormonFeedback, setHormonFeedback] = useState({});

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
      const nextFeedback = {};
      (logs || []).forEach((row) => {
        const k = `${row.dose_date}__${row.hormone_name}__${row.uhrzeit}`;
        nextErledigt[k] = row.erledigt;
        nextFeedback[k] = {
          vertraeglichkeit: row.vertraeglichkeit || "",
          wirkung: row.wirkung || "",
          nebenwirkungen: row.nebenwirkungen || [],
          notizen: row.notizen || "",
        };
      });
      setHormonErledigt(nextErledigt);
      setHormonFeedback(nextFeedback);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hormonHinzufuegen = useCallback(
    async (neuesHormon) => {
      const name = neuesHormon.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      if (hormone.includes(name)) return { ok: false, error: "Dieses Präparat ist schon in deinem Protokoll." };
      const { data, error } = await supabase.from("hormones").insert({ name, ...toRow(userId, neuesHormon) }).select().single();
      if (error) {
        console.error(error);
        if (error.code === "23505") {
          // Existiert in der Datenbank schon (z. B. weil ein früherer Versuch
          // tatsächlich gespeichert wurde, die Seite das aber noch nicht wusste)
          // -> lokalen Stand aus der DB neu laden statt nur einen Fehler zu zeigen.
          const { data: rows } = await supabase.from("hormones").select("*").eq("user_id", userId).order("created_at");
          const nextDosierung = {};
          (rows || []).forEach((row) => (nextDosierung[row.name] = rowToHormonDosierung(row)));
          setHormone((rows || []).map((r) => r.name));
          setHormonDosierung(nextDosierung);
          return { ok: false, error: `"${name}" war schon gespeichert — deine Liste wurde aktualisiert, schau weiter unten.` };
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHormone((prev) => [...prev, name]);
      setHormonDosierung((prev) => ({
        ...prev,
        [name]: {
          id: data.id,
          menge: neuesHormon.menge,
          kategorie: neuesHormon.kategorie || "Hormone",
          einnahmeart: neuesHormon.einnahmeart || "Injektion",
          intervallTyp: neuesHormon.intervallTyp || "fixed",
          intervallDays: neuesHormon.intervallDays,
          customDays: neuesHormon.customDays,
          onDays: neuesHormon.onDays,
          offDays: neuesHormon.offDays,
          weekdays: neuesHormon.weekdays || [],
          eigenerStart: neuesHormon.eigenerStart,
          uhrzeiten: neuesHormon.uhrzeiten?.length ? neuesHormon.uhrzeiten : ["20:00"],
          fotoPath: null,
        },
      }));
      return { ok: true };
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

  const setHormonFoto = useCallback(
    async (name, file) => {
      try {
        const path = await uploadPhoto(userId, file, "praeparate");
        setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], fotoPath: path } }));
        const { error } = await supabase.from("hormones").update({ foto_path: path }).eq("user_id", userId).eq("name", name);
        if (error) console.error(error);
      } catch (err) {
        console.error(err);
      }
    },
    [userId]
  );

  const setHormonKategorie = useCallback(
    async (name, kategorie) => {
      setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], kategorie } }));
      const { error } = await supabase.from("hormones").update({ kategorie }).eq("user_id", userId).eq("name", name);
      if (error) console.error(error);
    },
    [userId]
  );

  const setHormonEinnahmeart = useCallback(
    async (name, einnahmeart) => {
      setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], einnahmeart } }));
      const { error } = await supabase.from("hormones").update({ einnahmeart }).eq("user_id", userId).eq("name", name);
      if (error) console.error(error);
    },
    [userId]
  );

  const toggleHormonErledigt = useCallback(
    async (datumStr, name, uhrzeit) => {
      const k = `${datumStr}__${name}__${uhrzeit}`;
      const nextVal = !hormonErledigt[k];
      const nowIso = new Date().toISOString();
      setHormonErledigt((prev) => ({ ...prev, [k]: nextVal }));
      const { error } = await supabase.from("hormone_logs").upsert(
        { user_id: userId, hormone_name: name, dose_date: datumStr, uhrzeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "user_id,hormone_name,dose_date,uhrzeit" }
      );
      if (error) console.error(error);
    },
    [hormonErledigt, userId]
  );

  const saveHormonFeedback = useCallback(
    async (dose, draftFeedback) => {
      const datumStr = toLocalISODate(dose.date);
      const k = `${datumStr}__${dose.name}__${dose.uhrzeit}`;
      const nowIso = new Date().toISOString();
      const record = {
        vertraeglichkeit: draftFeedback.vertraeglichkeit,
        wirkung: draftFeedback.wirkung,
        nebenwirkungen: draftFeedback.nebenwirkungen,
        notizen: draftFeedback.notizen,
      };
      setHormonErledigt((prev) => ({ ...prev, [k]: true }));
      setHormonFeedback((prev) => ({ ...prev, [k]: record }));
      const { error } = await supabase.from("hormone_logs").upsert(
        {
          user_id: userId,
          hormone_name: dose.name,
          dose_date: datumStr,
          uhrzeit: dose.uhrzeit,
          erledigt: true,
          erledigt_at: nowIso,
          ...record,
        },
        { onConflict: "user_id,hormone_name,dose_date,uhrzeit" }
      );
      if (error) console.error(error);
    },
    [userId]
  );

  const skipHormonFeedback = useCallback(
    async (dose) => {
      const datumStr = toLocalISODate(dose.date);
      const k = `${datumStr}__${dose.name}__${dose.uhrzeit}`;
      const nowIso = new Date().toISOString();
      setHormonErledigt((prev) => ({ ...prev, [k]: true }));
      const { error } = await supabase.from("hormone_logs").upsert(
        { user_id: userId, hormone_name: dose.name, dose_date: datumStr, uhrzeit: dose.uhrzeit, erledigt: true, erledigt_at: nowIso },
        { onConflict: "user_id,hormone_name,dose_date,uhrzeit" }
      );
      if (error) console.error(error);
    },
    [userId]
  );

  const hormonPlan = useMemo(() => {
    const totalDays = (parseInt(dauer, 10) || 12) * 7;
    const dosen = [];
    hormone.forEach((h) => {
      const d = hormonDosierung[h];
      if (!d) return;
      const dates = activeDoseDays(d, startdatum, totalDays);
      const zeiten = d.uhrzeiten?.length ? d.uhrzeiten : ["20:00"];
      dates.forEach((date) => {
        zeiten.forEach((uhrzeit) => {
          dosen.push({ date, name: h, menge: d.menge || "", einnahmeart: d.einnahmeart || "Injektion", uhrzeit });
        });
      });
    });
    dosen.sort((a, b) => a.date - b.date || a.uhrzeit.localeCompare(b.uhrzeit));
    return dosen;
  }, [hormone, hormonDosierung, startdatum, dauer]);

  return {
    hormone,
    hormonDosierung,
    hormonHinzufuegen,
    hormonEntfernen,
    setHormonFoto,
    setHormonKategorie,
    setHormonEinnahmeart,
    hormonErledigt,
    toggleHormonErledigt,
    hormonFeedback,
    saveHormonFeedback,
    skipHormonFeedback,
    hormonPlan,
  };
}
