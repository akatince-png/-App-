import React, { useState } from "react";
import { getCoachName } from "../utils/coachStorage";
import { startVariante } from "../utils/startVariante";

// Feste Leiste unten (Design 2.0, 28.09., Nutzerin: „mit der Leiste, wie du
// es empfiehlst“): Heute · Plan · Aka (Mitte) · Fortschritt · Mehr – immer
// an derselben Stelle, auf jeder Seite. Aka öffnet für Coachees den Chat mit
// dem Coach, im Admin-/Verwalten-Modus den KI-Assistenten.
// Auf großen Bildschirmen übernimmt die Seitenleiste (index.css).

const ICONS = {
  heute: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
    </>
  ),
  plan: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </>
  ),
  fortschritt: <path d="M4 20V11M10 20V5M16 20v-6M21 20H3" />,
  mehr: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  aka: <path d="M4 5h16v11H9l-5 4z" />,
  schnell: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};

const Symbol = ({ name, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

// Welcher Reiter leuchtet für welche Ansicht.
export function aktiverReiter(view, planIds = []) {
  if (view === "home") return "heute";
  if (view === "tagesplan" || view === "kalender" || view === "wochenuebersicht" || planIds.includes(view)) return "plan";
  if (["erfolge", "statistik", "verlauf", "archiv", "coaching"].includes(view)) return "fortschritt";
  if (view === "mehr") return "mehr";
  if (view === "coach-chat") return "aka";
  return null;
}

// Neue Coach-Nachricht (29.09., Nutzerin: „als Sprechbläschen im Bild, nicht
// nur ein roter Punkt, den man übersieht“): Sprechblase über dem Mittelknopf
// mit dem Anfang der Nachricht, auf jeder Seite mit Leiste.
function CoachBlase({ nachricht, anzahl, onOeffnen }) {
  return (
    <button type="button" className="mp-tap mp-coach-blase" data-coach-blase onClick={onOeffnen} aria-label={`Dein Coach hat geschrieben: ${nachricht.text}`}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🧑‍🏫</span>
      <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 800 }}>Dein Coach hat geschrieben{anzahl > 1 ? ` (${anzahl})` : ""}</span>
        <span style={{ display: "block", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>„{nachricht.text}“</span>
      </span>
    </button>
  );
}

// Variante B (30.09., Vorschau): „⚡ Schnell“ in der Leiste statt
// „Fortschritt“ (der liegt dann unter Mehr) – klappt Wasser, Training,
// Workflow und Spielen auf, von jeder Seite aus erreichbar.
const SCHNELL = [
  { id: "wasser", emoji: "💧", titel: "Wasser", verlauf: "linear-gradient(145deg, #4F8DF5, #2D6FD6)" },
  { id: "training", emoji: "🏋️", titel: "Training", verlauf: "linear-gradient(145deg, #F2685A, #D9432F)" },
  { id: "workflow", emoji: "⏱️", titel: "Workflow", verlauf: "linear-gradient(145deg, #D45BA3, #A8327D)" },
  { id: "spielen", emoji: "🎮", titel: "Spielen", verlauf: "linear-gradient(145deg, #9B8CFF, #6C5CE7)" },
];

export default function BottomNav({ view, planIds, onNavigate, istAdminModus, coachNachrichten = [] }) {
  const aktiv = aktiverReiter(view, planIds);
  const mitSchnell = startVariante() === "b";
  const [schnellOffen, setSchnellOffen] = useState(false);
  const reiter = [
    { id: "heute", label: "Heute", ziel: "home" },
    { id: "plan", label: "Plan", ziel: "tagesplan" },
    { id: "aka" },
    mitSchnell ? { id: "schnell", label: "Schnell" } : { id: "fortschritt", label: "Fortschritt", ziel: "erfolge" },
    { id: "mehr", label: "Mehr", ziel: "mehr" },
  ];
  const schnellWahl = (id) => {
    setSchnellOffen(false);
    if (id === "wasser") return onNavigate("hydration");
    onNavigate("home");
    setTimeout(() => window.dispatchEvent(new CustomEvent("mp-schnell", { detail: id })), 120);
  };
  const akaName = getCoachName();
  return (
    <>
    {!istAdminModus && coachNachrichten.length > 0 && view !== "coach-chat" && (
      <CoachBlase nachricht={coachNachrichten[0]} anzahl={coachNachrichten.length} onOeffnen={() => onNavigate("coach-chat")} />
    )}
    {schnellOffen && (
      <>
        <div aria-hidden="true" onClick={() => setSchnellOffen(false)} style={{ position: "fixed", inset: 0, zIndex: 58, background: "rgba(16, 24, 40, 0.25)" }} />
        <div data-schnell-menue role="menu" aria-label="Schnellzugriff" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(96px + env(safe-area-inset-bottom))", zIndex: 59, width: "min(92vw, 420px)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 10, borderRadius: 24, background: "var(--mp-karte)", boxShadow: "0 12px 32px rgba(16, 24, 40, 0.22)" }}>
          {SCHNELL.map((k) => (
            <button key={k.id} type="button" role="menuitem" className="mp-tap" onClick={() => schnellWahl(k.id)} style={{ border: "none", borderRadius: 18, padding: "12px 4px 10px", background: k.verlauf, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 24 }}>{k.emoji}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{k.titel}</span>
            </button>
          ))}
        </div>
      </>
    )}
    <nav className="mp-bottomnav" aria-label="Hauptnavigation" data-bottomnav>
      {reiter.map((r) =>
        r.id === "aka" ? (
          <button
            key="aka"
            type="button"
            className="mp-tap mp-bottomnav-mitte"
            aria-label={istAdminModus ? `${akaName} fragen` : "Chat mit deinem Coach"}
            onClick={() => (istAdminModus ? window.dispatchEvent(new Event("aka-oeffnen")) : onNavigate("coach-chat"))}
          >
            <Symbol name="aka" size={24} />
          </button>
        ) : (
          <button
            key={r.id}
            type="button"
            className={`mp-tap mp-bottomnav-reiter${aktiv === r.id ? " an" : ""}`}
            aria-current={aktiv === r.id ? "page" : undefined}
            aria-expanded={r.id === "schnell" ? schnellOffen : undefined}
            onClick={() => (r.id === "schnell" ? setSchnellOffen((o) => !o) : onNavigate(r.ziel))}
          >
            <Symbol name={r.id} />
            <span>{r.label}</span>
          </button>
        )
      )}
    </nav>
    </>
  );
}
