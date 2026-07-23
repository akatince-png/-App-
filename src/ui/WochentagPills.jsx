import React from "react";
import { Pill } from "./primitives";
import { WOCHENTAGE } from "../constants";

// Wiederverwendbare Wochentag-Auswahl (Mo–So als Pills) — v1 für den
// Ernährungsplan (mehrfach auswählbar, welche Tage eine Mahlzeit ansteht),
// grundsätzlich auch für andere Wochenplan-artige Stellen geeignet.
export default function WochentagPills({ selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {WOCHENTAGE.map((tag) => (
        <Pill key={tag} label={tag} selected={selected.includes(tag)} onClick={() => onToggle(tag)} />
      ))}
    </div>
  );
}
