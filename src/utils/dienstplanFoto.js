import { plusTage } from "./schichtplan";

// Dienstplan abfotografieren (28.09., Nutzerin: „wöchentlich den Dienstplan
// abfotografieren, die Zeiten werden übernommen – ohne das Gemini-Kontingent
// zu belasten“). Die Texterkennung läuft auf dem Gerät (tesseract.js), hier
// nur reine Logik: erkannten Text der markierten Zeile in Dienste je Tag
// zerlegen und jedem Dienst eine passende Zeit-Variante zuordnen.

export const NOTIZ_MARKER = "Aus Dienstplan-Foto";

const pad = (n) => String(n).padStart(2, "0");
const minuten = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const alsZeit = (m) => {
  const x = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};
const uhr = (h, m) => (Number(h) <= 24 && Number(m || 0) < 60 ? `${pad(Number(h) % 24)}:${pad(Number(m || 0))}` : null);

// Geteilte Dienste / Doppelschichten (Nutzerin 28.09.: „11–14 und 17–21 Uhr“,
// Pflege mit unbezahlter Pause): Ein Arbeitstag hat 1–3 Einsätze
// (`bloecke`). `von`/`bis` des Tages = Beginn des ersten und Ende des
// letzten Einsatzes – danach richten sich die Routine-Zeiten.
export const MAX_EINSAETZE = 3;
export function bloeckeVon(tag) {
  return tag?.bloecke?.length ? tag.bloecke : [{ von: tag?.von || "", bis: tag?.bis || "" }];
}
export function mitBloecken(tag, bloecke) {
  const b = (bloecke || []).slice(0, MAX_EINSAETZE);
  return { ...tag, bloecke: b, von: b[0]?.von || "", bis: b.at(-1)?.bis || "" };
}
// Pause zwischen zwei Einsätzen in Minuten (null, wenn Zeiten fehlen).
export function pauseMin(a, b) {
  const e = minuten(a?.bis);
  const s = minuten(b?.von);
  if (e == null || s == null) return null;
  return (s - e + 1440) % 1440;
}

// Kürzel, wie sie auf Dienstplänen üblich sind. Groß-/Kleinschreibung egal.
const KUERZEL = [
  { re: /^(f|fd|fr[üu]h|fr[üu]hdienst|fr[üu]hschicht)$/i, art: "rolle", rolle: "F" },
  { re: /^(s|sd|sp[äa]t|sp[äa]tdienst|sp[äa]tschicht)$/i, art: "rolle", rolle: "S" },
  { re: /^(n|nd|nacht|nachtdienst|nachtschicht)$/i, art: "rolle", rolle: "N" },
  { re: /^(x|-|–|\/|frei|ruhe|rt|ft|az)$/i, art: "frei" },
  { re: /^(u|url|urlaub)$/i, art: "urlaub" },
  { re: /^(k|kr|krank|au)$/i, art: "krank" },
];

function normalisiert(text) {
  return String(text || "")
    .replace(/[–—−]/g, "-")
    .replace(/(\d)\s*[.,;]\s*(\d{2})(?!\d)/g, "$1:$2")
    .replace(/\buhr\b/gi, " ")
    .replace(/\bbis\b/gi, "-");
}

// Zerlegt den erkannten Text in Dienste in Lese-Reihenfolge.
// Ergebnis je Dienst: { art: "arbeit", von, bis } | { art: "rolle", rolle } | { art: "frei"|"urlaub"|"krank" }
export function diensteAusText(text) {
  const t = normalisiert(text);
  const erg = [];
  const zeitRe = /(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/y;
  let i = 0;
  while (i < t.length) {
    zeitRe.lastIndex = i;
    const z = zeitRe.exec(t);
    // Zeitspanne nur, wenn sie nicht mitten in einer Zahl (z. B. Datum 28.09-...) beginnt
    if (z && !/\d/.test(t[i - 1] || "")) {
      const von = uhr(z[1], z[2]);
      const bis = uhr(z[3], z[4]);
      const mitMinuten = z[2] != null || z[4] != null;
      if (von && bis && von !== bis && (mitMinuten || (Number(z[1]) <= 24 && Number(z[3]) <= 24))) {
        erg.push({ art: "arbeit", von, bis });
        i = zeitRe.lastIndex;
        continue;
      }
    }
    const wort = t.slice(i).match(/^[^\s|]+/);
    if (!wort) {
      i++;
      continue;
    }
    const w = wort[0].replace(/^[([{"'„]+|[)\]}"'“:,;]+$/g, "");
    // Doppelt gelesene Einzelbuchstaben („FF“ bei unscharfem „F“) zusammenfassen.
    const einzeln = w.match(/^([a-z])\1+$/i);
    const k = KUERZEL.find((x) => x.re.test(einzeln ? einzeln[1] : w));
    if (k) erg.push(k.art === "rolle" ? { art: "rolle", rolle: k.rolle } : { art: k.art });
    i += wort[0].length;
  }
  return erg;
}

// Ist der gelesene Zellen-Text eindeutig genau ein Dienst? Ein Strich
// („-“, „/“) zählt nur als „frei“, wenn sonst nichts in der Zelle steht –
// sonst könnte ein Linien-Rest als freier Tag durchgehen.
export function zelleEindeutig(text) {
  const t = String(text || "").trim();
  // Außer Zeitspannen und bekannten Kürzeln darf nur Satzzeichen-Rauschen
  // übrig bleiben – „3 F“ oder „1: 06:00-14:00“ sind nicht eindeutig.
  const rest = normalisiert(t)
    .replace(/(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/g, " ")
    .split(/[\s|]+/)
    .map((w) => w.replace(/^[([{"'„]+|[)\]}"'“:,;]+$/g, ""))
    .filter((w) => /[a-z0-9äöü]/i.test(w))
    .filter((w) => !KUERZEL.some((x) => x.re.test(/^([a-z])\1+$/i.test(w) ? w[0] : w)));
  if (rest.length) return false;
  // Zeitspanne muss sauber allein stehen: kein angeschnittenes Zeichen davor
  // oder dahinter (aus „16:00“ darf nie „06:00“ werden), Minuten bei beiden
  // Zeiten oder bei keiner.
  const n = normalisiert(t);
  for (const m of n.matchAll(/(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/g)) {
    const davor = n[m.index - 1];
    const danach = n[m.index + m[0].length];
    if ((davor && !/\s/.test(davor)) || (danach && !/\s/.test(danach))) return false;
    if ((m[2] == null) !== (m[4] == null)) return false;
  }
  const d = diensteAusText(t);
  if (d.length > 1 && d.length <= MAX_EINSAETZE && d.every((x) => x.art === "arbeit")) return true;
  if (d.length !== 1) return false;
  if (/^[-–—/]$/.test(t.replace(/\s/g, ""))) return true;
  if (d[0].art === "frei" && !/frei|ruhe|x/i.test(t)) return false;
  return true;
}

// Text je Tages-Zelle → Dienst je Tag. Leere oder unleserliche Zelle → null
// (der Tag bleibt offen), so verrutscht nichts.
export function diensteAusZellen(zellen) {
  return (zellen || []).map((t) => {
    const d = diensteAusText(t);
    if (d.length > 1 && d.every((x) => x.art === "arbeit")) {
      const bloecke = d.slice(0, MAX_EINSAETZE).map(({ von, bis }) => ({ von, bis }));
      return { art: "arbeit", von: bloecke[0].von, bis: bloecke.at(-1).bis, bloecke };
    }
    return d[0] || null;
  });
}

// Montag der nächsten Woche (ab Freitag) bzw. dieser Woche.
export function standardWochenStart(heuteIso) {
  const [j, m, d] = heuteIso.split("-").map(Number);
  const wt = (new Date(j, m - 1, d).getDay() + 6) % 7;
  const montag = plusTage(heuteIso, -wt);
  return wt >= 4 ? plusTage(montag, 7) : montag;
}

// Dienste auf Tage legen: der erste Dienst ist der Starttag, dann fortlaufend.
export function tageAusDiensten(dienste, start, anzahl = 7, rollen = {}, varianten = []) {
  const n = Math.max(anzahl, Math.min(14, dienste.length));
  return Array.from({ length: n }, (_, i) => {
    const d = dienste[i];
    const datum = plusTage(start, i);
    if (!d) return { datum, art: "leer", von: "", bis: "" };
    if (d.art === "rolle") {
      const v = varianten.find((x) => x.id === rollen[d.rolle]);
      const zeit = v?.arbeitVon && v?.arbeitBis ? [v.arbeitVon, v.arbeitBis] : d.rolle === "F" ? ["06:00", "14:00"] : d.rolle === "S" ? ["14:00", "22:00"] : ["22:00", "06:00"];
      return mitBloecken({ datum, art: "arbeit" }, [{ von: zeit[0], bis: zeit[1] }]);
    }
    if (d.art === "arbeit") return mitBloecken({ datum, art: "arbeit" }, d.bloecke || [{ von: d.von, bis: d.bis }]);
    return { datum, art: d.art, von: "", bis: "" };
  });
}

// Routine-Startzeiten für einen Dienst, ausgehend von der normalen Zeit:
// früher Dienst → Morgenroutine 90 Min. vorher; später Dienst → Abendroutine
// 90 Min. nach Dienstende; Nachtdienst → Morgenroutine nach dem Ausschlafen.
export function routineZeitenFuerDienst(von, bis, standard = {}) {
  const v = minuten(von);
  const b = minuten(bis);
  const stdMorgen = minuten(standard.morgen?.startZeit) ?? 7 * 60;
  const stdAbend = minuten(standard.abend?.startZeit) ?? 22 * 60;
  if (v == null || b == null) return { morgenStart: alsZeit(stdMorgen), abendStart: alsZeit(stdAbend) };
  if (b < v) return { morgenStart: alsZeit(b + 8 * 60), abendStart: alsZeit(b + 60) };
  const morgen = Math.min(stdMorgen, v - 90);
  const abend = b + 90 > stdAbend ? b + 90 : stdAbend;
  return { morgenStart: alsZeit(morgen), abendStart: alsZeit(abend) };
}

const namePasst = (v, re) => re.test(v.name || "");

// Passende Variante zu einem Tag finden (gleiche Arbeitszeit, bei Frei die
// Variante „Frei“). Kein Treffer → neue Variante vorschlagen.
export function varianteFuerTag(tag, varianten = [], standard = {}) {
  if (tag.art === "frei" || tag.art === "urlaub") {
    const frei = varianten.find((v) => namePasst(v, /frei/i));
    return frei ? { variante: frei } : { variante: null };
  }
  if (tag.art !== "arbeit" || minuten(tag.von) == null || minuten(tag.bis) == null) return { variante: null };
  const gleich = varianten.find((v) => v.arbeitVon === tag.von && v.arbeitBis === tag.bis);
  if (gleich) return { variante: gleich };
  const v = minuten(tag.von);
  const b = minuten(tag.bis);
  const geteilt = bloeckeVon(tag).length > 1;
  const name = geteilt ? "Geteilter Dienst" : b != null && v != null && b < v ? "Nachtdienst" : v != null && v < 10 * 60 ? "Frühdienst" : v != null && v >= 12 * 60 ? "Spätdienst" : "Dienst";
  return {
    neu: {
      name: `${name} ${tag.von}–${tag.bis}`,
      icon: geteilt ? "🔀" : name === "Nachtdienst" ? "🌙" : name === "Frühdienst" ? "🌅" : name === "Spätdienst" ? "🌆" : "💼",
      arbeitVon: tag.von,
      arbeitBis: tag.bis,
      ...routineZeitenFuerDienst(tag.von, tag.bis, standard),
    },
  };
}

// Kalender-Einträge „Arbeit“ für einen Dienst – je Einsatz einer
// (Nachtdienst bis Mitternacht).
export function kalenderEintraegeFuerTag(tag) {
  if (tag.art !== "arbeit") return [];
  const bloecke = bloeckeVon(tag).filter((b) => b.von && b.bis);
  return bloecke.map((b, i) => ({
    bereich: "arbeit",
    titel: bloecke.length > 1 ? `Dienst (${i + 1}. Einsatz)` : "Dienst",
    start: b.von,
    ende: minuten(b.bis) < minuten(b.von) ? "23:59" : b.bis,
    datum: tag.datum,
    wochentage: [],
    erinnerung: false,
    notiz: NOTIZ_MARKER,
  }));
}

// Alle Einsätze eines Arbeitstags vollständig?
export const tagVollstaendig = (tag) => tag.art !== "arbeit" || bloeckeVon(tag).every((b) => gueltigeZeit(b.von) && gueltigeZeit(b.bis));

export const gueltigeZeit = (t) => minuten(t) != null;
