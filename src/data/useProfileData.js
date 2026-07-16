import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { MESSWERT_DEFS } from "../constants";

const DEFAULT_AKTIVE = ["gewicht", "kfa", "taille", "blutdruck", "ruhepuls", "energie"];

export function useProfileData(userId) {
  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState({
    geschlecht: "",
    geburtsdatum: "",
    groesse: "",
    gewichtStart: "",
  });
  const [datenteilung, setDatenteilungState] = useState(false);
  const [aktiveMesswerte, setAktiveMesswerte] = useState(DEFAULT_AKTIVE);
  const [customMesswerte, setCustomMesswerte] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: custom }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("custom_messwerte").select("*").eq("user_id", userId).order("created_at"),
      ]);
      if (cancelled) return;
      if (profile) {
        setPersonalData({
          geschlecht: profile.geschlecht || "",
          geburtsdatum: profile.geburtsdatum || "",
          groesse: profile.groesse ?? "",
          gewichtStart: profile.gewicht_start ?? "",
        });
        setDatenteilungState(!!profile.datenteilung);
        setAktiveMesswerte(profile.aktive_messwerte?.length ? profile.aktive_messwerte : DEFAULT_AKTIVE);
      }
      setCustomMesswerte(
        (custom || []).map((c) => ({ id: c.key, label: c.label, unit: c.unit || "", numeric: true }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setPersonal = useCallback(
    (feld, val) => {
      setPersonalData((prev) => ({ ...prev, [feld]: val }));
      const column = { geschlecht: "geschlecht", geburtsdatum: "geburtsdatum", groesse: "groesse", gewichtStart: "gewicht_start" }[feld];
      if (!column || !userId) return;
      supabase
        .from("profiles")
        .update({ [column]: val === "" ? null : val })
        .eq("id", userId)
        .then(({ error }) => error && console.error(error));
    },
    [userId]
  );

  const toggleDatenteilung = useCallback(() => {
    setDatenteilungState((prev) => {
      const next = !prev;
      supabase
        .from("profiles")
        .update({ datenteilung: next })
        .eq("id", userId)
        .then(({ error }) => error && console.error(error));
      return next;
    });
  }, [userId]);

  const combinedMesswertDefs = useMemo(() => [...MESSWERT_DEFS, ...customMesswerte], [customMesswerte]);

  const toggleMesswert = useCallback(
    (id) => {
      setAktiveMesswerte((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        supabase
          .from("profiles")
          .update({ aktive_messwerte: next })
          .eq("id", userId)
          .then(({ error }) => error && console.error(error));
        return next;
      });
    },
    [userId]
  );

  const addCustomMesswert = useCallback(
    async (label) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const id = trimmed.toLowerCase().replace(/\s+/g, "_");
      if (combinedMesswertDefs.some((d) => d.id === id)) return;
      const { error } = await supabase
        .from("custom_messwerte")
        .insert({ user_id: userId, key: id, label: trimmed, unit: "" });
      if (error) {
        console.error(error);
        return;
      }
      setCustomMesswerte((prev) => [...prev, { id, label: trimmed, unit: "", numeric: true }]);
      setAktiveMesswerte((prev) => {
        const next = [...prev, id];
        supabase
          .from("profiles")
          .update({ aktive_messwerte: next })
          .eq("id", userId)
          .then(({ error: e }) => e && console.error(e));
        return next;
      });
    },
    [userId, combinedMesswertDefs]
  );

  return {
    loading,
    personalData,
    setPersonal,
    datenteilung,
    toggleDatenteilung,
    aktiveMesswerte,
    toggleMesswert,
    customMesswerte,
    combinedMesswertDefs,
    addCustomMesswert,
  };
}
