import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLexikon() {
  const [lexikonVerlauf, setLexikonVerlauf] = useState([]);
  const [lexikonLoading, setLexikonLoading] = useState(false);

  const lexikonFragen = useCallback(async (frage, kategorie) => {
    const trimmed = frage.trim();
    if (!trimmed) return;
    setLexikonLoading(true);
    setLexikonVerlauf((prev) => [...prev, { frage: trimmed, kategorie, antwort: null }]);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("lexikon", {
        body: { frage: trimmed, kategorie },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      setLexikonVerlauf((prev) => {
        const next = [...prev];
        next[next.length - 1] = { frage: trimmed, kategorie, antwort: data.antwort || "Keine Antwort erhalten." };
        return next;
      });
    } catch (err) {
      console.error(err);
      setLexikonVerlauf((prev) => {
        const next = [...prev];
        next[next.length - 1] = { frage: trimmed, kategorie, antwort: "Antwort konnte gerade nicht geladen werden." };
        return next;
      });
    } finally {
      setLexikonLoading(false);
    }
  }, []);

  return { lexikonVerlauf, lexikonLoading, lexikonFragen };
}
