import { toLocalISODate, zaehleTageStreak } from "./dates";
import { KATEGORIE_META } from "./dayItems";
import { aufhellen } from "../ui/theme";

// Punkte-/Abzeichen-System (Nutzerin-Vorgabe, 11.09.): 1 Punkt pro
// erledigtem Eintrag, Streaks pro Kategorie + ein globaler Streak über
// alle Kategorien hinweg. Bewusst KEINE eigene Punkte-/Streak-Speicherung
// in der DB — beides wird bei Bedarf direkt aus den schon vorhandenen
// "erledigt"-Logs jeder Kategorie berechnet (siehe useErrungenschaften.js
// für die Speicherung, WELCHE Abzeichen bereits verdient wurden).

// Bug-Fix/Vorgabe (13.09., Nutzerin): Abzeichen/Streaks nutzten bisher 4
// eigene Gradient-Familien (frühere F_WARM/F_SLATE/F_PLUM/F_EMERALD) statt
// der KATEGORIE_META-Farbe, die im Home-Tagesfortschritt-Balken und in den
// "Alle Pläne"-Reitern längst für dieselbe Kategorie verwendet wird —
// "Training" erschien dadurch z. B. hier bräunlich-orange statt rot wie
// überall sonst. "die Pläne müssen überall die gleichen Farben haben in
// der gesamten App" — jetzt dieselbe Basisfarbe, nur als sanfter Verlauf
// zur aufgehellten Variante statt einer flachen Fläche.
function gradAus(basisFarbe) {
  return [basisFarbe, aufhellen(basisFarbe, 20)];
}

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
    icon: "sunrise",
    // Kein KATEGORIE_META-Eintrag für Morgen-/Abendroutine (siehe Kommentar
    // dort) — gleiche Farbe wie ROUTINE_FARBE in HomeView.jsx/
    // EIGENE_TAB_FARBE in PlaeneView.jsx.
    grad: gradAus("#E08A3E"),
    holeTage: (q) =>
      [...new Set((q.routineDurchlaeufe || []).filter((d) => d.routine === "morgen" && d.abgeschlossenUm).map((d) => normalisiereDatum(d.datum)))],
  },
  {
    key: "abendroutine",
    label: "Abendroutine",
    icon: "moon",
    grad: gradAus("#4E6690"),
    holeTage: (q) =>
      [...new Set((q.routineDurchlaeufe || []).filter((d) => d.routine === "abend" && d.abgeschlossenUm).map((d) => normalisiereDatum(d.datum)))],
  },
  {
    key: "schlaf",
    label: "Schlaf",
    icon: "moon",
    grad: gradAus(KATEGORIE_META.schlaf.dot),
    holeTage: (q) => (q.schlafEintraege || []).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "hydration",
    label: "Hydration",
    icon: "droplet",
    grad: gradAus(KATEGORIE_META.hydration.dot),
    holeTage: (q) =>
      (q.hydrationEintraege || []).filter((e) => q.hydrationZielMl > 0 && e.mengeMl >= q.hydrationZielMl).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "tageslicht",
    label: "Tageslicht",
    icon: "sun",
    grad: gradAus(KATEGORIE_META.tageslicht.dot),
    holeTage: (q) =>
      (q.tageslichtEintraege || [])
        .filter((e) => q.tageslichtZielMinuten > 0 && e.minuten >= q.tageslichtZielMinuten)
        .map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "ernaehrung",
    label: "Ernährung",
    icon: "utensils",
    grad: gradAus(KATEGORIE_META.mahlzeit.dot),
    holeTage: (q) => tageAusErledigtMap(q.mahlzeitErledigt),
  },
  {
    key: "training",
    label: "Training",
    icon: "dumbbell",
    grad: gradAus(KATEGORIE_META.training.dot),
    holeTage: (q) => (q.trainingEintraege || []).filter((e) => e.erledigt).map((e) => normalisiereDatum(e.datum)),
  },
  {
    key: "supplemente",
    label: "Supplemente",
    icon: "capsule",
    grad: gradAus(KATEGORIE_META.supplement.dot),
    holeTage: (q) => tageAusErledigtMap(q.supplementErledigt),
  },
  {
    // Umfasst seit Migration 0042 (13.08.) auch Peptide — teilen sich
    // dieselbe Tabelle/Map, siehe Kommentar oben. Bug-Fix (13.09.,
    // Nutzerin-Vorgabe): stand hier bisher zusätzlich als eigene "Peptide"-
    // Kategorie mit eigenem Abzeichen-Satz, obwohl inhaltlich längst
    // dasselbe wie Medikamente — las über usePeptideLogs.js/das separate
    // peptide_logs-Feedback (siehe dessen Löschung, 13.09.) ein Feld, das
    // TagesplanView.jsx praktisch nie befüllte, da buildDayItems() seit
    // Migration 0042 nur noch die Kategorie "hormon" vergibt. Die
    // "Peptide"-Abzeichen waren dadurch technisch unerreichbar.
    // Nutzerinnen-Vorgabe (13.09.): "möchte nicht mehr, dass Medikamente
    // unterschieden werden von Peptiden, Hormonen oder sonstigen Dingen" —
    // Label entsprechend vereinheitlicht.
    key: "medikamente",
    label: "Medikamente",
    icon: "cross",
    grad: gradAus(KATEGORIE_META.hormon.dot),
    holeTage: (q) => tageAusErledigtMap(q.hormonErledigt),
  },
  {
    key: "gewohnheiten",
    label: "Gewohnheiten",
    icon: "target",
    grad: gradAus(KATEGORIE_META.gewohnheit.dot),
    holeTage: (q) => tageAusErledigtMap(q.gewohnheitErledigt),
  },
  {
    key: "atemuebungen",
    label: "Atemübungen",
    icon: "wind",
    grad: gradAus(KATEGORIE_META.atemuebung.dot),
    holeTage: (q) => (q.atemuebungLogs || []).map((l) => normalisiereDatum(l.erstelltAm)),
  },
  {
    // Denkpause (16.09., Nutzerinnen-Vorgabe): kein eigener Lebensbereich
    // in KATEGORIE_META (siehe dayItems.js) — bereichsübergreifend, nicht
    // an ein <Shell bereich="…"> gebunden. Nur RICHTIG beantwortete
    // Denkpausen zählen als Punkt, damit sich das "seine fehlenden Punkte
    // aus anderen Bereichen einholen" auch wirklich wie Punkte verdienen
    // anfühlt statt wie reine Teilnahme. Die separate Solved/Nicht-gelöst-
    // Aufschlüsselung je Denkpause-Kategorie (Mathe/Wortspiele/Rätsel/
    // Allgemeinwissen) läuft NICHT über dieses Punktesystem, sondern
    // eigenständig in ErfolgeTab.jsx.
    key: "denkpause",
    label: "Denkpause",
    icon: "book",
    grad: gradAus("#C0447E"),
    holeTage: (q) => (q.denkpauseErgebnisse || []).filter((e) => e.richtig).map((e) => normalisiereDatum(e.erstelltAm)),
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
      // Anzahl verschiedener Tage mit mindestens einem Eintrag (für "Deine
      // Welt": Pflanzen wachsen mit Tagen, nicht mit Einträgen).
      tage: tageSet.size,
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

// Verbindet die Kategorie-Schlüssel aus dem Home-Widget-System
// (HomeView.jsx miniWidgetData, z. B. "hormon") mit den leicht anders
// benannten Schlüsseln hier im Erfolge-System (z. B. "medikamente") —
// gemeinsam genutzt von TagesfortschrittOrden.jsx (Tablet-Leiste) und dem
// Orden-Hinweis auf den Direktzugriff-Kacheln in HomeView.jsx (13.09.,
// Nutzerinnen-Vorgabe: "die Orden sollen für die Nutzer sichtlicher sein...
// für die Nutzer unten in ihren kleinen Feldern" — die Tablet-Leiste allein
// war auf dem Handy gar nicht sichtbar). Schlaf/Atemübungen haben auf Home
// kein eigenes Widget und tauchen deshalb hier nie auf.
export const WIDGET_ZU_ORDEN_KATEGORIE = {
  gewohnheit: "gewohnheiten",
  morgenroutine: "morgenroutine",
  abendroutine: "abendroutine",
  hormon: "medikamente",
  supplement: "supplemente",
  mahlzeit: "ernaehrung",
  training: "training",
  hydration: "hydration",
  tageslicht: "tageslicht",
};

// Liefert den anzuzeigenden Orden-Zustand für EINE Home-Widget-Kategorie
// (oder null, wenn die Kategorie gar nicht am Orden-System teilnimmt) —
// grau/transparent (freigeschaltet: false) mit dem ersten Meilenstein als
// "nächstes Ziel", sobald mindestens ein Streak-Meilenstein erreicht ist
// stattdessen der höchste erreichte, farbig. `kategorien`/`verdiente`
// kommen aus useErrungenschaften()/berechneErrungenschaften().
export function ordenFuerWidgetKategorie(widgetKategorie, kategorien, verdiente) {
  const key = WIDGET_ZU_ORDEN_KATEGORIE[widgetKategorie];
  if (!key) return null;
  const k = kategorien.find((kat) => kat.key === key);
  if (!k) return null;
  const erreichteSchwellen = STREAK_SCHWELLEN.filter((s) => verdiente[`${key}_streak_${s}`]);
  const freigeschaltet = erreichteSchwellen.length > 0;
  const schwelle = freigeschaltet ? erreichteSchwellen[erreichteSchwellen.length - 1] : STREAK_SCHWELLEN[0];
  return { key, label: k.label, icon: k.icon, grad: k.grad, streak: k.streak, freigeschaltet, schwelle };
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
