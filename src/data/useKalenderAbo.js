import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Kalender-Abo (24.10., Migration 0131 + Edge Function `kalender-abo`):
// geheimer Link, den der Apple-/Google-Kalender abonniert. Eine Zeile je
// Person; „Link sperren“ zieht ein neues Token, „Abo beenden“ löscht die Zeile.
export function aboAdresse(token) {
  if (!token) return "";
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kalender-abo?t=${token}`;
}
export const webcalAdresse = (token) => aboAdresse(token).replace(/^https?:\/\//, "webcal://");

export function useKalenderAbo(userId) {
  const [abo, setAbo] = useState(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let abgebrochen = false;
    (async () => {
      const { data, error } = await supabase.from("kalender_abos").select("token, ohne_bereiche, abgerufen_am").eq("user_id", userId).maybeSingle();
      if (abgebrochen) return;
      if (error) console.error(error);
      setAbo(data || null);
      setLadend(false);
    })();
    return () => {
      abgebrochen = true;
    };
  }, [userId]);

  const ergebnis = useCallback((data, error) => {
    if (error) {
      console.error(error);
      setFehler("Das hat nicht geklappt. Bitte noch einmal versuchen.");
      return { ok: false };
    }
    setFehler(null);
    setAbo(data);
    return { ok: true };
  }, []);

  const anlegen = useCallback(async () => {
    const { data, error } = await supabase.from("kalender_abos").insert({ user_id: userId }).select("token, ohne_bereiche, abgerufen_am").single();
    return ergebnis(data, error);
  }, [userId, ergebnis]);

  const neuesToken = useCallback(async () => {
    const { data, error } = await supabase.rpc("kalender_abo_neues_token");
    if (error) return ergebnis(null, error);
    return ergebnis({ ...abo, token: data, abgerufen_am: null }, null);
  }, [abo, ergebnis]);

  const bereichUmschalten = useCallback(
    async (bereichId) => {
      const alt = abo?.ohne_bereiche || [];
      const neu = alt.includes(bereichId) ? alt.filter((b) => b !== bereichId) : [...alt, bereichId];
      const { data, error } = await supabase.from("kalender_abos").update({ ohne_bereiche: neu }).eq("user_id", userId).select("token, ohne_bereiche, abgerufen_am").single();
      return ergebnis(data, error);
    },
    [abo, userId, ergebnis]
  );

  const beenden = useCallback(async () => {
    const { error } = await supabase.from("kalender_abos").delete().eq("user_id", userId);
    if (error) return ergebnis(null, error);
    setAbo(null);
    return { ok: true };
  }, [userId, ergebnis]);

  return { abo, ladend, fehler, anlegen, neuesToken, bereichUmschalten, beenden };
}
