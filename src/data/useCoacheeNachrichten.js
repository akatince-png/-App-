import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToNachricht(r) {
  return { id: r.id, text: r.text, gelesen: r.gelesen, erstelltAm: r.erstellt_am, absender: r.absender || "coachee" };
}

// Kommunikationsweg Coachee <-> Coach (13.08., erweitert 15.08. um die
// Coach->Coachee-Richtung): ersetzt für Coachees den KI-Assistenten als
// Kontaktmöglichkeit (siehe KiChat.jsx, dort für Coachees ausgeblendet).
// Beide Richtungen liegen in derselben Tabelle (absender-Spalte), damit auf
// der Startseite ein echter Verlauf statt zweier getrennter Listen
// entsteht. Die Admin sieht/sendet Nachrichten für mehrere Coachees über
// eine eigene, dortige Abfrage (AdminDashboardView.jsx/
// AdminCoachUebersichtView.jsx, nicht über diesen Hook — der ist an eine
// einzelne userId gebunden).
export function useCoacheeNachrichten(userId) {
  const [nachrichten, setNachrichten] = useState([]);

  // Neu laden (24.09.): die Startseite frischt beim Öffnen auf, damit der
  // Hinweis "Dein Coach hat geschrieben" nach dem Lesen im Chat verschwindet.
  const laden = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("coachee_nachrichten")
      .select("id, text, gelesen, erstellt_am, absender")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: false });
    if (!error) setNachrichten((data || []).map(rowToNachricht));
  }, [userId]);

  useEffect(() => {
    laden();
  }, [laden]);

  const nachrichtSenden = useCallback(
    async (text) => {
      if (!text?.trim()) return { ok: false, error: "Bitte eine Nachricht eingeben." };
      const { data, error } = await supabase
        .from("coachee_nachrichten")
        .insert({ user_id: userId, text: text.trim(), absender: "coachee" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToNachricht(data);
      setNachrichten((prev) => [neu, ...prev]);
      // Push an den Coach (24.09., Coach-Chat) — z. B. aus dem Akut-Fenster.
      supabase.functions
        .invoke("send-team-push", { body: { art: "an-coach", text: text.trim() } })
        .then(({ error: pushFehler }) => pushFehler && console.warn("Push nicht verschickt:", pushFehler.message));
      return { ok: true, nachricht: neu };
    },
    [userId]
  );

  return { coacheeNachrichten: nachrichten, coacheeNachrichtSenden: nachrichtSenden, coacheeNachrichtenNeuLaden: laden };
}

// Eigenständige Funktion statt Teil des Hooks oben: die Admin schreibt für
// eine BELIEBIGE Coachee-ID, nicht für die eigene userId (Hooks sind an
// eine feste ID gebunden) — genutzt in AdminDashboardView.jsx und der
// Coach-Übersicht, jeweils für mehrere Coachees gleichzeitig.
export async function coachNachrichtSenden(coacheeUserId, text) {
  if (!text?.trim()) return { ok: false, error: "Bitte eine Nachricht eingeben." };
  const { data, error } = await supabase
    .from("coachee_nachrichten")
    .insert({ user_id: coacheeUserId, text: text.trim(), absender: "coach" })
    .select()
    .single();
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  // Push an die Person (24.09., Coach-Chat) — auch bei Nachrichten aus der
  // Team-Ansicht oder den Quests.
  supabase.functions
    .invoke("send-team-push", { body: { art: "coach", empfaengerId: coacheeUserId, text: text.trim() } })
    .then(({ error: pushFehler }) => pushFehler && console.warn("Push nicht verschickt:", pushFehler.message));
  return { ok: true, nachricht: rowToNachricht(data) };
}
