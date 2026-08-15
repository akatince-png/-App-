import React from "react";
import Icon from "./Icon";
import { accentDark, accentSoft, cardBorder, textMain, textMuted } from "./theme";
import { PLAENE_TABS } from "../constants";

const PLAENE_VIEW_IDS_OHNE_TRAINING = PLAENE_TABS.map((t) => t.id).filter((id) => id !== "training");
const ARCHIV_VIEW_IDS = ["verlauf", "archiv", "statistik", "profil", "blutzucker", "community"];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home", istAktiv: (view) => view === "home" },
  { id: "tagesplan", label: "Tagesplan", icon: "calendarCheck", istAktiv: (view) => view === "tagesplan" },
  { id: "schlaf", label: "Pläne", icon: "folder", istAktiv: (view) => PLAENE_VIEW_IDS_OHNE_TRAINING.includes(view) },
  { id: "training", label: "Training", icon: "dumbbell", istAktiv: (view) => view === "training" },
  { id: "routinen", label: "Routinen", icon: "target", istAktiv: (view) => view === "routinen" },
  { id: "archiv", label: "Archiv", icon: "archive", istAktiv: (view) => ARCHIV_VIEW_IDS.includes(view) },
  { id: "mehr", label: "Mehr", icon: "sliders", istAktiv: (view) => view === "mehr" || view === "lexikon" },
];

function navButtonStyle(aktiv) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "none",
    background: aktiv ? accentSoft : "transparent",
    color: aktiv ? accentDark : textMuted,
    fontWeight: aktiv ? 800 : 600,
    fontSize: 14,
    borderRadius: 12,
    padding: "11px 12px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  };
}

// Persistente Seitenleiste für Tablet/Desktop (>=1024px, siehe .mp-app-sidebar
// in index.css) — auf dem Handy bleibt die App unverändert bei der bisherigen
// "ein Screen nach dem anderen"-Navigation über die Home-Ordner-Kacheln
// (Nutzerinnen-Vorgabe 15.08.: "breiter, übersichtlicher" auf dem Tablet, da
// mehr Fläche vorhanden ist — ohne dass sich am Handy etwas ändert). Bildet
// dieselben `view`-Werte aus AuthenticatedApp.jsx ab, ruft also exakt
// dieselbe Navigation auf wie die Home-Ordner/Mini-Widgets — kein
// Parallel-Navigationssystem, nur ein zweiter, permanent sichtbarer Zugang
// zu denselben Zielen.
export default function AppSidebar({ view, onNavigate, isAdmin }) {
  const adminAktiv = view.startsWith("admin");
  return (
    <nav className="mp-app-sidebar" aria-label="Hauptnavigation">
      <div style={{ padding: "22px 14px 10px", fontSize: 17, fontWeight: 800, color: textMain }}>Aka</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 10px" }}>
        {NAV_ITEMS.map((item) => {
          const aktiv = item.istAktiv(view);
          return (
            <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className="mp-tap" style={navButtonStyle(aktiv)}>
              <Icon name={item.icon} size={19} color={aktiv ? accentDark : textMuted} />
              {item.label}
            </button>
          );
        })}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onNavigate("admin")}
            className="mp-tap"
            style={{ ...navButtonStyle(adminAktiv), marginTop: 10, borderTop: `1px solid ${cardBorder}`, borderRadius: 0, paddingTop: 18 }}
          >
            <Icon name="sliders" size={19} color={adminAktiv ? accentDark : textMuted} />
            Admin
          </button>
        )}
      </div>
    </nav>
  );
}
