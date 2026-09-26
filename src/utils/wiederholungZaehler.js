// Wiederholungen per Kamera zählen (26.09., Nutzerinnen-Wunsch: Schummeln
// bei Wettbewerben erschweren). Die Körperpunkte kommen von MediaPipe Pose
// (33 Punkte, x/y normiert, visibility 0–1); gezählt wird über einen
// Gelenkwinkel mit Hysterese: erst "unten" (Winkel klein), dann wieder
// "oben" (Winkel groß) = 1 Wiederholung. Das Bild verlässt das Gerät nie.
// MediaPipe-Indizes: Schulter 11/12, Ellbogen 13/14, Handgelenk 15/16,
// Hüfte 23/24, Knie 25/26, Knöchel 27/28.
export const KAMERA_UEBUNGEN = {
  kniebeuge: { label: "Kniebeugen", punkte: [[23, 25, 27], [24, 26, 28]], unten: 105, oben: 155, hinweis: "Seitlich zur Kamera stellen, ganzer Körper im Bild." },
  liegestuetz: { label: "Liegestütze", punkte: [[11, 13, 15], [12, 14, 16]], unten: 100, oben: 150, hinweis: "Handy seitlich auf den Boden, Oberkörper und Arme im Bild." },
  swing: { label: "Kettlebell-Swings", punkte: [[11, 23, 25], [12, 24, 26]], unten: 125, oben: 160, hinweis: "Seitlich zur Kamera, Hüfte und Schultern im Bild." },
};

export function kameraUebungFuer(name = "") {
  const n = name.toLowerCase();
  if (/kniebeuge|squat/.test(n)) return "kniebeuge";
  if (/liegestütz|liegestuetz|push.?up/.test(n)) return "liegestuetz";
  if (/swing|kettlebell/.test(n)) return "swing";
  return null;
}

export function winkel(a, b, c) {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  let w = Math.abs(((ab - cb) * 180) / Math.PI);
  if (w > 180) w = 360 - w;
  return w;
}

// Winkel der besser sichtbaren Körperseite, oder null, wenn beide schlecht sichtbar.
export function gelenkWinkel(landmarks, uebung, minSicht = 0.5) {
  const u = KAMERA_UEBUNGEN[uebung];
  if (!u || !landmarks?.length) return null;
  let bester = null;
  for (const [i, j, k] of u.punkte) {
    const p = [landmarks[i], landmarks[j], landmarks[k]];
    if (p.some((x) => !x)) continue;
    const sicht = Math.min(...p.map((x) => x.visibility ?? 1));
    if (sicht < minSicht) continue;
    if (!bester || sicht > bester.sicht) bester = { sicht, w: winkel(p[0], p[1], p[2]) };
  }
  return bester ? bester.w : null;
}

// Zustandsmaschine: { phase: "oben"|"unten", anzahl, letzteMs }.
export function neuerZaehler() {
  return { phase: "oben", anzahl: 0, letzteMs: -Infinity, tiefster: 180 };
}

export function zaehlerSchritt(z, w, uebung, jetztMs, minAbstandMs = 350) {
  const u = KAMERA_UEBUNGEN[uebung];
  if (w == null || !u) return z;
  if (z.phase === "oben" && w < u.unten) return { ...z, phase: "unten", tiefster: w };
  if (z.phase === "unten") {
    if (w > u.oben && jetztMs - z.letzteMs >= minAbstandMs) return { ...z, phase: "oben", anzahl: z.anzahl + 1, letzteMs: jetztMs, tiefster: 180 };
    return { ...z, tiefster: Math.min(z.tiefster, w) };
  }
  return z;
}
