import React from "react";
import { Card } from "./primitives";
import Icon from "./Icon";
import Profilbild from "./Profilbild";
import { accent, cardBorder, textMain, textMuted } from "./theme";
import { levelAusPunkten, levelFortschritt } from "../utils/level";
import { alleBadges, badgeLabel } from "../utils/errungenschaften";
import { usePersonSpielstand } from "../data/usePersonSpielstand";

// Steckbrief im Stil einer Lernplattform-Profilseite (Nutzerinnen-Wunsch
// 24.10., Vorlage Screenshot): oben Bild und Name, darunter „Erfolge“
// (Punkte · Abzeichen · Level), „Fortschritt“ als Balken und „Abzeichen“
// als runde Plaketten. Gleicher Aufbau für den Coachee selbst (Profil) und
// für den Coach (Coach-Übersicht, Person aufgeklappt).

const BADGE_INFO = new Map(alleBadges().map((b) => [b.key, b]));

function Abschnitt({ titel, children }) {
  return (
    <div style={{ borderTop: `1px solid ${cardBorder}`, padding: "14px 0 4px" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: textMain, marginBottom: 12 }}>{titel}</div>
      {children}
    </div>
  );
}

function Kennzahl({ icon, farbe, wert, label }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto", background: `color-mix(in srgb, ${farbe} 14%, var(--mp-karte))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={24} color={farbe} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: textMain }}>{wert}</div>
      <div style={{ fontSize: 12, color: textMuted }}>{label}</div>
    </div>
  );
}

function Balken({ label, anteil, text }) {
  const prozent = Math.round(Math.max(0, Math.min(1, anteil || 0)) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: textMuted, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 800, color: textMain }}>{text ?? `${prozent} %`}</span>
      </div>
      <div style={{ height: 12, borderRadius: 99, background: "color-mix(in srgb, #E8ECF4 var(--mp-flaeche), var(--mp-rand-dunkel))", overflow: "hidden" }}>
        <div style={{ width: `${prozent}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #5FC3B0, #4E8FD8)", transition: "width .4s" }} />
      </div>
    </div>
  );
}

function Plakette({ badgeKey }) {
  const info = BADGE_INFO.get(badgeKey);
  const grad = info?.grad || ["#E0A21B", "#C9871A"];
  const label = badgeLabel(badgeKey);
  return (
    <div title={label} style={{ width: 96, textAlign: "center", flexShrink: 0 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto", background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,0.12)" }}>
        <Icon name={info?.icon || "trophy"} size={24} color="#fff" />
        {info?.schwelle && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{info.schwelle}</span>}
      </div>
      <div style={{ fontSize: 11, color: textMain, marginTop: 6, lineHeight: 1.25 }}>{label}</div>
    </div>
  );
}

export default function Steckbrief({ personId, name, untertitel, profilbildPfad, fortschritte = [], kinder = null }) {
  const { stand, abzeichen, ladend } = usePersonSpielstand(personId);
  const punkte = stand?.punkte_gesamt ?? 0;
  const lvl = levelAusPunkten(punkte);
  const alleFortschritte = [
    { label: `Level ${lvl.level} → ${lvl.level + 1}`, anteil: levelFortschritt(lvl), text: `${punkte} / ${lvl.ziel} P.` },
    { label: "Aktive Tage (letzte 7)", anteil: (stand?.aktive_tage_7 ?? 0) / 7, text: `${stand?.aktive_tage_7 ?? 0} von 7` },
    ...fortschritte,
  ];

  return (
    <Card style={{ marginBottom: 14 }}>
      <div data-steckbrief style={{ textAlign: "center", paddingBottom: 12 }}>
        <div style={{ display: "inline-block" }}>
          <Profilbild pfad={profilbildPfad} name={name} size={88} rand />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8, color: textMain }}>{name}</div>
        {untertitel && <div style={{ fontSize: 13, color: "var(--mp-accent-dark-text)", marginTop: 2 }}>{untertitel}</div>}
        {stand?.serie > 0 && (
          <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>
            🔥 {stand.serie} {stand.serie === 1 ? "Tag" : "Tage"} am Stück
          </div>
        )}
      </div>

      <Abschnitt titel="Erfolge">
        <div style={{ display: "flex", gap: 8, paddingBottom: 6 }}>
          <Kennzahl icon="grid" farbe={accent} wert={ladend ? "…" : punkte} label="Punkte" />
          <Kennzahl icon="trophy" farbe="#E0A21B" wert={ladend ? "…" : stand?.abzeichen ?? abzeichen.length} label="Abzeichen" />
          <Kennzahl icon="target" farbe="#4E8FD8" wert={ladend ? "…" : lvl.level} label="Level" />
        </div>
      </Abschnitt>

      <Abschnitt titel="Fortschritt">
        {alleFortschritte.map((f) => (
          <Balken key={f.label} {...f} />
        ))}
      </Abschnitt>

      <Abschnitt titel="Abzeichen">
        {abzeichen.length === 0 ? (
          <div style={{ fontSize: 13, color: textMuted, paddingBottom: 8 }}>Noch keine Abzeichen – das erste gibt es für 7 Tage am Stück.</div>
        ) : (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {abzeichen.map((a) => (
              <Plakette key={a.badge_key} badgeKey={a.badge_key} />
            ))}
          </div>
        )}
      </Abschnitt>

      {kinder}
    </Card>
  );
}
