import React from "react";

// Moderne Linien-Symbole für das Kreis-Schnellmenü und die Startseite
// (30.09., Nutzerin: „die Icons sind altbacken, bitte moderner, passend zum
// jetzigen App-Niveau“) – gleiche Strichstärke und runde Enden wie die
// Symbole der unteren Leiste, statt Emojis.
const PFADE = {
  trinken: (
    <>
      <path d="M6 3h12l-1.6 16.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8z" />
      <path d="M6.6 9c2.3 1.2 4.3-1.2 6.6 0s3.6.4 4.2 0" />
    </>
  ),
  snack: (
    <>
      <path d="M12 7c-1.5-1.3-4-1.8-5.8-.6C3.8 8 4.3 12.6 6 16c1.2 2.5 3 4.6 4.6 4 .6-.2 1-.5 1.4-.5s.8.3 1.4.5c1.6.6 3.4-1.5 4.6-4 1.7-3.4 2.2-8-.2-9.6-1.8-1.2-4.3-.7-5.8.6z" />
      <path d="M12 7c0-2 1-3.6 2.8-4.2" />
    </>
  ),
  nickerchen: (
    <>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      <path d="M15 3h4l-4 4h4" />
    </>
  ),
  training: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </>
  ),
  einnahme: (
    <>
      <rect
        x="3.5"
        y="8.5"
        width="17"
        height="7"
        rx="3.5"
        transform="rotate(-45 12 12)"
      />
      <path d="m9.5 9.5 5 5" />
    </>
  ),
  workflow: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V10M10 2.5h4M12 2.5V6M18.5 6.5l1.2-1.2" />
    </>
  ),
  spielen: (
    <>
      <path d="M7 7h10a4.5 4.5 0 0 1 4.3 5.8l-1.1 3.7a2.6 2.6 0 0 1-4.5.9L14 15.5h-4l-1.7 1.9a2.6 2.6 0 0 1-4.5-.9l-1.1-3.7A4.5 4.5 0 0 1 7 7z" />
      <path d="M8 10v3M6.5 11.5h3" />
      <circle cx="15.5" cy="10.5" r=".6" fill="currentColor" />
      <circle cx="17" cy="12.5" r=".6" fill="currentColor" />
    </>
  ),
  akut: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
    </>
  ),
};

export default function SchnellIcon({ name, size = 26, strich = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strich}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {PFADE[name]}
    </svg>
  );
}
