import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Frei eingegebenes Essen mit berechneten ca.-Werten (25.09., siehe
// utils/essenRechner.js). Nur bestätigte Einträge landen hier.
export function zeileZuEssen(r) {
  return {
    id: r.id,
    datum: r.datum,
    uhrzeit: r.uhrzeit ? String(r.uhrzeit).slice(0, 5) : "",
    text: r.text,
    posten: r.posten || [],
    werte: { kcal: Number(r.kcal), eiweiss: Number(r.eiweiss), fett: Number(r.fett), kh: Number(r.kh), zucker: Number(r.zucker), ballast: Number(r.ballast), omega3: Number(r.omega3), epaDha: Number(r.epa_dha), omega6: Number(r.omega6) },
  };
}

export function useEssen(userId) {
  const [essenEintraege, setEssenEintraege] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let ab = false;
    (async () => {
      const seit = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("essen_eintraege").select("*").eq("user_id", userId).gte("datum", seit).order("datum").order("created_at");
      if (ab) return;
      if (error) console.error(error);
      setEssenEintraege((data || []).map(zeileZuEssen));
    })();
    return () => {
      ab = true;
    };
  }, [userId]);

  const essenSpeichern = useCallback(
    async ({ datum, uhrzeit, text, posten, summe }) => {
      const row = {
        user_id: userId,
        datum,
        uhrzeit: uhrzeit || null,
        text,
        posten: posten.map((p) => ({ text: p.text, name: p.name || p.lebensmittel?.name || p.text, gramm: p.gramm, annahme: p.annahme || null, geschaetzt: !!p.geschaetzt, werte: p.werte })),
        kcal: summe.kcal,
        eiweiss: summe.eiweiss,
        fett: summe.fett,
        kh: summe.kh,
        zucker: summe.zucker,
        ballast: summe.ballast,
        omega3: summe.omega3,
        epa_dha: summe.epaDha,
        omega6: summe.omega6,
      };
      const { data, error } = await supabase.from("essen_eintraege").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zeileZuEssen(data);
      setEssenEintraege((prev) => [...prev, neu]);
      return { ok: true, eintrag: neu };
    },
    [userId]
  );

  const essenEntfernen = useCallback(async (id) => {
    const { error } = await supabase.from("essen_eintraege").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setEssenEintraege((prev) => prev.filter((e) => e.id !== id));
    return { ok: true };
  }, []);

  return { essenEintraege, essenSpeichern, essenEntfernen };
}
