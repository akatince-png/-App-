// Alle Knöpfe plastisch (30.09., Nutzerin: „bitte alle Buttons in der App
// plastischer gestalten“). Viele Knöpfe haben ihre Farbe direkt im Code;
// statt jeden einzeln umzubauen, schaut die App nach, welche Farbe ein Knopf
// tatsächlich hat, und gibt ihm eine Klasse:
//   mp-plastik-farbig – kräftige Farbe → Glanz oben links + Farbschatten
//   mp-plastik-hell   – helle Fläche   → weicher Schatten
// Durchsichtige Knöpfe (Textlinks, Symbole) bleiben unverändert. Knöpfe mit
// eigenem Verlauf (schon plastisch) oder data-plastik="nein" auch.

export function parseFarbe(css) {
  const m =
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(
      css || "",
    );
  if (!m) return null;
  let a =
    m[4] == null
      ? 1
      : m[4].endsWith("%")
        ? parseFloat(m[4]) / 100
        : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}

// "farbig" | "hell" | null
export function plastikArt({ hintergrund, bild = "none" }) {
  if (bild && bild !== "none") return null; // eigener Verlauf → schon gestaltet
  const f = parseFarbe(hintergrund);
  if (!f || f.a < 0.5) return null;
  const max = Math.max(f.r, f.g, f.b);
  const min = Math.min(f.r, f.g, f.b);
  const helligkeit = (0.299 * f.r + 0.587 * f.g + 0.114 * f.b) / 255;
  if (max - min > 45 && helligkeit < 0.85) return "farbig";
  if (helligkeit > 0.8) return "hell";
  return null;
}

const KLASSEN = ["mp-plastik-farbig", "mp-plastik-hell"];

function pruefen(knopf) {
  if (!(knopf instanceof HTMLElement) || knopf.dataset.plastik === "nein")
    return;
  if (
    knopf.closest(
      ".mp-segment, .mp-bottomnav, .mp-tagesleiste, [data-plastik='nein']",
    )
  )
    return;
  const cs = getComputedStyle(knopf);
  const art = knopf.disabled
    ? null
    : plastikArt({ hintergrund: cs.backgroundColor, bild: cs.backgroundImage });
  const soll = art ? `mp-plastik-${art}` : null;
  for (const k of KLASSEN)
    if (k !== soll && knopf.classList.contains(k)) knopf.classList.remove(k);
  if (soll && !knopf.classList.contains(soll)) knopf.classList.add(soll);
  if (art === "farbig") {
    const f = parseFarbe(cs.backgroundColor);
    knopf.style.setProperty("--pl-rgb", `${f.r} ${f.g} ${f.b}`);
  }
}

export function plastikAutoStarten(
  wurzel = typeof document !== "undefined" ? document.body : null,
) {
  if (!wurzel || typeof MutationObserver === "undefined") return () => {};
  const offen = new Set();
  let geplant = false;
  const abarbeiten = () => {
    geplant = false;
    for (const k of offen) pruefen(k);
    offen.clear();
  };
  const merken = (el) => {
    if (el instanceof HTMLButtonElement) offen.add(el);
    else if (el instanceof HTMLElement)
      el.querySelectorAll?.("button").forEach((b) => offen.add(b));
    if (!geplant) {
      geplant = true;
      requestAnimationFrame(abarbeiten);
    }
  };
  merken(wurzel);
  const beobachter = new MutationObserver((liste) => {
    for (const m of liste) {
      if (m.type === "childList") m.addedNodes.forEach(merken);
      else if (m.target instanceof HTMLButtonElement) merken(m.target);
    }
  });
  beobachter.observe(wurzel, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "disabled", "aria-pressed"],
  });
  // Tag/Nacht-Wechsel ändert Farben über Variablen, ohne Knöpfe anzufassen.
  const themaBeobachter = new MutationObserver(() => merken(wurzel));
  themaBeobachter.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tagesphase", "data-dunkel", "data-theme", "style"],
  });
  return () => {
    beobachter.disconnect();
    themaBeobachter.disconnect();
  };
}
