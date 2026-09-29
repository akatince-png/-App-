import React from "react";
import { useProfilbildUrl } from "../data/profilbild";
import { accentDark, accentSoft } from "./theme";

// Rundes Profilbild — ohne Foto der Anfangsbuchstabe auf farbigem Kreis.
export default function Profilbild({ pfad, name, size = 36, rand = false }) {
  const url = useProfilbildUrl(pfad);
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const basis = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    border: rand ? "2px solid color-mix(in srgb, #fff var(--mp-flaeche), var(--mp-rand-dunkel))" : "none",
    boxShadow: rand ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
  };
  if (url) return <img src={url} alt={name ? `Profilbild von ${name}` : "Profilbild"} style={{ ...basis, objectFit: "cover", display: "block" }} />;
  return (
    <div aria-hidden="true" style={{ ...basis, background: accentSoft, color: "var(--mp-accent-dark-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: Math.round(size * 0.42) }}>
      {initial}
    </div>
  );
}
