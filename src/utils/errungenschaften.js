import { toLocalISODate, zaehleTageStreak } from "./dates";
import { F_WARM, F_PLUM, F_EMERALD, F_SLATE } from "../constants";

// Punkte-/Abzeichen-System (Nutzerin-Vorgabe, 11.09.): 1 Punkt pro
// erledigtem Eintrag, Streaks pro Kategorie + ein globaler Streak über
// alle Kategorien hinweg. Bewusst KEINE eigene Punkte-/Streak-Speicherung
// in der DB — beides wird bei Bedarf direkt aus den schon vorhandenen
// "erledigt"-Logs jeder Kategorie berechnet (siehe useErrungenschaften.js
// für die Speicherung, WELCHE Abzeichen bereits verdient wurden).

function normalisiereDatum(roh) {
  if (!roh) return null;
  const str = String(roh);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalISODate(d);
}

// Für Kategorien, deren Fortschritt in einer "erledigt"-Map mit Schlüsseln
// wie "2026-09-11__id__zeit" oder "2026-09-11__id" liegt (Supplemente,
// Mahlzeiten, Gewohnheiten, Hormone/Medikamente, Peptide, Getränke-Rezepte)
// — jeder wahre Eintrag zählt als ein erledigter Eintrag (= 1 Punkt).
function tageAusErledigtMap(map) {
  return Object.entries(map || {})
    .filter(([, wert]) => wert)
    .map(([schluessel]) => normalisiereDatum(schluessel.split("__")[0]))
    .filter(Boolean);
}

// Hormone und Medikamente teilen sich technisch dieselbe Tabelle/Map
// (unterschieden nur über ein Textfeld ohne echte DB-Verknüpfung) — auf
// Nutzerinnen-Wunsch (11.09.) bewusst als EINE gemeinsame Kategorie
// geführt statt den Mehraufwand einer sauberen Trennung zu betreiben.
export const KATEGORIEN = [
  {
    key: "morgenroutine",
    label: "Morgenroutine",
    icon: "sun",
    grad: F_WARM,
    holeTage: (q) =>
      (q.routineDurchlaeufe || []).filter((d) => d.routine === "morgen" && d.abgeschlossenUm).map((d) => normalisiereDatum(d.datum)),
  },
  {
    key: "abendroutine",
    label: "Abendroutine",
    icon: "moon",
    grad: F_PLUM,
    holeTage: (q) =>
      (q.routineDurchlaeufe || []).filter((d) => d.routine === "abend" && d.abgeschlossenUm).map((d) => normalisiereDatum(d.datum)),
  },
  {
    key: "schlaf",
    label: "Schlaf",
    icon: "moon",
    grad: F_PLUM,
    holeTage: (q) => (q.schlafEintraege || []).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "hydration",
    label: "Hydration",
    icon: "droplet",
    grad: F_EMERALD,
    holeTage: (q) =>
      (q.hydrationEintraege || []).filter((e) => q.hydrationZielMl > 0 && e.mengeMl >= q.hydrationZielMl).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "tageslicht",
    label: "Tageslicht",
    icon: "sun",
    grad: F_WARM,
    holeTage: (q) =>
      (q.tageslichtEintraege || [])
        .filter((e) => q.tageslichtZielMinuten > 0 && e.minuten >= q.tageslichtZielMinuten)
        .map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "ernaehrung",
    label: "Ernährung",
    icon: "utensils",
    grad: F_WARM,
    holeTage: (q) => tageAusErledigtMap(q.mahlzeitErledigt),
  },
  {
    key: "training",
    label: "Training",
    icon: "dumbbell",
    grad: F_WARM,
    holeTage: (q) => (q.trainingEintraege || []).filter((e) => e.erledigt).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "supplemente",
    label: "Supplemente",
    icon: "capsule",
    grad: F_WARM,
    holeTage: (q) => tageAusErledigtMap(q.supplementErledigt),
  },
  {
    key: "medikamente",
    label: "Hormone & Medikamente",
    icon: "cross",
    grad: F_SLATE,
    holeTage: (q) => tageAusErledigtMap(q.hormonErledigt),
  },
  {
    key: "peptide",
    label: "Peptide",
    icon: "dna",
    grad: F_SLATE,
    holeTage: (q) => tageAusErledigtMap(q.peptidErledigt),
  },
  {
    key: "gewohnheiten",
    label: "Gewohnheiten",
    icon: "target",
    grad: F_EMERALD,
    holeTage: (q) => tageAusErledigtMap(q.gewohnheitErledigt),
  },
  {
    key: "drinks",
    label: "Getränke-Rezepte",
    icon: "droplet",
    grad: F_EMERALD,
    holeTage: (q) => tageAusErledigtMap(q.rezeptErledigt),
  },
  {
    key: "atemuebungen",
    label: "Atemübungen",
    icon: "wind",
    grad: F_PLUM,
    holeTage: (q) => (q.atemuebungLogs || []).map((l) => normalisiereDatum(l.erstelltAm)),
  },
];

// Streak-Meilensteine gelten pro Kategorie UND global.
export const STREAK_SCHWELLEN = [7, 14, 28, 60, 90, 180, 365];
// Punkte-Meilensteine gelten nur global (über alle Kategorien addiert).
export const PUNKTE_SCHWELLEN = [50, 100, 250, 500, 1000, 2500];

// Zählt aufeinanderfolgende Tage rückwärts ab heute — bzw. ab gestern,
// falls heute noch nichts erledigt wurde, damit ein noch nicht abgehakter
// "heutiger" Tag den Streak nicht sofort auf 0 zurücksetzt (dieselbe
// Konvention wie aktuelleSerie() in useGewohnheitenData.js).
function berechneStreak(tageSet) {
  return zaehleTageStreak((tag) => tageSet.has(tag));
}

// Kernberechnung: aus den rohen Quelldaten (siehe useErrungenschaften.js
// für die erwartete Form von `quellen`) Punkte und Streaks je Kategorie
// sowie global ermitteln, plus die Menge aller Abzeichen-Keys, die damit
// AKTUELL erreicht sind — unabhängig davon, ob sie schon als "verdient" in
// der DB stehen (das gleicht useErrungenschaften.js ab).
export function berechneErrungenschaften(quellen) {
  const alleTageGlobal = new Set();
  let gesamtPunkte = 0;

  const kategorien = KATEGORIEN.map((kat) => {
    const tage = kat.holeTage(quellen).filter(Boolean);
    const tageSet = new Set(tage);
    tage.forEach((t) => alleTageGlobal.add(t));
    gesamtPunkte += tage.length;
    return {
      key: kat.key,
      label: kat.label,
      icon: kat.icon,
      grad: kat.grad,
      punkte: tage.length,
      streak: berechneStreak(tageSet),
    };
  });

  const globalerStreak = berechneStreak(alleTageGlobal);

  const erreichteBadgeKeys = new Set();
  kategorien.forEach((kat) => {
    STREAK_SCHWELLEN.forEach((schwelle) => {
      if (kat.streak >= schwelle) erreichteBadgeKeys.add(`${kat.key}_streak_${schwelle}`);
    });
  });
  STREAK_SCHWELLEN.forEach((schwelle) => {
    if (globalerStreak >= schwelle) erreichteBadgeKeys.add(`global_streak_${schwelle}`);
  });
  PUNKTE_SCHWELLEN.forEach((schwelle) => {
    if (gesamtPunkte >= schwelle) erreichteBadgeKeys.add(`global_punkte_${schwelle}`);
  });

  return { gesamtPunkte, kategorien, globalerStreak, erreichteBadgeKeys };
}

// Menschenlesbare Beschriftung für einen Badge-Key — für die Abzeichen-
// Galerie und "nächstes Abzeichen"-Hinweise.
export function badgeLabel(badgeKey) {
  if (badgeKey.startsWith("global_streak_")) {
    return `${badgeKey.replace("global_streak_", "")} Tage am Stück (gesamt)`;
  }
  if (badgeKey.startsWith("global_punkte_")) {
    return `${badgeKey.replace("global_punkte_", "")} Punkte (gesamt)`;
  }
  const kat = KATEGORIEN.find((k) => badgeKey.startsWith(`${k.key}_streak_`));
  if (kat) {
    const tage = badgeKey.replace(`${kat.key}_streak_`, "");
    return `${tage} Tage am Stück — ${kat.label}`;
  }
  return badgeKey;
}

// Erklärt in einem Satz, was für ein Abzeichen konkret erfüllt werden muss
// — für die "Alle Abzeichen"-Übersicht (Nutzerin-Vorgabe, 12.09.: "wenn man
// draufklickt, soll eine Beschreibung kommen, was man erfüllen muss").
export function badgeBeschreibung(badgeKey) {
  if (badgeKey.startsWith("global_streak_")) {
    const tage = badgeKey.replace("global_streak_", "");
    return `${tage} Tage in Folge, an denen in irgendeiner Kategorie mindestens ein Eintrag erledigt wurde.`;
  }
  if (badgeKey.startsWith("global_punkte_")) {
    const punkte = badgeKey.replace("global_punkte_", "");
    return `Insgesamt ${punkte} Punkte sammeln (1 Punkt pro erledigtem Eintrag, über alle Kategorien zusammen).`;
  }
  const kat = KATEGORIEN.find((k) => badgeKey.startsWith(`${k.key}_streak_`));
  if (kat) {
    const tage = badgeKey.replace(`${kat.key}_streak_`, "");
    return `${tage} Tage in Folge in der Kategorie "${kat.label}" erledigt.`;
  }
  return "";
}

// Vollständiger Katalog ALLER möglichen Abzeichen (verdient oder nicht) —
// für die "Alle Abzeichen"-Übersicht, die zeigt, was noch fehlt, nicht nur
// was schon geschafft wurde.
export function alleBadges() {
  const badges = [];
  KATEGORIEN.forEach((kat) => {
    STREAK_SCHWELLEN.forEach((schwelle) => {
      badges.push({
        key: `${kat.key}_streak_${schwelle}`,
        gruppe: kat.key,
        gruppenLabel: kat.label,
        icon: kat.icon,
        grad: kat.grad,
        schwelle,
        typ: "streak",
      });
    });
  });
  STREAK_SCHWELLEN.forEach((schwelle) => {
    badges.push({ key: `global_streak_${schwelle}`, gruppe: "global", gruppenLabel: "Gesamt", icon: "flame", grad: null, schwelle, typ: "streak" });
  });
  PUNKTE_SCHWELLEN.forEach((schwelle) => {
    badges.push({ key: `global_punkte_${schwelle}`, gruppe: "global", gruppenLabel: "Gesamt", icon: "trophy", grad: null, schwelle, typ: "punkte" });
  });
  return badges;
}
