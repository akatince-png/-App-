import React, { useState } from "react";
import { Card, TextArea, PrimaryButton } from "./primitives";
import { accentDark, accentSoft, cardBorder, textMain, textMuted } from "./theme";
import { useAuth } from "../context/AuthContext";

// Team-Kolleg:innen + Motivationsnachrichten untereinander (siehe
// 0073_teams.sql, useTeamData.js) — Nutzerinnen-Vorgabe 16.08.: "dass man
// sich untereinander auch Motivation gibt und ... Push Nachrichten senden
// kann, wenn man sieht, dass jemand grade nicht so viel Erfolg hat".
// Nur sichtbar, wenn die Admin diese Person einem Team zugeordnet hat.
export default function TeamKarte({ team, teamKollegen, teamNachrichten, onSenden, onGelesen }) {
  const { user } = useAuth();
  const [zielId, setZielId] = useState(teamKollegen[0]?.id || null);
  const [text, setText] = useState("");
  const [senden, setSenden] = useState(false);
  const [fehler, setFehler] = useState(null);

  if (!team || teamKollegen.length === 0) return null;

  const absenden = async () => {
    if (!zielId || !text.trim()) return;
    setFehler(null);
    setSenden(true);
    const result = await onSenden(zielId, text);
    setSenden(false);
    if (!result?.ok) {
      setFehler(result?.error || "Senden fehlgeschlagen.");
      return;
    }
    setText("");
  };

  const nameFuer = (id) => teamKollegen.find((k) => k.id === id)?.vorname || "Team-Kolleg:in";

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>
        👥 {team.name} — gib deinen Team-Kolleg:innen einen Motivationsschub.
      </div>
      <Card>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {teamKollegen.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setZielId(k.id)}
              style={{
                border: `1px solid ${zielId === k.id ? accentDark : cardBorder}`,
                background: zielId === k.id ? accentSoft : "#fff",
                color: zielId === k.id ? accentDark : textMain,
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {k.vorname || "—"}
            </button>
          ))}
        </div>
        <TextArea value={text} onChange={setText} placeholder={`Nachricht an ${nameFuer(zielId)} ...`} />
        <div style={{ marginTop: 8 }}>
          <PrimaryButton onClick={absenden} disabled={senden || !text.trim()}>
            {senden ? "Wird gesendet …" : "Senden (mit Push)"}
          </PrimaryButton>
        </div>
        {fehler && <div style={{ fontSize: 12, color: "#C24545", marginTop: 8 }}>{fehler}</div>}
      </Card>

      {teamNachrichten.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {teamNachrichten.slice(0, 8).map((n) => {
            const vonMir = n.absenderId === user?.id;
            const eingehendUngelesen = !vonMir && !n.gelesen;
            return (
              <div
                key={n.id}
                onClick={() => eingehendUngelesen && onGelesen(n.id)}
                style={{
                  fontSize: 12.5,
                  padding: "8px 10px",
                  marginBottom: 6,
                  borderRadius: 10,
                  background: eingehendUngelesen ? accentSoft : "#F5F5F3",
                  color: textMain,
                  cursor: eingehendUngelesen ? "pointer" : "default",
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2, color: textMuted }}>
                  {vonMir ? `An ${nameFuer(n.empfaengerId)}` : `Von ${nameFuer(n.absenderId)}`}
                </div>
                {n.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
