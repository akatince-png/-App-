import React from "react";
import SchnellIcon from "./SchnellIcon";
import { plastikFarbe } from "./plastik";
import { bereichSymbol } from "../utils/bereichSymbol";
import trinken3d from "../assets/symbole3d/trinken.jpg";
import medikament3d from "../assets/symbole3d/medikament.jpg";
import einnahme3d from "../assets/symbole3d/einnahme.jpg";
import mahlzeit3d from "../assets/symbole3d/mahlzeit.jpg";
import snack3d from "../assets/symbole3d/snack.jpg";

// 3D-Symbole aus Canva (03.10., Nutzerin: „benutz Canva, mach es plastischer,
// cooler – Design auf dem Maximum“). Bisher fünf Stück (danach war das
// Canva-Guthaben aufgebraucht); alle anderen Bereiche zeigen weiter die
// plastische Kugel mit Linien-Symbol. Die Bilder sind abgerundete Kacheln auf
// weißem Grund – der Rahmen schneidet den weißen Rand weg.
const BILD_3D = {
  trinken: trinken3d,
  medikament: medikament3d,
  einnahme: einnahme3d,
  mahlzeit: mahlzeit3d,
  snack: snack3d,
};

// Bereichs-Symbol als plastische Kugel (30.09.): kräftige Bereichsfarbe,
// weißes Linien-Symbol – im Tagesplan, auf der Startseite, im Kalender.
export default function PlastikSymbol({
  kategorie,
  icon,
  farbe,
  size = 44,
  eckig = false,
  stufe = "mittel",
}) {
  const name = icon || bereichSymbol(kategorie);
  const bild = BILD_3D[name];
  if (bild)
    return (
      <span
        aria-hidden="true"
        data-plastik-symbol={name}
        data-symbol-3d
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          overflow: "hidden",
          display: "inline-flex",
          flexShrink: 0,
          position: "relative",
          boxShadow: `0 ${Math.round(size * 0.16)}px ${Math.round(size * 0.3)}px -${Math.round(size * 0.12)}px rgba(16,24,40,.35)`,
        }}
      >
        <img
          src={bild}
          alt=""
          width={size}
          height={size}
          draggable={false}
          style={{
            position: "absolute",
            width: size * 1.3,
            height: size * 1.3,
            left: -size * 0.15,
            top: -size * 0.13,
            maxWidth: "none",
          }}
        />
      </span>
    );
  return (
    <span
      aria-hidden="true"
      data-plastik-symbol={name}
      style={{
        width: size,
        height: size,
        borderRadius: eckig ? Math.round(size * 0.32) : 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...plastikFarbe(farbe, stufe),
      }}
    >
      <span
        style={{
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,.22))",
          display: "inline-flex",
        }}
      >
        <SchnellIcon
          name={name}
          size={Math.round(size * 0.52)}
          strich={size < 36 ? 2.3 : 2.1}
        />
      </span>
    </span>
  );
}
