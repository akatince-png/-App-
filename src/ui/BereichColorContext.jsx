import React, { createContext, useContext, useMemo } from "react";
import { accent, accentDark, accentSoft } from "./theme";
import { KATEGORIE_META } from "../utils/dayItems";

const BereichColorContext = createContext(null);

const STANDARD = { accent, accentDark, accentSoft };

// Liefert die Akzentfarben (accent/accentDark/accentSoft) automatisch aus
// KATEGORIE_META, wenn ein `bereich`-Schlüssel bekannt ist — sonst fällt es
// auf die generische Marken-Akzentfarbe zurück. Wird von <Shell bereich="…">
// gesetzt (siehe primitives.jsx) und von PrimaryButton/Pill/CheckRow/Stepper
// automatisch gelesen, damit jeder Lebensbereich (Training, Hydration, …)
// seine eigene Farbe in allen Standard-Bedienelementen bekommt, ohne jeden
// einzelnen Button-Aufruf manuell einfärben zu müssen.
export function BereichColorProvider({ bereich, children }) {
  const value = useMemo(() => {
    const meta = bereich && KATEGORIE_META[bereich];
    return meta ? { accent: meta.dot, accentDark: meta.text, accentSoft: meta.bg } : STANDARD;
  }, [bereich]);
  return <BereichColorContext.Provider value={value}>{children}</BereichColorContext.Provider>;
}

export function useBereichColor() {
  return useContext(BereichColorContext) || STANDARD;
}
