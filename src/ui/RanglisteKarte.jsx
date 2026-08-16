import React, { useEffect, useState } from "react";
import { Card } from "./primitives";
import { accentDark, accentSoft, cardBorder, textMain, textMuted } from "./theme";
import { questRanglisteLaden } from "../data/useQuestData";
import { useAuth } from "../context/AuthContext";

const MEDAILLEN = ["🥇", "🥈", "🥉"];

// Rangliste der Quest-Abschlüsse über alle Coachees hinweg — Nutzerinnen-
// Vorgabe 16.08.: "die Leute sollen halt meine Coachees gegeneinander
// antreten können ... bei den Quest[s]" (Konkurrenz), gleichzeitig sichtbar
// für alle statt nur die Admin, damit man sich als Gruppe sieht statt nur
// isoliert die eigene Zahl (Gemeinschafts-Aspekt). Lädt eigenständig über
// die security-definer-Funktion quest_rangliste() (0072), unabhängig vom
// useQuestData()-Hook, der nur eigene Quests kennt.
export default function RanglisteKarte() {
  const { user } = useAuth();
  const [rangliste, setRangliste] = useState(null);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    let cancelled = false;
    questRanglisteLaden().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setFehler(result.error);
        return;
      }
      setRangliste(result.rangliste.filter((r) => r.questsAngenommen > 0 || r.questsErledigt > 0));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (fehler || (rangliste && rangliste.length === 0)) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>🏆 Quest-Rangliste — wer hat wie viele Quests abgeschlossen.</div>
      <Card>
        {!rangliste ? (
          <div style={{ fontSize: 12.5, color: textMuted }}>Lädt…</div>
        ) : (
          rangliste.map((r, i) => {
            const istIch = r.userId === user?.id;
            return (
              <div
                key={r.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 0",
                  borderTop: i > 0 ? `1px solid ${cardBorder}` : "none",
                  background: istIch ? accentSoft : "transparent",
                  borderRadius: istIch ? 10 : 0,
                  paddingLeft: istIch ? 8 : 0,
                  paddingRight: istIch ? 8 : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{MEDAILLEN[i] || i + 1}</span>
                  <span style={{ fontSize: 13.5, fontWeight: istIch ? 800 : 700, color: istIch ? accentDark : textMain }}>
                    {r.vorname || "—"}
                    {istIch ? " (du)" : ""}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: istIch ? accentDark : textMain, flexShrink: 0 }}>
                  {r.questsErledigt} abgeschlossen
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
