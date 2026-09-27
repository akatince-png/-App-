// Einrichtungs-Checkliste pro Person (27.09., Nutzerinnen-Wunsch: "als Coach
// am Monitor ohne KI leicht alles einstellen, damit das Programm starten
// kann"). Reine Logik: aus den geladenen Fakten einer Person die Schritte in
// AKA-Reihenfolge (Abend vor Morgen, dann Bewegung, dann die übrige Basis).
//
import { steckbriefZeilen } from "./steckbrief";

// stufe: "pflicht" (nötig für "Bereit zum Start"), "empfohlen", "optional"
// (nur falls nötig, z. B. Medikation). ziel = View, in die "Einrichten" springt.

export const VORLAGE = {
  abend: { start: "21:30", ende: "22:30" },
  morgen: { start: "06:30", ende: "07:30" },
  wasserMl: 2500,
  lichtMin: 30,
};

const zeit = (t) => (t ? String(t).slice(0, 5) : "");

export function einrichtungsSchritte(f) {
  if (!f) return [];
  const abend = f.routinen?.abend;
  const morgen = f.routinen?.morgen;
  const erinnerungAn = (k) => {
    const w = f.erinnerungen?.[k];
    return w === true || (w && typeof w === "object" && !!w.aktiv);
  };
  const tn = f.teilnahme;
  return [
    {
      key: "zugang",
      emoji: "✉️",
      titel: "Zugang",
      stufe: "empfohlen",
      fertig: !!f.angemeldet,
      detail: f.angemeldet ? "Hat sich schon angemeldet" : "Noch nicht angemeldet – Einladung per E-Mail ist raus",
    },
    {
      key: "team",
      emoji: "👥",
      titel: "Team",
      stufe: "optional",
      fertig: !!f.teamId,
      detail: f.teamId ? f.teamName || "Im Team" : "Einzelperson (kein Team)",
      art: "team",
    },
    {
      key: "steckbrief",
      emoji: "🪪",
      titel: "Steckbrief & Ziele",
      stufe: "empfohlen",
      fertig: !!f.onboardingFertig,
      detail: f.onboardingFertig
        ? steckbriefZeilen(f.steckbrief).join(" · ") || "Ausgefüllt"
        : "Füllt die Person beim ersten Login aus – oder du über „Einrichten“",
      ziel: "form",
    },
    {
      key: "abendroutine",
      emoji: "🌙",
      titel: "Abendroutine",
      stufe: "pflicht",
      fertig: !!abend?.start,
      detail: abend?.start ? `ab ${zeit(abend.start)} Uhr${f.schritte?.abend ? ` · ${f.schritte.abend} Schritte` : ""}` : "Startzeit fehlt",
      ziel: "abendroutine",
      vorlage: `Startzeit ${VORLAGE.abend.start} (Schritte bringt das Programm Woche für Woche)`,
    },
    {
      key: "morgenroutine",
      emoji: "🌅",
      titel: "Morgenroutine",
      stufe: "pflicht",
      fertig: !!morgen?.start,
      detail: morgen?.start ? `ab ${zeit(morgen.start)} Uhr${f.schritte?.morgen ? ` · ${f.schritte.morgen} Schritte` : ""}` : "Startzeit fehlt",
      ziel: "morgenroutine",
      vorlage: `Startzeit ${VORLAGE.morgen.start}`,
    },
    {
      key: "bewegung",
      emoji: "🏃",
      titel: "Bewegung",
      stufe: "empfohlen",
      fertig: (f.trainingTage || 0) > 0,
      detail: f.trainingTage ? `${f.trainingTage} Tag${f.trainingTage === 1 ? "" : "e"} pro Woche geplant` : "Noch kein Wochenplan (Sport kommt in Woche 2 dazu)",
      ziel: "training",
    },
    {
      key: "wasser",
      emoji: "💧",
      titel: "Wasser",
      stufe: "empfohlen",
      fertig: !!f.wasserMl,
      detail: f.wasserMl ? `${(f.wasserMl / 1000).toLocaleString("de-DE")} l am Tag` : "Kein Tagesziel",
      ziel: "hydration",
      vorlage: `${VORLAGE.wasserMl / 1000} l am Tag`.replace(".", ","),
    },
    {
      key: "licht",
      emoji: "☀️",
      titel: "Tageslicht",
      stufe: "empfohlen",
      fertig: !!f.lichtMin,
      detail: f.lichtMin ? `${f.lichtMin} Min. am Tag` : "Kein Tagesziel",
      ziel: "tageslicht",
      vorlage: `${VORLAGE.lichtMin} Min. am Tag`,
    },
    {
      key: "schlaf",
      emoji: "😴",
      titel: "Schlaf",
      stufe: "empfohlen",
      fertig: !!f.schlafGeplant,
      detail: f.schlafGeplant ? "Schlafzeiten stehen" : "Noch keine Bett-/Aufwachzeit",
      ziel: "schlaf",
    },
    {
      key: "essen",
      emoji: "🍽️",
      titel: "Essen",
      stufe: "optional",
      fertig: (f.mahlzeiten || 0) > 0,
      detail: f.mahlzeiten ? `${f.mahlzeiten} Mahlzeiten im Wochenplan` : "Kommt in Woche 3 – vorher optional",
      ziel: "ernaehrung",
    },
    {
      key: "medikation",
      emoji: "💊",
      titel: "Medikation",
      stufe: "optional",
      fertig: (f.medikamente || 0) > 0,
      detail: f.medikamente ? `${f.medikamente} eingetragen` : "Nur falls nötig (mit Arzt/Ärztin)",
      ziel: "medikamente",
    },
    {
      key: "supplemente",
      emoji: "🧪",
      titel: "Supplemente",
      stufe: "optional",
      fertig: (f.supplemente || 0) > 0,
      detail: f.supplemente ? `${f.supplemente} eingetragen` : "Nur falls nötig",
      ziel: "supplemente",
    },
    {
      key: "erinnerungen",
      emoji: "🔔",
      titel: "Erinnerungen",
      stufe: "empfohlen",
      fertig: erinnerungAn("morgenroutine") && erinnerungAn("abendroutine"),
      detail:
        (erinnerungAn("morgenroutine") && erinnerungAn("abendroutine") ? "Morgen + Abend an" : "Morgen/Abend noch aus") +
        (f.geraete ? ` · Handy verbunden` : " · Handy noch nicht verbunden (tippt die Person selbst)"),
      vorlage: "Erinnerung für Morgen- und Abendroutine an (15 Min. vorher)",
    },
    {
      key: "programm",
      emoji: "🧭",
      titel: "Programmstart",
      stufe: "pflicht",
      fertig: !!tn && (tn.status === "laufend" || tn.status === "abgeschlossen") && !!tn.start,
      detail: tn?.start ? `${tn.status === "laufend" ? "Läuft seit" : "Start"} ${tn.start.split("-").reverse().join(".")} (abends)` : "Noch kein Start – wartet",
      art: "start",
    },
  ];
}

export function einrichtungsStand(schritte) {
  const pflicht = schritte.filter((s) => s.stufe === "pflicht");
  const zaehlen = schritte.filter((s) => s.stufe !== "optional");
  return {
    bereit: pflicht.every((s) => s.fertig),
    offenPflicht: pflicht.filter((s) => !s.fertig).map((s) => s.titel),
    erledigt: zaehlen.filter((s) => s.fertig).length,
    gesamt: zaehlen.length,
  };
}
