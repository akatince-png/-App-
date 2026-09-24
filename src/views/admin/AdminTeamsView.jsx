import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Pill, Label } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { adminTeamErstellen, adminTeamLoeschen, adminTeamMitgliedZuordnen, adminTeamsListe } from "../../data/useTeamData";
import Profilbild from "../../ui/Profilbild";
import GruppenprotokollAdmin from "../../ui/GruppenprotokollAdmin";
import { teamMitgliederLaden, tageRuhig, zeitraumGrenzen } from "../../data/teamStatistik";
import { coachNachrichtSenden } from "../../data/useCoacheeNachrichten";

// Coach-Ansicht (24.09., Nutzerinnen-Freigabe der Vorschau): je Team ein
// Balkendiagramm der Wochenpunkte pro Person (mit Profilbild) und Hinweise,
// wer seit 2+ Tagen nichts abgehakt hat — mit "Nachricht schreiben" direkt
// an die Person (landet wie gewohnt in ihren Coach-Nachrichten).
const BALKEN_FARBEN = ["#F08A24", "#3B4BA8", "#8436C2", "#1FA39A", "#E0352B", "#2D6FD6", "#B7791F"];

function TeamWoche({ mitglieder }) {
  const [schreibeAn, setSchreibeAn] = useState(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState({});
  if (!mitglieder || mitglieder.length === 0) return null;
  const max = Math.max(1, ...mitglieder.map((m) => m.punkteZeitraum || 0));
  const schnitt = Math.round((mitglieder.reduce((s, m) => s + (m.punkteZeitraum || 0), 0) / mitglieder.length) * 10) / 10;
  const stille = mitglieder.filter((m) => {
    const r = tageRuhig(m.letzteAktivitaet);
    return r === null || r >= 2;
  });
  const senden = async (m) => {
    setStatus((s) => ({ ...s, [m.userId]: "sendet" }));
    const r = await coachNachrichtSenden(m.userId, text);
    setStatus((s) => ({ ...s, [m.userId]: r.ok ? "ok" : r.error || "Fehler" }));
    if (r.ok) {
      setSchreibeAn(null);
      setText("");
    }
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 6 }}>Diese Woche · Ø {schnitt} Punkte pro Person</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 96 }}>
        {mitglieder.map((m, i) => (
          <div key={m.userId} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: textMuted }}>{m.punkteZeitraum || 0}</div>
            <div style={{ width: "100%", height: Math.max(4, Math.round(((m.punkteZeitraum || 0) / max) * 64)), background: BALKEN_FARBEN[i % BALKEN_FARBEN.length], borderRadius: "8px 8px 0 0" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {mitglieder.map((m) => (
          <div key={m.userId} style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }} title={m.vorname}>
            <Profilbild pfad={m.profilbildPfad} name={m.vorname} size={26} />
          </div>
        ))}
      </div>
      {stille.length === 0 ? (
        <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>Alle aktiv ✓</div>
      ) : (
        stille.map((m) => {
          const r = tageRuhig(m.letzteAktivitaet);
          return (
            <div key={m.userId} style={{ background: "#FFF4E5", color: "#8A4B08", borderRadius: 12, padding: "8px 10px", fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>
              ⚠️ {m.vorname || "—"}: {r === null ? "noch nichts abgehakt" : `seit ${r} Tagen nichts abgehakt`} ·{" "}
              {status[m.userId] === "ok" ? (
                <span>Nachricht gesendet 💛</span>
              ) : (
                <button type="button" onClick={() => setSchreibeAn(schreibeAn === m.userId ? null : m.userId)} style={{ border: "none", background: "transparent", color: "#8A4B08", textDecoration: "underline", fontWeight: 800, cursor: "pointer", padding: 0, fontSize: 12.5, fontFamily: "inherit" }}>
                  Nachricht schreiben
                </button>
              )}
              {schreibeAn === m.userId && (
                <div style={{ marginTop: 8 }}>
                  <TextArea value={text} onChange={setText} placeholder={`Nachricht an ${m.vorname || "die Person"} …`} />
                  <div style={{ marginTop: 6 }}>
                    <PrimaryButton onClick={() => senden(m)} disabled={!text.trim() || status[m.userId] === "sendet"}>
                      {status[m.userId] === "sendet" ? "Wird gesendet …" : "Senden"}
                    </PrimaryButton>
                  </div>
                  {status[m.userId] && !["ok", "sendet"].includes(status[m.userId]) && <div style={{ color: danger, marginTop: 4 }}>{status[m.userId]}</div>}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// Team-Verwaltung — Nutzerinnen-Vorgabe 16.08.: "dass sich Coachees
// untereinander oder von mir in Teams zusammengesetzt werden und dann nur
// diese Teams die Dinge voneinander sehen können ... dass man sich
// untereinander auch Motivation gibt". Ein Team pro Coachee (V1, siehe
// 0073_teams.sql) — steuert sowohl die Sichtbarkeit in der Quest-Rangliste
// (RanglisteKarte.jsx) als auch, wem eine Coachee Motivationsnachrichten
// samt Push schicken kann (TeamKarte.jsx).
export default function AdminTeamsView({ onHome, onOpenLiga }) {
  const [probanden, setProbanden] = useState([]);
  const [teams, setTeams] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [neuerName, setNeuerName] = useState("");
  const [anlegen, setAnlegen] = useState(false);
  const [wochenStatistik, setWochenStatistik] = useState([]);

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
    const { von, bis } = zeitraumGrenzen("woche");
    const statistik = await teamMitgliederLaden(von, bis);
    if (statistik.ok) setWochenStatistik(statistik.mitglieder);
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

      {onOpenLiga && (
        <button
          type="button"
          className="mp-tap"
          onClick={onOpenLiga}
          style={{ width: "100%", marginBottom: 16, border: `1.5px solid ${cardBorder}`, borderRadius: 14, padding: "12px 14px", background: "#fff", fontSize: 14, fontWeight: 800, color: textMain, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          🏆 Team-Liga ansehen ›
        </button>
      )}
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

            <TeamWoche mitglieder={wochenStatistik.filter((m) => m.teamId === team.id)} />

            {mitglieder.length === 0 ? (
              <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 10 }}>Noch niemand in diesem Team.</div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                {mitglieder.map((m) => (
                  <div
                    key={m.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${cardBorder}`, fontSize: 13 }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Profilbild pfad={m.profilbild_pfad} name={m.vorname || m.email} size={28} />
                      {m.vorname || m.email}
                    </span>
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
            <GruppenprotokollAdmin teamId={team.id} />
          </Card>
        );
      })}

      {!ladend && teams.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Teams angelegt.</div>}
    </Shell>
  );
}
