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
  // Bereiche im Tagesplan (30.09., Nutzerin: „im Tagesplan die coolen Logos
  // in jedem Bereich“) – gleicher Stil wie oben.
  medikament: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  mahlzeit: (
    <>
      <path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M9 9c0-1.5 1-2 1-3.5M13 9c0-1.5 1-2 1-3.5" />
    </>
  ),
  gewohnheit: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.2 2.6 2.6 5-5.3" />
    </>
  ),
  sonne: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  sonnenaufgang: (
    <>
      <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
      {/* Fünf Strahlen, weiter aufgefächert (06.10., Nutzerin). */}
      <path d="M12 10V7.5M16.5 11.6l1.6-1.9M7.5 11.6 5.9 9.7M18.9 15.8l2.5-.4M5.1 15.8l-2.5-.4M3 20.5h18" />
    </>
  ),
  mond: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  atem: (
    <>
      <path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 16.5h6" />
    </>
  ),
  handy: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
      <path d="M10.5 18h3" />
    </>
  ),
  uhr: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  gruppe: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M18 13.8a6 6 0 0 1 3 5.2" />
    </>
  ),
  kalender: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
      <circle cx="8.5" cy="14.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  puzzle: (
    <>
      <path d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H5v-4a2 2 0 1 0 0-4z" />
    </>
  ),
  tagebuch: (
    <>
      <path d="M6 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z" />
      <path d="M6 3.5v17M10 8h5M10 11.5h5" />
    </>
  ),
  notiz: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  kamera: (
    <>
      <path d="M4 8.5a2 2 0 0 1 2-2h1.8l1.4-2h5.6l1.4 2H18a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  haken: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  liste: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.5" cy="6.5" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="17.5" r="1.1" fill="currentColor" />
    </>
  ),
  zahnrad: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  ziel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  diagramm: <path d="M4 20V11M10 20V5M16 20v-6M21 20H3" />,
  raster: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2.2" />
    </>
  ),
  kompass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  tropfen: <path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3z" />,
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
