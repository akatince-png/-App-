// Knobelaufgaben mit mitwachsender Schwierigkeit (26.09., Nutzerinnen-
// Rückmeldung: "Die Aufgaben fordern einen nicht wirklich heraus"). Statt
// fester Fragen werden Aufgaben erzeugt – dadurch gibt es beliebig viele und
// das Niveau passt sich an: Level 1–10, Start bei 4. Arten: Kopfrechnen in
// zwei Schritten, Prozent/Brüche, Zahlenreihen mit verschachtelten Regeln,
// Wochentage/Uhrzeiten, Logik. Gleiches Format wie der Denkpausen-Katalog
// ({ frage, antworten[4], richtig }), gespeichert als Kategorie "knobel".
export const KNOBEL_START = 4;

function zufall(rnd, min, max) {
  return min + Math.floor(rnd() * (max - min + 1));
}
function wahl(rnd, liste) {
  return liste[Math.floor(rnd() * liste.length)];
}
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace(".", ","));

// Vier verschiedene Antworten: richtige + plausible Fehler (Rechenfehler um
// ±1/±10, vertauschte Schritte), richtige Position zufällig.
function mitAblenkern(rnd, richtig, fehler) {
  const set = new Set([fmt(richtig)]);
  for (const f of fehler) if (set.size < 4 && Number.isFinite(f) && f !== richtig) set.add(fmt(f));
  let d = 1;
  while (set.size < 4) {
    set.add(fmt(richtig + (set.size % 2 ? d : -d) * (Number.isInteger(richtig) ? 1 : 0.5)));
    d++;
  }
  const antworten = [...set].slice(0, 4);
  for (let i = antworten.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [antworten[i], antworten[j]] = [antworten[j], antworten[i]];
  }
  return { antworten, richtig: antworten.indexOf(fmt(richtig)) };
}

function kopfrechnen(rnd, level) {
  const a = zufall(rnd, 12 + level * 3, 30 + level * 8);
  const b = zufall(rnd, 3 + Math.floor(level / 2), 7 + level);
  const c = zufall(rnd, 10 + level * 4, 40 + level * 12);
  if (level >= 6 && rnd() < 0.5) {
    const d = zufall(rnd, 2, 9);
    const r = (a - d) * b + c;
    return { frage: `(${a} − ${d}) × ${b} + ${c} = ?`, ...mitAblenkern(rnd, r, [a - d * b + c, (a - d) * (b + c), r + 10, r - b]) };
  }
  const r = a * b - c;
  return { frage: `${a} × ${b} − ${c} = ?`, ...mitAblenkern(rnd, r, [a * (b - c), r + 10, r - 10, a * b + c]) };
}

function prozentBruch(rnd, level) {
  if (rnd() < 0.5) {
    const p = wahl(rnd, level >= 6 ? [12.5, 17.5, 35, 45, 65, 7.5] : [15, 20, 25, 30, 40, 75]);
    const basis = zufall(rnd, 4, 16 + level * 2) * 40;
    const r = (basis * p) / 100;
    return { frage: `Wie viel sind ${fmt(p)} % von ${basis}?`, ...mitAblenkern(rnd, r, [r * 10, basis - r, r + p, r / 2]) };
  }
  const nenner = wahl(rnd, level >= 6 ? [7, 8, 9, 12] : [3, 4, 5, 6]);
  const zaehler = zufall(rnd, 2, nenner - 1);
  const basis = nenner * zufall(rnd, 6, 10 + level * 3);
  const r = (basis / nenner) * zaehler;
  return { frage: `${zaehler}/${nenner} von ${basis} = ?`, ...mitAblenkern(rnd, r, [basis / nenner, basis - r, r + zaehler, (basis / zaehler) * nenner]) };
}

function zahlenreihe(rnd, level) {
  const art = zufall(rnd, 0, level >= 5 ? 4 : 2);
  let reihe = [];
  let naechste;
  if (art === 0) {
    // Differenzen wachsen: +d, +d+k, +d+2k …
    let x = zufall(rnd, 2, 20);
    let d = zufall(rnd, 2, 6);
    const k = zufall(rnd, 1, 2 + Math.floor(level / 3));
    for (let i = 0; i < 5; i++) {
      reihe.push(x);
      x += d;
      d += k;
    }
    naechste = x;
  } else if (art === 1) {
    // × m + c
    let x = zufall(rnd, 1, 5);
    const m = zufall(rnd, 2, 3);
    const c = zufall(rnd, -2, 3);
    for (let i = 0; i < 5; i++) {
      reihe.push(x);
      x = x * m + c;
    }
    naechste = x;
  } else if (art === 2) {
    // zwei verschränkte Reihen
    let a = zufall(rnd, 1, 9);
    let b = zufall(rnd, 20, 40);
    const da = zufall(rnd, 2, 5);
    const db = -zufall(rnd, 1, 4);
    for (let i = 0; i < 6; i++) reihe.push(i % 2 ? (b += db) - db : (a += da) - da);
    naechste = a;
  } else if (art === 3) {
    // Fibonacci-artig
    let x = zufall(rnd, 1, 5);
    let y = zufall(rnd, 2, 7);
    for (let i = 0; i < 6; i++) {
      reihe.push(x);
      [x, y] = [y, x + y];
    }
    naechste = x;
  } else {
    // Quadrate ± Versatz
    const s = zufall(rnd, 2, 6);
    const v = zufall(rnd, -3, 3);
    reihe = [0, 1, 2, 3, 4].map((i) => (s + i) ** 2 + v);
    naechste = (s + 5) ** 2 + v;
  }
  const letzte = reihe.at(-1);
  return { frage: `Wie geht die Reihe weiter? ${reihe.join(", ")}, …`, ...mitAblenkern(rnd, naechste, [naechste + 1, naechste - 2, letzte + (letzte - reihe.at(-2)), naechste + 3]) };
}

const TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
function zeitLogik(rnd, level) {
  if (rnd() < 0.5) {
    const start = zufall(rnd, 0, 6);
    const n = zufall(rnd, 20 + level * 10, 60 + level * 40);
    const ziel = (start + n) % 7;
    const set = [ziel, (ziel + 1) % 7, (ziel + 6) % 7, (ziel + 3) % 7];
    const antworten = [...new Set(set)].map((i) => TAGE[i]);
    while (antworten.length < 4) antworten.push(TAGE[(ziel + antworten.length + 1) % 7]);
    const gemischt = [...antworten].sort(() => rnd() - 0.5);
    return { frage: `Heute ist ${TAGE[start]}. Welcher Wochentag ist in ${n} Tagen?`, antworten: gemischt, richtig: gemischt.indexOf(TAGE[ziel]) };
  }
  const h = zufall(rnd, 6, 21);
  const m = zufall(rnd, 0, 59);
  const dauer = zufall(rnd, 70 + level * 10, 200 + level * 40);
  const ende = (h * 60 + m + dauer) % (24 * 60);
  const uhr = (x) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  const falsch = [ende + 60, ende - 10, ende + 40].map((x) => uhr(((x % 1440) + 1440) % 1440));
  const antworten = [...new Set([uhr(ende), ...falsch])].slice(0, 4);
  const gemischt = [...antworten].sort(() => rnd() - 0.5);
  return { frage: `Start ${uhr(h * 60 + m)}, Dauer ${Math.floor(dauer / 60)} h ${dauer % 60} min. Wann ist Schluss?`, antworten: gemischt, richtig: gemischt.indexOf(uhr(ende)) };
}

function logik(rnd, level) {
  const arten = [
    () => {
      const n = zufall(rnd, 3, 5 + Math.floor(level / 2));
      const r = (n * (n - 1)) / 2;
      return { frage: `${n} Personen geben sich alle einmal die Hand. Wie oft wird geschüttelt?`, ...mitAblenkern(rnd, r, [n * n, n * (n - 1), r + n]) };
    },
    () => {
      const alter = zufall(rnd, 8, 14);
      const diff = zufall(rnd, 20, 32);
      const jahre = zufall(rnd, 3, 12);
      const r = alter + diff + jahre;
      return { frage: `Mia ist ${alter}, ihre Mutter ist ${diff} Jahre älter. Wie alt ist die Mutter in ${jahre} Jahren?`, ...mitAblenkern(rnd, r, [alter + diff, r + jahre, alter + jahre]) };
    },
    () => {
      const tage = zufall(rnd, 3, 6);
      const leute = zufall(rnd, 2, 4);
      const mehr = leute * zufall(rnd, 2, 3);
      const r = (tage * leute) / mehr;
      return { frage: `${leute} Personen streichen einen Zaun in ${tage} Tagen. Wie viele Tage brauchen ${mehr} Personen (gleiches Tempo)?`, ...mitAblenkern(rnd, r, [(tage * mehr) / leute, tage - 1, tage / 2 + 1]) };
    },
    () => {
      const preis = zufall(rnd, 12, 30 + level * 5) * 2;
      const rabatt = wahl(rnd, [10, 20, 25]);
      const aufschlag = wahl(rnd, [10, 20, 25]);
      const r = Math.round(preis * (1 - rabatt / 100) * (1 + aufschlag / 100) * 100) / 100;
      return { frage: `Ein Preis von ${preis} € wird um ${rabatt} % gesenkt und danach um ${aufschlag} % erhöht. Neuer Preis?`, ...mitAblenkern(rnd, r, [preis * (1 + (aufschlag - rabatt) / 100), preis, r + 1]) };
    },
  ];
  return wahl(rnd, arten)();
}

const ERZEUGER = [kopfrechnen, prozentBruch, zahlenreihe, zeitLogik, logik];

export function knobelAufgabe(level = KNOBEL_START, rnd = Math.random) {
  const l = Math.max(1, Math.min(10, level));
  const a = wahl(rnd, ERZEUGER)(rnd, l);
  return { ...a, kategorie: "knobel", level: l };
}

// Level aus den letzten 10 Knobel-Antworten: ≥ 80 % richtig → +1, < 50 % → −1.
export function knobelLevel(ergebnisse = []) {
  const knobel = ergebnisse.filter((e) => e.kategorie === "knobel");
  // Ausgangslevel: bisherige Level-Summe grob aus der Menge richtiger Antworten
  let level = KNOBEL_START;
  const chronologisch = [...knobel].sort((a, b) => String(a.erstelltAm).localeCompare(String(b.erstelltAm)));
  for (let i = 10; i <= chronologisch.length; i += 10) {
    const block = chronologisch.slice(i - 10, i);
    const quote = block.filter((e) => e.richtig).length / block.length;
    if (quote >= 0.8) level++;
    else if (quote < 0.5) level--;
    level = Math.max(1, Math.min(10, level));
  }
  return level;
}
