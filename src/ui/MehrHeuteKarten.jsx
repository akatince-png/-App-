import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { getADHSMode, saveADHSMode } from "../utils/adhsStorage";
import { QuestsKarte } from "./QuestsKarte";
import RanglisteKarte from "./RanglisteKarte";
import { LinkZeile } from "./Abschnitt";
import TeamKarte from "./TeamKarte";
import { cardBorder, textMuted } from "./theme";
import { questFortschritt } from "../data/gruppenprotokoll";
import { TAGESRAETSEL_META } from "../utils/dayItems";

// Seit der schlichten Startseite (29.09., Nutzerin: „Aufteilen“) stehen
// hier unter „Mehr“: der Umschalter „Alles / Nur Basics“ sowie Quests,
// Rangliste und Team (vorher unten auf der Startseite).
export default function MehrHeuteKarten({ onOpenView }) {
  const { aenderungVermerken, isAdmin, userId, gruppenprotokolle, quests, questFortschrittSpeichern, team, teamKollegen, teamNachrichten, teamNachrichtSenden, teamNachrichtGelesen } = useAppData();
  const { proband } = useAdmin();
  const istAdminModus = proband !== null || isAdmin;
  const [nurBasics, setNurBasics] = useState(() => getADHSMode());

  const umschalten = (wert) => {
    if (wert === nurBasics) return;
    setNurBasics(wert);
    saveADHSMode(wert);
    aenderungVermerken?.({
      kategorie: "notfallmodus",
      itemName: "Notfallmodus",
      aktion: wert ? "aktiviert" : "beendet",
      detail: wert ? "Nur Basics heute — kein vollständiger Plan genutzt" : "",
    });
  };

  return (
    <>
      <div role="group" aria-label="Ansicht heute" data-ansicht-umschalter style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20, padding: "10px 12px 10px 16px", borderRadius: 18, background: "var(--mp-karte)", border: "1px solid rgba(16, 24, 40, 0.05)", boxShadow: "var(--mp-schatten)" }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>Heute zeigen</span>
          <span style={{ display: "block", fontSize: 11.5, color: textMuted }}>An schweren Tagen nur das Nötigste</span>
        </span>
        <span style={{ display: "flex", gap: 4, padding: 3, borderRadius: 99, background: "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-rand-dunkel))", flexShrink: 0 }}>
          {[
            [false, "✨ Alles"],
            [true, "🌿 Nur Basics"],
          ].map(([wert, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={nurBasics === wert}
              onClick={() => umschalten(wert)}
              style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", background: nurBasics === wert ? "var(--mp-karte)" : "transparent", boxShadow: nurBasics === wert ? "0 1px 3px rgba(16, 24, 40, 0.12)" : "none" }}
            >
              {label}
            </button>
          ))}
        </span>
      </div>

      {!istAdminModus && (
        <div data-mehr-gemeinschaft>
          {(gruppenprotokolle || [])
            .filter((gp) => !gp.abgelaufen)
            .flatMap((gp) =>
              gp.quests.map((q) => {
                const f = questFortschritt(q, gp.stand, userId);
                return (
                  <button
                    key={q.id}
                    type="button"
                    className="mp-tap"
                    onClick={() => onOpenView?.("team")}
                    style={{ width: "100%", textAlign: "left", marginBottom: 14, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: 14, background: "var(--mp-karte)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <div style={{ fontSize: 14.5, fontWeight: 800 }}>🎯 Gruppen-Quest {f.geschafft ? "🏅" : ""}</div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{q.titel}</div>
                    <div style={{ height: 8, borderRadius: 99, background: "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-karte))", marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, Math.round((f.gesamt / f.ziel) * 100))}%`, height: "100%", borderRadius: 99, background: TAGESRAETSEL_META.dot }} />
                    </div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>
                      {Math.min(f.gesamt, f.ziel)} / {f.ziel} – dein Beitrag: {f.eigen} · 👥 {gp.name}
                    </div>
                  </button>
                );
              })
            )}
          <QuestsKarte quests={quests} onFortschritt={questFortschrittSpeichern} />
          <RanglisteKarte />
          <LinkZeile icon="gruppe" farbe="#7A63B0" titel="Rangliste" sub="Personen und Teams nach Punkten" onClick={() => onOpenView?.("team")} />
          <TeamKarte team={team} teamKollegen={teamKollegen} teamNachrichten={teamNachrichten} onSenden={teamNachrichtSenden} onGelesen={teamNachrichtGelesen} onOpenTeam={() => onOpenView?.("team")} />
        </div>
      )}
    </>
  );
}
