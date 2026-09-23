// "Deine Welt" (UX-Ausbau 23.09., Entwurf 3 aus dem UX-Review): jeder
// Bereich mit Punkten ist eine Pflanze, die mit den Tagen wächst, an denen
// dort etwas erledigt wurde (= Kategorie-Punkte aus errungenschaften.js).
// ADHS-Grundsatz: nichts stirbt oder welkt — ohne aktuelle Serie "wartet"
// die Pflanze nur (💤), ihre Größe bleibt.
export const PFLANZEN_STUFEN = [
  { ab: 0, symbol: "🌰", name: "Samen" },
  { ab: 1, symbol: "🌱", name: "Keimling" },
  { ab: 3, symbol: "🌿", name: "Pflänzchen" },
  { ab: 7, symbol: "🪴", name: "Pflanze" },
  { ab: 14, symbol: "🌳", name: "Baum" },
  { ab: 30, symbol: "🌸", name: "Blühender Baum" },
];

export function pflanzenStufe(punkte) {
  const p = Math.max(0, punkte || 0);
  let index = 0;
  PFLANZEN_STUFEN.forEach((s, i) => {
    if (p >= s.ab) index = i;
  });
  const naechste = PFLANZEN_STUFEN[index + 1] || null;
  return { index, ...PFLANZEN_STUFEN[index], naechste, nochTage: naechste ? naechste.ab - p : 0 };
}

// Nur Bereiche, in denen überhaupt schon etwas passiert ist, bekommen eine
// Pflanze — sortiert nach Größe, damit die "Stars" vorne stehen.
export function weltPflanzen(kategorien) {
  return (kategorien || [])
    .filter((k) => k.punkte > 0)
    .map((k) => ({ ...k, stufe: pflanzenStufe(k.punkte), wartet: k.streak === 0 }))
    .sort((a, b) => b.punkte - a.punkte);
}
