import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToNachricht(r) {
  return { id: r.id, text: r.text, gelesen: r.gelesen, erstelltAm: r.erstellt_am };
}

// Kommunikationsweg Coachee -> Coach (13.08., Coach-verwaltetes Modell):
// ersetzt für Coachees den KI-Assistenten als Kontaktmöglichkeit (siehe
// KiChat.jsx, dort für Coachees ausgeblendet). Die Admin sieht eingehende
// Nachrichten in AdminDashboardView.jsx über eine eigene, dortige Abfrage
// (liest über mehrere Coachees hinweg, nicht über diesen Hook).
export function useCoacheeNachrichten(userId) {
  const [nachrichten, setNachrichten] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("coachee_nachrichten")
      .select("id, text, gelesen, erstellt_am")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setNachrichten((data || []).map(rowToNachricht));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const nachrichtSenden = useCallback(
    async (text) => {
      if (!text?.trim()) return { ok: false, error: "Bitte eine Nachricht eingeben." };
      const { data, error } = await supabase
        .from("coachee_nachrichten")
        .insert({ user_id: userId, text: text.trim() })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToNachricht(data);
      setNachrichten((prev) => [neu, ...prev]);
      return { ok: true, nachricht: neu };
    },
    [userId]
  );

  return { coacheeNachrichten: nachrichten, coacheeNachrichtSenden: nachrichtSenden };
}
