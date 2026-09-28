import React from "react";
import { getCoachName } from "../utils/coachStorage";

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

export default function BottomNav({ view, planIds, onNavigate, istAdminModus }) {
  const aktiv = aktiverReiter(view, planIds);
  const reiter = [
    { id: "heute", label: "Heute", ziel: "home" },
    { id: "plan", label: "Plan", ziel: "tagesplan" },
    { id: "aka" },
    { id: "fortschritt", label: "Fortschritt", ziel: "erfolge" },
    { id: "mehr", label: "Mehr", ziel: "mehr" },
  ];
  const akaName = getCoachName();
  return (
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
            onClick={() => onNavigate(r.ziel)}
          >
            <Symbol name={r.id} />
            <span>{r.label}</span>
          </button>
        )
      )}
    </nav>
  );
}
