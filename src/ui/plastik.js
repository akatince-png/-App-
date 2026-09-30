import { aufhellen, hexZuRgba, verdunkeln } from "./theme";

// Plastischer Look (30.09., Nutzerin: „diese kräftige Farbe und das moderne
// Plastische gibt das Gefühl von 2026 und nicht von einem Windows-PC 1995“).
// Gleiche Machart wie die Kreise im Schnellmenü: Farbverlauf, Lichtkante
// oben links, weicher Farbschatten darunter, leichte Innenschatten.

// Farbige Fläche (Knöpfe, Symbol-Kugeln). stufe: "flach" | "mittel" | "hoch".
export function plastikFarbe(farbe, stufe = "mittel") {
  const schatten = {
    flach: `0 4px 10px -4px ${hexZuRgba(farbe, 0.5)}, inset 0 1px 0 rgba(255,255,255,.45), inset 0 -3px 6px rgba(0,0,0,.1)`,
    mittel: `0 10px 20px -8px ${hexZuRgba(farbe, 0.6)}, 0 2px 5px rgba(16,24,40,.1), inset 0 1.5px 0 rgba(255,255,255,.5), inset 0 -4px 10px rgba(0,0,0,.13)`,
    hoch: `0 18px 32px -10px ${hexZuRgba(farbe, 0.65)}, 0 4px 10px rgba(16,24,40,.14), inset 0 2px 1px rgba(255,255,255,.55), inset 0 -6px 14px rgba(0,0,0,.16)`,
  }[stufe];
  return {
    background: `radial-gradient(120% 100% at 28% 0%, rgba(255,255,255,.42) 0%, rgba(255,255,255,0) 52%), linear-gradient(160deg, ${aufhellen(farbe, 24)} 0%, ${farbe} 58%, ${verdunkeln(farbe, 10)} 100%)`,
    boxShadow: schatten,
    color: "#fff",
  };
}

// Heller Knopf (Schließen, Abspielen, Nebenknöpfe): Kartenfarbe mit
// weichem Schatten und heller Lichtkante – hebt sich leicht vom Grund ab.
export function plastikHell() {
  return {
    background:
      "linear-gradient(180deg, color-mix(in srgb, var(--mp-karte), white 18%) 0%, var(--mp-karte) 100%)",
    boxShadow:
      "0 8px 18px -8px rgba(16,24,40,.35), 0 1px 3px rgba(16,24,40,.08), inset 0 1px 0 rgba(255,255,255,.75)",
    color: "var(--mp-text)",
  };
}
