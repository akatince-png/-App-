import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Liest die offenen "Kontext"-Hinweise, die ein Admin für diese Person
// hinterlassen hat (siehe 0036_admin_notizen.sql) — fließen in KiChat.jsx
// in den Background-Brain-Kontext ein, damit der Assistent sie von sich aus
// natürlich einbaut, ohne dass die Person je ein separates
// "Admin-Postfach" sieht. Die "Nachricht"-Notizen (direkt zugestellt)
// laufen NICHT hier durch, sondern über useCoachVerlauf.js beim Öffnen
// eines Chats.
export function useAdminNotizen(userId) {
  const [adminNotizenKontext, setAdminNotizenKontext] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("admin_notizen")
      .select("bereich, text")
      .eq("user_id", userId)
      .eq("modus", "kontext")
      .eq("status", "offen")
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setAdminNotizenKontext(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { adminNotizenKontext };
}
