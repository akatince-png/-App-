import React from "react";
import { accent, accentDark, accentSoft, blue, blueSoft, success, successSoft } from "./theme";

// Drei ruhige, eigenständige Illustrationen für die Willkommens-Folien
// (WelcomeView.jsx) — bewusst als schlichte Strich-/Flächen-Grafik statt
// Emoji oder dem Marken-Ring-Logo (Nutzerinnen-Vorgabe, 29.07.: "keine
// Rakete, kein Kreissymbol", stattdessen Illustrationen, die mentale
// Entlastung/Übersicht/Ruhe transportieren, im Stil von Apple/Headspace/
// Notion — minimalistisch, nicht verspielt). Jede Grafik ist in ein
// eigenes weiches Kreis-Badge eingebettet, alle im selben 132×132-Raster,
// damit sie sich beim Folienwechsel nicht sichtbar verschieben.

// Folie 1: ein Kopf, aus dem ein paar Gedanken sanft "abgegeben" werden,
// statt drinnen zu kreisen — die zentrale Botschaft "du musst es nicht
// mehr selbst im Kopf behalten" als Bild.
export function KopfEntlastungIllustration({ size = 132 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="66" cy="66" r="60" fill={accentSoft} />
      <circle cx="58" cy="52" r="24" stroke={accentDark} strokeWidth="3.5" />
      <path d="M32 96 Q58 76 84 94" stroke={accentDark} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="48" r="2.4" fill={accentDark} opacity="0.55" />
      <circle cx="64" cy="55" r="2.4" fill={accentDark} opacity="0.55" />
      <circle cx="56" cy="60" r="2.4" fill={accentDark} opacity="0.55" />
      <path d="M78 40 Q92 32 100 20" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6" fill="none" opacity="0.6" />
      <circle cx="100" cy="20" r="3.2" fill={blue} opacity="0.65" />
      <circle cx="111" cy="12" r="2.4" fill={blue} opacity="0.42" />
      <circle cx="120" cy="8" r="1.6" fill={blue} opacity="0.24" />
    </svg>
  );
}

// Folie 2: ein ruhiges, gleichmäßiges Raster statt Notizzettel-Chaos —
// mehrere Bereiche, aber an einem Ort und sichtbar geordnet.
export function UebersichtIllustration({ size = 132 }) {
  const felder = [
    { x: 34, y: 34, fill: accentSoft, stroke: accentDark },
    { x: 68, y: 34, fill: blueSoft, stroke: blue },
    { x: 34, y: 68, fill: successSoft, stroke: success },
    { x: 68, y: 68, fill: accentSoft, stroke: accent },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="66" cy="66" r="60" fill={blueSoft} opacity="0.55" />
      {felder.map((f, i) => (
        <g key={i}>
          <rect x={f.x} y={f.y} width="30" height="30" rx="9" fill={f.fill} stroke={f.stroke} strokeWidth="2" />
          <line x1={f.x + 8} y1={f.y + 12} x2={f.x + 22} y2={f.y + 12} stroke={f.stroke} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1={f.x + 8} y1={f.y + 19} x2={f.x + 18} y2={f.y + 19} stroke={f.stroke} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

// Folie 3: kein Raketenstart, sondern ein ruhiges "erledigt"-Zeichen —
// Sicherheit und Leichtigkeit statt Tempo/Produktivität.
export function RuheIllustration({ size = 132 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="66" cy="66" r="60" fill={successSoft} />
      <circle cx="30" cy="42" r="2.6" fill={success} opacity="0.3" />
      <circle cx="103" cy="46" r="2.2" fill={success} opacity="0.25" />
      <circle cx="40" cy="100" r="2" fill={success} opacity="0.22" />
      <circle cx="66" cy="66" r="28" fill="#fff" stroke={success} strokeWidth="3.5" />
      <path d="M55 67 L63 75 L79 57" stroke={success} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
