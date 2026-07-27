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

  // Wie lexikonFragen(), aber ohne den geteilten lexikonVerlauf zu
  // verändern und mit direktem Rückgabewert statt State-Update — für
  // punktuelle Erklärungen an anderer Stelle in der App (z. B. "ℹ️" neben
  // einem einzelnen Laborwert), die nicht im allgemeinen Lexikon-Verlauf
  // auftauchen sollen.
  const lexikonSchnellFragen = useCallback(async (frage, kategorie) => {
    const trimmed = frage.trim();
    if (!trimmed) return "";
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("lexikon", {
      body: { frage: trimmed, kategorie },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || data?.error) throw new Error(data?.error || error.message);
    return data.antwort || "Keine Antwort erhalten.";
  }, []);

  return { lexikonVerlauf, lexikonLoading, lexikonFragen, lexikonSchnellFragen };
}
