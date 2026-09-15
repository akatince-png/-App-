import React from "react";

// Zentrales, cleanes Linien-Icon-Set — ersetzt die bisher app-weit
// verwendeten Emoji (😴💧🥗🏋️🌿💊🧬🗓️📂🗂️⚙️🌱 ...), die im Vergleich zur
// Referenz-Grafik des Nutzers zu verspielt/"Lifestyle" wirken. Ein Name
// pro Icon, gerendert via <Icon name="moon" />, damit Konsumenten (Tabs,
// BottomNav, Ordner-Kacheln) nur einen String statt eines Emoji-Zeichens
// durchreichen müssen.
const PATHS = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  moon: <path d="M12 3c.13 0 .26 0 .39.01A7.5 7.5 0 0 0 21 12.39 9 9 0 1 1 12.39 3.01 9 9 0 0 0 12 3Z" />,
  droplet: <path d="M12 2.5s7 8.2 7 12.7a7 7 0 1 1-14 0c0-4.5 7-12.7 7-12.7Z" />,
  utensils: (
    <>
      <path d="M8 2v7.5a2 2 0 0 1-4 0V2M6 2v20M6 9.5V2" />
      <path d="M17 2c0 3-2 4.5-2 8s2 3 2 3v9" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />
    </>
  ),
  capsule: (
    <>
      <rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5l7 7" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  dna: (
    <>
      <path d="M7 3c0 4 10 4 10 8s-10 4-10 8" />
      <path d="M17 3c0 4-10 4-10 8s10 4 10 8" />
    </>
  ),
  calendarWeek: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
    </>
  ),
  calendarCheck: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      <path d="M8.5 14.5l2 2 4.5-4.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.6" />
      <rect x="13" y="3" width="8" height="8" rx="1.6" />
      <rect x="3" y="13" width="8" height="8" rx="1.6" />
      <rect x="13" y="13" width="8" height="8" rx="1.6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10M17 6h3M4 12h13M20 12h0M4 18h10M17 18h3" />
      <circle cx="14" cy="6" r="2" fill="#fff" />
      <circle cx="16" cy="12" r="2" fill="#fff" />
      <circle cx="13" cy="18" r="2" fill="#fff" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  // Aufgehende Sonne für die Morgenroutine (13.09., Nutzerin-Vorgabe): "nur
  // ein Spiegelstrich unten... man nur eine halbe Sonne sieht" — damit sie
  // sich neben dem vollen "sun"-Icon (Tageslicht) unterscheiden lässt, statt
  // beide dieselbe Form zu teilen. Nachbesserung (13.09.): "die man erkennt
  // nicht so wirklich, dass das eine Sonne ist" — 4 statt 2 Strahlen,
  // durchgängig ALLE mit Lücke zum Halbkreis (vorher war die Lücke
  // inkonsistent), symmetrisch um die Mittelachse verteilt.
  sunrise: (
    <>
      <path d="M6.5 17a5.5 5.5 0 0 1 11 0" />
      <path d="M9 8.5l-2-3M15 8.5l2-3M5.5 12l-3.5-1.5M18.5 12l3.5-1.5" />
      <path d="M2 20.5h20" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1.2" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </>
  ),
  // Für Tagebuch (13.09.) — aufgeschlagenes Buch, zwei Seiten mit Knick in
  // der Mitte.
  book: (
    <>
      <path d="M12 6.5c-1.8-1.3-4-2-6.5-2A2.5 2.5 0 0 0 3 7v10a2 2 0 0 1 2-2c2.2 0 4.3.6 6 1.8M12 6.5c1.8-1.3 4-2 6.5-2A2.5 2.5 0 0 1 21 7v10a2 2 0 0 0-2-2c-2.2 0-4.3.6-6 1.8M12 6.5v11" />
    </>
  ),
  // Für Atemübungen (16.08.) — drei geschwungene Linien statt Lunge/Emoji,
  // passend zum restlichen Linien-Icon-Set.
  wind: (
    <>
      <path d="M9.5 4.5A2 2 0 1 1 11 8H2" />
      <path d="M12.5 20.5A2 2 0 1 0 14 17H2" />
      <path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2" />
    </>
  ),
  // Für Erfolge/Abzeichen (11.09.) — Punkte-/Streak-System.
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 1-3 2.5-4 1.5 1 2.5 2 2.5 4" />
    </>
  ),
  flame: (
    <path d="M12 2.5s5 4.5 5 9.5a5 5 0 0 1-10 0c0-1.3.6-2.3 1.3-3.2.3 1 1.1 1.7 1.9 1.4C9 8.5 8.5 6 12 2.5Z" />
  ),
  // Für Bildschirmzeit (15.09.) — Telefon-Umriss mit Home-Strich unten,
  // passend zum restlichen Linien-Icon-Set.
  smartphone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.3h3" />
    </>
  ),
};

export default function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      {content}
    </svg>
  );
}
