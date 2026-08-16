import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowZuNachricht(r) {
  return { id: r.id, absenderId: r.absender_id, empfaengerId: r.empfaenger_id, text: r.text, gelesen: r.gelesen, erstelltAm: r.erstellt_am };
}

// Team-Zugehörigkeit + Team-Kolleg:innen + Motivations-Nachrichten
// untereinander (siehe 0073_teams.sql) — Nutzerinnen-Vorgabe 16.08.: "dass
// man sich untereinander auch Motivation gibt ... Push Nachrichten senden
// kann, wenn man sieht, dass jemand grade nicht so viel Erfolg hat".
// Team-Verwaltung (anlegen/Mitglieder zuordnen) läuft NICHT über diesen
// Hook, sondern über die admin*-Funktionen unten (analog useQuestData.js).
export function useTeamData(userId) {
  const [team, setTeam] = useState(null); // { id, name } | null
  const [teamKollegen, setTeamKollegen] = useState([]); // [{id, vorname}]
  const [teamNachrichten, setTeamNachrichten] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: profil } = await supabase.from("profiles").select("team_id").eq("id", userId).maybeSingle();
    const teamId = profil?.team_id || null;
    if (!teamId) {
      setTeam(null);
      setTeamKollegen([]);
      setTeamNachrichten([]);
      return;
    }
    const [{ data: teamRow }, { data: kollegenRows }, { data: nachrichtenRows }] = await Promise.all([
      supabase.from("teams").select("id, name").eq("id", teamId).maybeSingle(),
      supabase.from("profiles").select("id, vorname").eq("team_id", teamId).neq("id", userId),
      supabase
        .from("team_nachrichten")
        .select("*")
        .or(`absender_id.eq.${userId},empfaenger_id.eq.${userId}`)
        .order("erstellt_am", { ascending: false }),
    ]);
    setTeam(teamRow || null);
    setTeamKollegen(kollegenRows || []);
    setTeamNachrichten((nachrichtenRows || []).map(rowZuNachricht));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Speichert die Nachricht UND löst darüber die Push-Zustellung an die
  // Team-Kollegin aus (eigene Edge Function, prüft serverseitig nochmal
  // gleiches_team() — die RLS-Policy beim Insert reicht für die Tabelle,
  // aber Push-Versand braucht Service-Role-Zugriff auf push_subscriptions
  // der Zielperson, siehe supabase/functions/send-team-push).
  const teamNachrichtSenden = useCallback(
    async (empfaengerId, text) => {
      if (!text?.trim()) return { ok: false, error: "Bitte eine Nachricht eingeben." };
      const { data, error } = await supabase
        .from("team_nachrichten")
        .insert({ absender_id: userId, empfaenger_id: empfaengerId, text: text.trim() })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowZuNachricht(data);
      setTeamNachrichten((prev) => [neu, ...prev]);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error: pushError } = await supabase.functions.invoke("send-team-push", {
          body: { empfaengerId, text: text.trim() },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (pushError) console.error(pushError);
      }

      return { ok: true, nachricht: neu };
    },
    [userId]
  );

  const teamNachrichtGelesen = useCallback(async (id) => {
    setTeamNachrichten((prev) => prev.map((n) => (n.id === id ? { ...n, gelesen: true } : n)));
    const { error } = await supabase.from("team_nachrichten").update({ gelesen: true }).eq("id", id);
    if (error) console.error(error);
  }, []);

  return { team, teamKollegen, teamNachrichten, teamNachrichtSenden, teamNachrichtGelesen };
}

// --- Admin-seitig: Teams anlegen/umbenennen/löschen, Mitglieder zuordnen —
// bewusst eigenständige Funktionen statt Teil des Hooks oben (analog
// adminQuest*-Funktionen in useQuestData.js). Genutzt in AdminTeamsView.jsx. ---

export async function adminTeamsListe() {
  const { data, error } = await supabase.from("teams").select("*").order("erstellt_am");
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, teams: data || [] };
}

export async function adminTeamErstellen(name) {
  if (!name?.trim()) return { ok: false, error: "Bitte einen Namen eingeben." };
  const { data, error } = await supabase.from("teams").insert({ name: name.trim() }).select().single();
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, team: data };
}

export async function adminTeamLoeschen(id) {
  // profiles.team_id verweist mit "on delete set null" — Mitglieder werden
  // beim Löschen automatisch team-los, nicht mitgelöscht.
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function adminTeamMitgliedZuordnen(userId, teamId) {
  const { error } = await supabase.from("profiles").update({ team_id: teamId }).eq("id", userId);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
