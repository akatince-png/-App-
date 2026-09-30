import React from "react";
import SchnellIcon from "./SchnellIcon";
import { plastikFarbe } from "./plastik";
import { bereichSymbol } from "../utils/bereichSymbol";

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
  return (
    <span
      aria-hidden="true"
      data-plastik-symbol={icon || bereichSymbol(kategorie)}
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
          name={icon || bereichSymbol(kategorie)}
          size={Math.round(size * 0.52)}
          strich={size < 36 ? 2.3 : 2.1}
        />
      </span>
    </span>
  );
}
