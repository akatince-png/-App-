import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, Pill, Label } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { adminTeamErstellen, adminTeamLoeschen, adminTeamMitgliedZuordnen, adminTeamsListe } from "../../data/useTeamData";

// Team-Verwaltung — Nutzerinnen-Vorgabe 16.08.: "dass sich Coachees
// untereinander oder von mir in Teams zusammengesetzt werden und dann nur
// diese Teams die Dinge voneinander sehen können ... dass man sich
// untereinander auch Motivation gibt". Ein Team pro Coachee (V1, siehe
// 0073_teams.sql) — steuert sowohl die Sichtbarkeit in der Quest-Rangliste
// (RanglisteKarte.jsx) als auch, wem eine Coachee Motivationsnachrichten
// samt Push schicken kann (TeamKarte.jsx).
export default function AdminTeamsView({ onHome }) {
  const [probanden, setProbanden] = useState([]);
  const [teams, setTeams] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [neuerName, setNeuerName] = useState("");
  const [anlegen, setAnlegen] = useState(false);

  const ladeAlles = async () => {
    setLadend(true);
    setFehler(null);
    const [{ data: probandenRows, error: probandenError }, teamsResult] = await Promise.all([
      supabase.rpc("admin_liste_probanden"),
      adminTeamsListe(),
    ]);
    if (probandenError) setFehler(probandenError.message);
    else setProbanden(probandenRows || []);
    if (!teamsResult.ok) setFehler((f) => f || teamsResult.error);
    else setTeams(teamsResult.teams);
    setLadend(false);
  };

  useEffect(() => {
    ladeAlles();
  }, []);

  const teamErstellen = async () => {
    setAnlegen(true);
    const result = await adminTeamErstellen(neuerName);
    setAnlegen(false);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    setNeuerName("");
    ladeAlles();
  };

  const teamLoeschen = async (id) => {
    const result = await adminTeamLoeschen(id);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    ladeAlles();
  };

  const mitgliedZuordnen = async (userId, teamId) => {
    const result = await adminTeamMitgliedZuordnen(userId, teamId);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    setProbanden((prev) => prev.map((p) => (p.id === userId ? { ...p, team_id: teamId } : p)));
  };

  const coachees = probanden.filter((p) => !p.is_admin);

  return (
    <Shell>
      <ViewHeader title="👥 Teams" onHome={onHome} />

      <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.6 }}>
        Fasse Coachees zu Teams zusammen — Team-Mitglieder sehen sich gegenseitig in der Quest-Rangliste (statt aller
        Coachees) und können sich untereinander Motivationsnachrichten samt Push-Benachrichtigung schicken.
      </div>

      {fehler && <div style={{ fontSize: 13, color: danger, marginBottom: 14 }}>{fehler}</div>}
      {ladend && <div style={{ fontSize: 13, color: textMuted, marginBottom: 14 }}>Lädt…</div>}

      <Card style={{ marginBottom: 20 }}>
        <Label>Neues Team</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={neuerName} onChange={setNeuerName} placeholder="z. B. Team Sonnenschein" />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton onClick={teamErstellen} disabled={anlegen || !neuerName.trim()}>
              Anlegen
            </PrimaryButton>
          </div>
        </div>
      </Card>

      {teams.map((team) => {
        const mitglieder = coachees.filter((c) => c.team_id === team.id);
        return (
          <Card key={team.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: textMain, minWidth: 0 }}>{team.name}</div>
              <div style={{ width: 120, flexShrink: 0 }}>
                <PrimaryButton variant="ghost" onClick={() => teamLoeschen(team.id)}>
                  Team löschen
                </PrimaryButton>
              </div>
            </div>

            {mitglieder.length === 0 ? (
              <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 10 }}>Noch niemand in diesem Team.</div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                {mitglieder.map((m) => (
                  <div
                    key={m.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${cardBorder}`, fontSize: 13 }}
                  >
                    <span>{m.vorname || m.email}</span>
                    <button
                      type="button"
                      onClick={() => mitgliedZuordnen(m.id, null)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Label>Hinzufügen</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {coachees
                .filter((c) => c.team_id !== team.id)
                .map((c) => (
                  <Pill key={c.id} label={c.vorname || c.email} onClick={() => mitgliedZuordnen(c.id, team.id)} />
                ))}
            </div>
          </Card>
        );
      })}

      {!ladend && teams.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Teams angelegt.</div>}
    </Shell>
  );
}
