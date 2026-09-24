import React from "react";
import { Card } from "./primitives";
import { accentDark, accentSoft, cardBorder, textMain, textMuted } from "./theme";
import { questRanglisteLaden } from "../data/useQuestData";
import { useAuth } from "../context/AuthContext";
import { useCachedQuery } from "../lib/useCachedQuery";
import Profilbild from "./Profilbild";

const MEDAILLEN = ["🥇", "🥈", "🥉"];

// Rangliste der Quest-Abschlüsse über alle Coachees hinweg — Nutzerinnen-
// Vorgabe 16.08.: "die Leute sollen halt meine Coachees gegeneinander
// antreten können ... bei den Quest[s]" (Konkurrenz), gleichzeitig sichtbar
// für alle statt nur die Admin, damit man sich als Gruppe sieht statt nur
// isoliert die eigene Zahl (Gemeinschafts-Aspekt). Lädt eigenständig über
// die security-definer-Funktion quest_rangliste() (0072), unabhängig vom
// useQuestData()-Hook, der nur eigene Quests kennt.
//
// Wettbewerb optional (App-Bauplan-Punkt, ADHS-Perspektive): Vergleich mit
// anderen motiviert manche, wirkt bei anderen demotivierend oder beschämend
// (Rejection Sensitive Dysphoria). `quest_rangliste()` (0085) lässt daher
// Coachees mit `rangliste_sichtbar = false` in den Daten selbst schon weg.
// Seit 24.09. (Nutzerinnen-Entscheidung) dürfen alle die Rangliste ansehen,
// auch wer selbst nicht teilt — daher keine eigene Sichtbarkeitsprüfung mehr.
//
// Zentrale Datenschicht mit Caching (App-Bauplan-Punkt, siehe
// lib/queryCache.js): AuthenticatedApp.jsx mountet den aktiven Bildschirm
// bei jedem `view`-Wechsel komplett neu — ohne Caching würde ein Home →
// Mehr → zurück zu Home dieselbe Rangliste jedes Mal erneut komplett neu
// abfragen, obwohl sich in wenigen Sekunden kaum etwas ändert. Über
// useCachedQuery() statt eines eigenen useEffect+useState-Paars: derselbe
// Cache-Key "quest-rangliste" wird sowohl hier als auch in
// AdminQuestsView.jsx verwendet, beide teilen sich dieselben Daten.
export default function RanglisteKarte() {
  const { user } = useAuth();
  const { data: rangliste, error: fehler } = useCachedQuery(
    "quest-rangliste",
    async () => {
      const result = await questRanglisteLaden();
      if (!result.ok) throw new Error(result.error);
      return result.rangliste.filter((r) => r.questsAngenommen > 0 || r.questsErledigt > 0);
    },
    { ttlMs: 30000 }
  );

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
                  <Profilbild pfad={r.profilbildPfad} name={r.vorname} size={28} />
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
