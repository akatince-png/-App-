// Schichtarbeit (25.09., Nutzerinnen-Freigabe der Vorschau): je Schichtart
// eine "Zeit-Variante" mit eigenen Startzeiten für Morgen- und
// Abendroutine, dazu ein Schichtplan (je Tag eine Variante). Tage ohne
// Eintrag nutzen die normale Zeit (routine_einstellungen). Alles hier ist
// reine Rechenlogik ohne Datenbank — genutzt von useRoutinen (eigene Daten)
// und der Coach-Übersicht (alle Personen).

export const VORLAGEN = [
  { name: "Frühschicht", icon: "🌅", arbeitVon: "06:00", arbeitBis: "14:00", morgenStart: "04:30", abendStart: "21:00" },
  { name: "Spätschicht", icon: "🌆", arbeitVon: "14:00", arbeitBis: "22:00", morgenStart: "09:30", abendStart: "23:45" },
  { name: "Frei", icon: "🌿", arbeitVon: "", arbeitBis: "", morgenStart: "08:00", abendStart: "22:30" },
];
export const NACHT_VORLAGE = { name: "Nachtschicht", icon: "🌙", arbeitVon: "22:00", arbeitBis: "06:00", morgenStart: "14:00", abendStart: "07:00" };

export const RHYTHMEN = [
  { id: "wochenweise", label: "Wochenweise Früh ↔ Spät" },
  { id: "2-2-2", label: "2 Früh · 2 Spät · 2 Frei" },
  { id: "fsnx", label: "Früh · Spät · Nacht · Frei" },
  { id: "eigen", label: "Eigenes Muster" },
];

export function isoTag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ausIso(iso) {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t);
}
export function plusTage(iso, n) {
  const d = ausIso(iso);
  d.setDate(d.getDate() + n);
  return isoTag(d);
}
function zeit(t) {
  return t ? String(t).slice(0, 5) : "";
}
function min(hhmm) {
  const t = String(hhmm || "").match(/^(\d{1,2}):(\d{2})/);
  return t ? Number(t[1]) * 60 + Number(t[2]) : null;
}
function alsZeit(m) {
  const x = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
}

export function zeileZuVariante(r) {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon || "🕐",
    arbeitVon: zeit(r.arbeit_von),
    arbeitBis: zeit(r.arbeit_bis),
    morgenStart: zeit(r.morgen_start),
    abendStart: zeit(r.abend_start),
    reihenfolge: r.reihenfolge ?? 0,
  };
}
export function zeileZuPlantag(r) {
  return { datum: r.datum, varianteId: r.variante_id || null, art: r.art || "variante", morgenStart: zeit(r.morgen_start), abendStart: zeit(r.abend_start) };
}

// Was gilt an `datum`? ctx = { plan: {datum: plantag}, varianten: [], standard: {morgen:{startZeit,endZeit}, abend:{…}} }
export function planFuer(datum, ctx) {
  const tag = ctx?.plan?.[datum];
  const std = ctx?.standard || {};
  const basis = { datum, variante: null, morgen: std.morgen?.startZeit || "", abend: std.abend?.startZeit || "" };
  if (!tag) return { ...basis, art: "standard", key: "standard", label: "Normal" };
  if (tag.art === "krank") return { ...basis, art: "krank", key: "krank", label: "Krank", icon: "🤒", morgen: "", abend: "" };
  if (tag.art === "eigen") return { ...basis, art: "eigen", key: "eigen", label: "Eigene Zeit", icon: "🕐", morgen: tag.morgenStart || basis.morgen, abend: tag.abendStart || basis.abend };
  const v = (ctx.varianten || []).find((x) => x.id === tag.varianteId);
  if (!v) return { ...basis, art: "standard", key: "standard", label: "Normal" };
  return { ...basis, art: "variante", key: v.id, label: v.name, icon: v.icon, variante: v, morgen: v.morgenStart || basis.morgen, abend: v.abendStart || basis.abend };
}

// Einstellungen im Format von routineEinstellungen für `datum`. Das Ende
// des Zeitrahmens wandert um dieselbe Spanne mit wie der Start.
export function einstellungenFuer(datum, ctx) {
  const p = planFuer(datum, ctx);
  const aus = (routine, start) => {
    const std = ctx?.standard?.[routine] || {};
    let endZeit = std.endZeit || "";
    if (endZeit && std.startZeit && start && start !== std.startZeit) endZeit = alsZeit(min(endZeit) + min(start) - min(std.startZeit));
    if (!start) endZeit = "";
    return { routine, startZeit: start, endZeit };
  };
  return { morgen: aus("morgen", p.morgen), abend: aus("abend", p.abend) };
}

// Schritte, die an `datum` gelten: ohne Varianten-Bindung immer, sonst nur
// bei passender Variante; "ab Datum"-Schritte erst ab diesem Tag.
export function schritteFuer(datum, schritte, varianteId) {
  return (schritte || []).filter((s) => {
    if (s.gueltigAb && datum < s.gueltigAb) return false;
    if (s.nurVarianten && s.nurVarianten.length) return !!varianteId && s.nurVarianten.includes(varianteId);
    return true;
  });
}

// Rollen (Früh/Spät/Nacht/Frei) aus den Varianten-Namen.
export function rollenZuordnung(varianten) {
  const finde = (re) => (varianten || []).find((v) => re.test(v.name))?.id || null;
  return { F: finde(/fr[üu]h/i), S: finde(/sp[äa]t/i), N: finde(/nacht/i), X: finde(/frei/i) };
}

// Plan erzeugen: [{datum, varianteId|null}] für `wochen` Wochen ab `start`.
// "wochenweise" beginnt am Montag der Startwoche (Mo–Fr Schicht, Sa/So frei).
export function planErzeugen({ rhythmus, start, wochen, rollen, eigenesMuster = [] }) {
  const r = rollen || {};
  let beginn = start;
  let zyklus;
  if (rhythmus === "wochenweise") {
    const wt = (ausIso(start).getDay() + 6) % 7;
    beginn = plusTage(start, -wt);
    const woche = (a) => [a, a, a, a, a, r.X, r.X];
    zyklus = [...woche(r.F), ...woche(r.S)];
  } else if (rhythmus === "2-2-2") zyklus = [r.F, r.F, r.S, r.S, r.X, r.X];
  else if (rhythmus === "fsnx") zyklus = [r.F, r.F, r.S, r.S, r.N, r.N, r.X, r.X];
  else zyklus = eigenesMuster.length ? eigenesMuster : [null];
  const tage = [];
  for (let i = 0; i < wochen * 7; i++) tage.push({ datum: plusTage(beginn, i), varianteId: zyklus[i % zyklus.length] || null });
  return tage;
}

// Montag der Woche von `iso` (für die Kalender-Vorschau).
export function wochenBeginn(iso) {
  const wt = (ausIso(iso).getDay() + 6) % 7;
  return plusTage(iso, -wt);
}

// Pünktlichkeit je Schicht (Coach-Seite): über die letzten `tage` Tage,
// gemessen am Start des Durchlaufs gegen die Zeit des jeweiligen Tages.
export function puenktlichkeitJeVariante(durchlaeufe, routine, ctx, heute = new Date(), tage = 28, pufferMin = 10) {
  const erg = new Map();
  const heuteIso = isoTag(heute);
  for (const d of durchlaeufe || []) {
    if (d.routine !== routine || d.datum > heuteIso || d.datum < plusTage(heuteIso, -(tage - 1))) continue;
    const p = planFuer(d.datum, ctx);
    const start = routine === "morgen" ? p.morgen : p.abend;
    if (!start || p.art === "krank") continue;
    const zp = new Date(d.gestartetUm || d.abgeschlossenUm);
    const diff = zp.getHours() * 60 + zp.getMinutes() - min(start);
    const e = erg.get(p.key) || { key: p.key, label: p.label, icon: p.icon || "🕐", puenktlich: 0, gesamt: 0 };
    e.gesamt++;
    if (diff <= pufferMin) e.puenktlich++;
    erg.set(p.key, e);
  }
  return [...erg.values()];
}

// Kurztext für einen Plantag, z. B. im Kalender oder beim Coach.
export function kurzLabel(p) {
  if (p.art === "krank") return "krank";
  if (p.art === "eigen") return "eigen";
  if (p.art === "standard") return "–";
  return p.label.replace(/schicht$/i, "").slice(0, 5);
}
