import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Lexikon-Fragen & -Antworten werden jetzt dauerhaft gespeichert (statt nur
// im Browser-Speicher) — dient als durchsuchbare, nach Kategorie geordnete
// Wissensdatenbank für den Coach selbst, nicht nur als flüchtiger Chat.
export function useLexikon(userId) {
  const [lexikonEintraege, setLexikonEintraege] = useState([]);
  const [lexikonLoading, setLexikonLoading] = useState(false);

  const lexikonLaden = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("lexikon_eintraege")
      .select("*")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false });
    if (error) console.error(error);
    setLexikonEintraege(data || []);
  }, [userId]);

  useEffect(() => {
    lexikonLaden();
  }, [lexikonLaden]);

  const lexikonFragen = useCallback(
    async (frage, kategorie) => {
      const trimmed = frage.trim();
      if (!trimmed) return;
      setLexikonLoading(true);
      const platzhalter = { id: `pending-${Date.now()}`, frage: trimmed, kategorie, antwort: null, erstellt_am: new Date().toISOString(), _pending: true };
      setLexikonEintraege((prev) => [platzhalter, ...prev]);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("lexikon", {
          body: { frage: trimmed, kategorie },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error || data?.error) throw new Error(data?.error || error.message);
        const antwort = data.antwort || "Keine Antwort erhalten.";
        const { data: gespeichert, error: saveError } = await supabase
          .from("lexikon_eintraege")
          .insert({ user_id: userId, kategorie, frage: trimmed, antwort })
          .select()
          .single();
        if (saveError) console.error(saveError);
        setLexikonEintraege((prev) => [gespeichert || { ...platzhalter, antwort, _pending: false }, ...prev.filter((e) => e.id !== platzhalter.id)]);
      } catch (err) {
        console.error(err);
        setLexikonEintraege((prev) =>
          prev.map((e) => (e.id === platzhalter.id ? { ...e, antwort: "Antwort konnte gerade nicht geladen werden.", _pending: false } : e))
        );
      } finally {
        setLexikonLoading(false);
      }
    },
    [userId]
  );

  const lexikonEintragLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("lexikon_eintraege").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setLexikonEintraege((prev) => prev.filter((e) => e.id !== id));
    return { ok: true };
  }, []);

  return { lexikonEintraege, lexikonLoading, lexikonFragen, lexikonEintragLoeschen };
}
