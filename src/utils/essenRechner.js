// Ernährung (25.09., Nutzerinnen-Vorgabe): Die Person schreibt oder spricht,
// was sie gegessen hat ("zwei Scheiben Vollkornbrot, drei Bananen und fünf
// Eier"), die App rechnet im Hintergrund ca.-Werte aus und zeigt sie zum
// Bestätigen – mit angenommenen Gramm und Rechenweg, ohne Chat. Grundlage
// ist die eingebaute Lebensmittel-Liste (data/lebensmittel.js, USDA).
import { LEBENSMITTEL } from "../data/lebensmittel";

export const NAEHRWERTE = ["kcal", "eiweiss", "fett", "kh", "zucker", "ballast", "omega3", "epaDha", "omega6"];

const ZAHLWOERTER = {
  ein: 1, eine: 1, einen: 1, einem: 1, einer: 1, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwoelf: 12,
  halb: 0.5, halbe: 0.5, halben: 0.5, halber: 0.5, anderthalb: 1.5, eineinhalb: 1.5, paar: 2,
};

// Einheit → Schlüssel in `portionen` (oder Gramm-Faktor).
const EINHEITEN = [
  [/^(g|gr|gramm)$/, { gramm: 1 }],
  [/^(kg|kilo|kilogramm)$/, { gramm: 1000 }],
  [/^(ml|milliliter)$/, { gramm: 1 }],
  [/^(l|liter)$/, { gramm: 1000 }],
  [/^scheiben?$/, "scheibe"],
  [/^(stück|stk|stueck)$/, "stück"],
  [/^(el|esslöffel|essloeffel)$/, "el"],
  [/^(tl|teelöffel|teeloeffel)$/, "tl"],
  [/^becher$/, "becher"],
  [/^(glas|gläser|glaeser)$/, "glas"],
  [/^tassen?$/, "tasse"],
  [/^dosen?$/, "dose"],
  [/^handvoll$/, "handvoll"],
  [/^portion(en)?$/, "portion"],
  [/^riegel$/, "riegel"],
  [/^tafeln?$/, "tafel"],
  [/^tüten?$/, "tüte"],
  [/^messlöffel$/, "messlöffel"],
  [/^flaschen?$/, "flasche"],
];

const norm = (s) => s.toLowerCase().replace(/[.!?]/g, " ").replace(/\s+/g, " ").trim();

// Lebensmittel zu einem Text finden: exakt, dann ohne Plural-Endung, dann
// das längste Synonym, das im Text vorkommt.
export function lebensmittelFinden(text) {
  const t = norm(text);
  if (!t) return null;
  // "Skyr/Quark" → jeden Teil einzeln versuchen.
  if (t.includes("/")) {
    for (const teil of t.split("/")) {
      const l = lebensmittelFinden(teil);
      if (l) return l;
    }
  }
  const alle = LEBENSMITTEL.map((l) => ({ l, namen: [l.name.toLowerCase(), ...l.synonyme] }));
  const exakt = alle.find((x) => x.namen.includes(t));
  if (exakt) return exakt.l;
  for (const endung of ["n", "en", "e", "s"]) {
    if (t.endsWith(endung)) {
      const stamm = t.slice(0, -endung.length);
      const x = alle.find((y) => y.namen.includes(stamm));
      if (x) return x.l;
    }
  }
  let bestes = null;
  for (const x of alle) {
    for (const n of x.namen) {
      const re = new RegExp(`(^|\\s|-)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(n|en|e|s)?($|\\s|-)`);
      if (re.test(t) && (!bestes || n.length > bestes.n.length)) bestes = { n, l: x.l };
    }
  }
  return bestes?.l || null;
}

// "zwei Scheiben Vollkornbrot, 3 Bananen und 5 Eier" → Teile.
export function zerlegen(text) {
  return String(text || "")
    .split(/,|;|\n|\+|\bund\b|\bmit\b|\bsowie\b|\bdazu\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function zahlLesen(wort) {
  if (wort == null) return null;
  const w = wort.toLowerCase();
  if (w === "½") return 0.5;
  if (w === "¼") return 0.25;
  if (/^\d+([.,]\d+)?$/.test(w)) return Number(w.replace(",", "."));
  return ZAHLWOERTER[w] ?? null;
}

// Einen Teil lesen: Menge, Einheit, Lebensmittel, angenommene Gramm.
export function teilLesen(teil) {
  let woerter = norm(teil).replace(/(\d)(g|kg|ml|l)\b/g, "$1 $2").split(" ");
  let menge = null;
  let einheit = null;
  // "eine Handvoll", "ein paar"
  const erste = zahlLesen(woerter[0]);
  if (erste != null) {
    const artikel = /^ein/.test(woerter[0]) && erste === 1;
    menge = erste;
    woerter = woerter.slice(1);
    if (woerter[0] === "paar") woerter = woerter.slice(1);
    // "eine halbe Avocado" = 0,5; "zwei halbe" selten, dann 2,5.
    if (zahlLesen(woerter[0]) === 0.5) {
      menge = artikel ? 0.5 : menge + 0.5;
      woerter = woerter.slice(1);
    }
  }
  const e = EINHEITEN.find(([re]) => re.test(woerter[0] || ""));
  if (e) {
    einheit = e[1];
    woerter = woerter.slice(1);
  }
  if (woerter[0] === "von" || woerter[0] === "vom") woerter = woerter.slice(1);
  const name = woerter.join(" ");
  const lebensmittel = lebensmittelFinden(name);
  if (!lebensmittel) return { text: teil.trim(), name, menge, einheit, lebensmittel: null };
  const m = menge ?? 1;
  let gramm;
  let annahme;
  if (einheit && typeof einheit === "object") {
    gramm = m * einheit.gramm;
    annahme = `${fmt(gramm)} g`;
  } else {
    const schluessel = einheit || (lebensmittel.portionen["stück"] ? "stück" : lebensmittel.portionen.portion ? "portion" : Object.keys(lebensmittel.portionen)[0]);
    const proEinheit = lebensmittel.portionen[schluessel] ?? STANDARD_PORTION[schluessel] ?? 100;
    gramm = m * proEinheit;
    const label = EINHEIT_LABEL[schluessel] || schluessel;
    annahme = `${fmt(m)} ${label} à ${fmt(proEinheit)} g = ${fmt(gramm)} g`;
  }
  return { text: teil.trim(), name, menge: m, einheit, lebensmittel, gramm, annahme, werte: werteFuer(lebensmittel, gramm) };
}

const STANDARD_PORTION = { el: 15, tl: 5, glas: 200, tasse: 150, becher: 150, handvoll: 30, portion: 150, scheibe: 30, "stück": 100 };
const EINHEIT_LABEL = { "stück": "Stück", scheibe: "Scheibe(n)", el: "EL", tl: "TL", becher: "Becher", glas: "Glas", tasse: "Tasse(n)", dose: "Dose(n)", handvoll: "Handvoll", portion: "Portion(en)", riegel: "Riegel", tafel: "Tafel", "tüte": "Tüte", "messlöffel": "Messlöffel", flasche: "Flasche(n)" };
const fmt = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

export function werteFuer(l, gramm) {
  const f = gramm / 100;
  const w = {};
  for (const k of NAEHRWERTE) w[k] = Math.round((Number(l[k]) || 0) * f * 10) / 10;
  w.kcal = Math.round(w.kcal);
  for (const k of ["omega3", "epaDha", "omega6"]) w[k] = Math.round(w[k]);
  return w;
}

export function summe(posten) {
  const s = Object.fromEntries(NAEHRWERTE.map((k) => [k, 0]));
  for (const p of posten || []) for (const k of NAEHRWERTE) s[k] += Number(p.werte?.[k]) || 0;
  for (const k of NAEHRWERTE) s[k] = k === "kcal" || k.startsWith("omega") || k === "epaDha" ? Math.round(s[k]) : Math.round(s[k] * 10) / 10;
  return s;
}

// Ganzer Satz → erkannte Posten + was die Liste nicht kennt.
export function essenAuswerten(text) {
  const teile = zerlegen(text).map(teilLesen);
  return { posten: teile.filter((t) => t.lebensmittel), unbekannt: teile.filter((t) => !t.lebensmittel).map((t) => t.text), summe: summe(teile.filter((t) => t.lebensmittel)) };
}

// --- Ziele ---------------------------------------------------------------
export const ZIEL_STANDARD = { eiweissGProKg: 1.6, fettProzent: 30, omega3Mg: 250, omega6zu3Max: 5, fischProWoche: 2 };

// Gramm-Ziele aus Gewicht + Kalorienziel. Kohlenhydrate = Rest.
export function makroZiele(ziele = {}, gewichtKg, kalorienZiel) {
  const z = { ...ZIEL_STANDARD, ...Object.fromEntries(Object.entries(ziele).filter(([, v]) => v !== null && v !== undefined && v !== "")) };
  const kg = Number(gewichtKg) || null;
  const kcal = Number(kalorienZiel) || null;
  const eiweiss = kg ? Math.round(kg * Number(z.eiweissGProKg)) : null;
  const fett = kcal ? Math.round((kcal * Number(z.fettProzent)) / 100 / 9) : null;
  const kh = kcal && eiweiss != null && fett != null ? Math.max(0, Math.round((kcal - eiweiss * 4 - fett * 9) / 4)) : null;
  return { ...z, eiweiss, fett, kh, kcal };
}

export const verhaeltnis = (omega6, omega3) => (omega3 > 0 ? Math.round((omega6 / omega3) * 10) / 10 : null);

// Nährwerte einer geplanten Mahlzeit aus ihren Zutaten (Name + Gramm).
export function mahlzeitWerte(zutaten = []) {
  const posten = [];
  for (const z of zutaten) {
    const l = lebensmittelFinden(z.name || "");
    const g = Number(z.mengeGramm) || (l ? teilLesen(`${z.menge || ""} ${z.name}`).gramm : 0);
    if (l && g) posten.push({ text: z.name, lebensmittel: l, gramm: g, werte: werteFuer(l, g) });
  }
  return { posten, summe: summe(posten) };
}

// Tipp für den Rest des Tages (Eiweiß zuerst, dann Omega-3), aus den
// bevorzugten Quellen der Person — oder den üblichen, falls keine gewählt.
export function tagesTipp(ist, ziel, quellen = {}) {
  if (ziel.eiweiss && ist.eiweiss < ziel.eiweiss * 0.9) {
    const offen = Math.round(ziel.eiweiss - ist.eiweiss);
    const kandidaten = [...(quellen.eiweiss || []), "Skyr/Quark", "Eier", "Linsen"];
    for (const k of kandidaten) {
      const l = lebensmittelFinden(k);
      if (!l || !l.eiweiss) continue;
      const stueck = !l.portionen.becher && !l.portionen.portion && l.portionen["stück"];
      const portion = l.portionen.becher || l.portionen.portion || (stueck ? stueck * 3 : 150);
      const g = Math.round(l.eiweiss * portion) / 100;
      const menge = stueck ? `3 × ${l.name} (${fmt(portion)} g)` : `${fmt(portion)} g ${l.name}`;
      return `Noch ${offen} g Eiweiß offen – z. B. ${menge}, ≈ ${Math.round(g)} g Eiweiß.`;
    }
    return `Noch ${offen} g Eiweiß offen.`;
  }
  if (ziel.omega3Mg && ist.epaDha < ziel.omega3Mg) {
    return "Omega-3 heute noch knapp – fetter Fisch (Lachs, Hering, Makrele), Leinöl oder Walnüsse helfen.";
  }
  return null;
}

// Werte eines Tages: frei eingegebenes Essen + abgehakte geplante
// Mahlzeiten (aus ihren Zutaten, falls die Liste sie kennt).
export function tagesWerte(datum, { essenEintraege = [], mahlzeiten = [], mahlzeitErledigt = {} } = {}) {
  const posten = essenEintraege.filter((e) => e.datum === datum).map((e) => ({ werte: e.werte }));
  for (const [k, v] of Object.entries(mahlzeitErledigt || {})) {
    if (!v || !k.startsWith(`${datum}__`)) continue;
    const m = mahlzeiten.find((x) => x.id === k.split("__")[1]);
    if (m?.zutaten?.length) posten.push({ werte: mahlzeitWerte(m.zutaten).summe });
  }
  return { ...summe(posten), anzahl: posten.length };
}

export function aktuellesGewicht(gewichtsEintraege, personalData) {
  const letzte = (gewichtsEintraege || []).filter((e) => Number(e.gewicht)).at(-1);
  return Number(letzte?.gewicht) || Number(personalData?.gewichtStart) || null;
}

export const QUELLEN = {
  eiweiss: ["Eier", "Skyr/Quark", "Hüttenkäse", "Hähnchen", "Pute", "Rind", "Lachs", "Thunfisch", "Linsen", "Kichererbsen", "Tofu", "Whey"],
  fett: ["Fetter Fisch", "Leinöl", "Rapsöl", "Olivenöl", "Walnüsse", "Leinsamen", "Chiasamen", "Algenöl", "Avocado", "Nüsse"],
  kh: ["Haferflocken", "Vollkornbrot", "Kartoffeln", "Süßkartoffeln", "Reis", "Vollkornnudeln", "Obst", "Hülsenfrüchte", "Gemüse"],
  vermeiden: ["Laktose", "Gluten", "Fruktose", "Nüsse", "Fisch", "Fleisch (vegetarisch)", "Tierprodukte (vegan)"],
};
export const ZIELARTEN = [
  ["abnehmen", "Abnehmen", -15],
  ["halten", "Halten", 0],
  ["zunehmen", "Zunehmen", 10],
];
