import { sameDay, toLocalISODate } from "./dates";
import { faelltAnTag } from "./schedule";

// getDay()-indexiert (0 = Sonntag), passend zu JS' Date#getDay().
const GETDAY_TO_LABEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Feste Tageszeiten bekommen eine repräsentative Stunde, damit sie sich
// sinnvoll neben exakten Uhrzeiten (Peptide/Medikamente) einsortieren.
export const TAGESZEIT_STUNDE = { Morgens: "08", Mittags: "13", Abends: "20" };

// Jeder Lebensbereich bekommt eine eigene, klar erkennbare Farbe statt
// überall derselben Marken-Akzentfarbe (Nutzerinnen-Vorgabe, 27.07.):
// Tageslicht = Gelb, Training = Rot, Medikamente = Lila, Hydration = Blau,
// Schlaf = Indigo (nachtnahes Dunkelblau, unterscheidbar von Medikamente-
// Lila), Supplemente = Gold, Ernährung = Terrakotta, Gewohnheiten = Teal.
// `dot` ist die kräftige Version (Icons, Ringe, Buttons), `bg`/`text` die
// helle Variante für Badges/Chips. Peptide sind seit der Datenzusammen-
// legung (13.08., Migration 0042) Teil von "hormon" (Medikamente) und
// haben keine eigene Kategorie mehr.
// Kräftiger/gesättigter als zuvor (Nutzerinnen-Vorgabe, 16.08.: "die Farben
// etwas catchier, etwas stärker" — v. a. Home-Mini-Widgets und die
// Bereichsfarben in den Plänen wirkten zu blass). Gleiche Farbfamilien wie
// vorher, nur satter/dunkler statt heller/entsättigter — `dot` am
// deutlichsten angehoben (Ringe/Icons/Buttons, größte Fläche), `bg`/`text`
// nur leicht (bleiben als helle Badge-/Fließtext-Variante lesbar).
// `icon` verweist auf einen Namen aus dem zentralen Linien-Icon-Set
// (src/ui/Icon.jsx) — dieselben Namen, die schon anderswo in der App für
// dieselbe Kategorie verwendet werden (z. B. constants.js, PlaeneView.jsx),
// damit sich Farbe UND Symbol app-weit konsistent mit der jeweiligen
// Kategorie verknüpfen (Nutzerinnen-Vorgabe, 13.09.: kleine Symbole unter
// den Tagesfortschritt-Balken als zusätzlicher "Anker" neben der Farbe).
// Farbsystem (überarbeitet 23.09., Nutzerinnen-Wunsch: "alle Bereiche in
// ihren eigenen Farben kenntlich machen, damit es einprägsam für den Kopf
// ist") — jeder Bereich hat einen klar eigenen Farbton:
// Training rot · Morgenroutine orange · Tageslicht gelb · Ernährung grün ·
// Gewohnheiten türkis · Atemübungen cyan · Hydration blau · Abendroutine
// nachtblau · Schlaf indigo · Medikamente violett · Workflow magenta ·
// Supplemente bernstein · Bildschirmzeit grau.
export const KATEGORIE_META = {
  hormon: { bg: "#F1E3FA", text: "#5E2A8A", dot: "#8436C2", label: "Medikament", icon: "cross" },
  supplement: { bg: "#F5EBD8", text: "#7A4F12", dot: "#B7791F", label: "Supplement", icon: "capsule" },
  mahlzeit: { bg: "#E2F2DF", text: "#255E22", dot: "#3E9B3A", label: "Mahlzeit", icon: "utensils" },
  training: { bg: "#FBE4E1", text: "#9E2319", dot: "#E0352B", label: "Training", icon: "dumbbell" },
  gewohnheit: { bg: "#D9F3F0", text: "#13615C", dot: "#1FA39A", label: "Gewohnheit", icon: "target" },
  workflow: { bg: "#F8E0EE", text: "#86285F", dot: "#C43A8E", label: "Workflow" },
  hydration: { bg: "#E0EAFA", text: "#1B4686", dot: "#2D6FD6", label: "Hydration", icon: "droplet" },
  tageslicht: { bg: "#FBF3D2", text: "#7D6206", dot: "#E8B90C", label: "Tageslicht", icon: "sun" },
  schlaf: { bg: "#E6E6FA", text: "#34348F", dot: "#5B5BD6", label: "Schlaf", icon: "moon" },
  atemuebung: { bg: "#D9F2F8", text: "#0B6378", dot: "#12A5C6", label: "Atemübung", icon: "wind" },
  bildschirmzeit: { bg: "#E7EAEF", text: "#414F63", dot: "#5B6B84", label: "Bildschirmzeit", icon: "smartphone" },
  notfallmodus: { bg: "#F7E4E0", text: "#A23026", dot: "#D12121", label: "Notfallmodus" },
  zeitblock: { bg: "#EEF0E8", text: "#4A5240", dot: "#6B7660", label: "Zeitblock" },
};

// Morgen-/Abendroutine haben bewusst KEINEN KATEGORIE_META-Eintrag (sonst
// tauchen sie als tote Einträge in der Wochenübersicht-Legende auf) — ihre
// Farben stehen trotzdem zentral hier statt an sieben Stellen einzeln.
// Tagesrätsel (24.09.): feste Tagesaufgabe aus dem Denksport — eigene
// Farbe wie die "Gemischt"-Kachel der Denksport-Seite.
export const TAGESRAETSEL_META = { bg: "#FCE6DE", text: "#9C3417", dot: "#E4643F", label: "Tagesrätsel", icon: "trophy" };

export const ROUTINE_META = {
  morgenroutine: { bg: "#FDEBD6", text: "#9A4F08", dot: "#F08A24", label: "Morgenroutine", icon: "sunrise" },
  abendroutine: { bg: "#E2E4F3", text: "#1F255E", dot: "#2B3480", label: "Abendroutine", icon: "moon" },
};

// Farbrotation für Projekte (14.08., Nutzerin-Vorgabe: "sollen dann
// verschiedene Farben kriegen, wenn ich neue Projekte hinzufüge") — jedes
// Projekt bekommt beim Anlegen automatisch die nächste Farbe (siehe
// useZeitbloecke.js, projektHinzufuegen). Bewusst eigene, gedeckte Töne
// statt der kräftigeren KATEGORIE_META-Farben, damit Zeitblöcke sich in
// Tages-/Wochen-/Monatsübersicht klar von den festen Kategorien abheben.
export const PROJEKT_FARBEN = [
  "#4F9D5C", // Grün
  "#3F94A6", // Cyan
  "#C97B3D", // Orange
  "#B25A8C", // Mauve
  "#7A63B0", // Violett
  "#8A9A45", // Oliv
  "#A0714F", // Braun
  "#5C7AAE", // Graublau
];

export function projektFarbe(projekt) {
  if (!projekt) return KATEGORIE_META.zeitblock.dot;
  return PROJEKT_FARBEN[(projekt.farbeIndex || 0) % PROJEKT_FARBEN.length];
}

// Kompakte Zusammenfassung einer Trainingseinheit für Tagesplan-/Home-Zeilen
// (14.08., Nutzerin-Vorgabe: die volle Übungsliste als eine lange
// Kommaliste wirkte dort wie "wirrer Buchstabensalat") — nur Anzahl statt
// aller Namen/Sätze/Wiederholungen. Die volle Liste gibt's stattdessen als
// Tabelle in der antippbaren Trainings-Vorschau (siehe TrainingVorschau.jsx).
export function trainingKompaktDetail(t) {
  if (t.art === "Krafttraining" || (t.art === "Bodyweight" && (t.uebungen || t.uebungenListe || []).length > 0)) {
    const anzahl = (t.uebungen || t.uebungenListe || []).filter((u) => u.name).length;
    return anzahl ? `${anzahl} Übung${anzahl === 1 ? "" : "en"}` : "";
  }
  const teile = [];
  if (t.art === "Cardio" && t.cardioArt) teile.push(t.cardioArt);
  if (t.dauerMin) teile.push(`${t.dauerMin} min`);
  if (t.distanzKm) teile.push(`${t.distanzKm} km`);
  return teile.join(" · ");
}


// Baut die reine Datenliste eines Tages aus allen Trackern zusammen — ohne
// Bestätigen-Callbacks, damit Tagesplan und Startseite dieselbe Grundlage
// nutzen können, aber jeweils ihr eigenes Bestätigen-Verhalten anhängen.
// Einzeltag-Ausnahmen ("nur heute anders", Migration 0080) — betrifft nur
// die fünf Kategorien unten, die keine eigene Tages-Zeile in der DB haben
// (Supplemente, Hormone/Medikamente, Ernährung, Gewohnheiten, Workflows).
// Training/Zeitblöcke haben schon echte, einzelne Zeilen und brauchen das
// nicht. Gibt `null` zurück, wenn der Tag laut Ausnahme komplett entfällt
// (Aufrufer soll den Eintrag dann nicht pushen).
// `originalUhrzeit`/`ausnahmeKategorie`/`ausnahmeRefId` werden IMMER
// mitgegeben (auch ohne aktive Ausnahme) — die Bearbeiten-Karte in der
// Wochen-/Monatsübersicht braucht die echte, zugrunde liegende Uhrzeit für
// den Erledigt-Haken (der Log-Schlüssel richtet sich nach der ECHTEN
// geplanten Uhrzeit, nicht nach einer evtl. überschriebenen Anzeige-Uhrzeit)
// sowie Kategorie+refId, um beim Speichern die richtige Ausnahme zu treffen.
function wendeAusnahmeAn(item, ausnahmenNachSchluessel, kategorie, refId, tagStr) {
  const ausnahme = refId != null && ausnahmenNachSchluessel ? ausnahmenNachSchluessel.get(`${kategorie}__${refId}__${tagStr}`) : null;
  const basis = { ...item, originalUhrzeit: item.uhrzeit, ausnahmeKategorie: kategorie, ausnahmeRefId: refId };
  if (!ausnahme) return basis;
  if (ausnahme.entfaellt) return null;
  const uhrzeit = ausnahme.uhrzeit ?? item.uhrzeit;
  return {
    ...basis,
    uhrzeit,
    hour: uhrzeit ? uhrzeit.slice(0, 2) : item.hour,
    name: ausnahme.name ?? item.name,
    detail: ausnahme.detail ?? item.detail,
    ausnahmeId: ausnahme.id,
  };
}

export function buildDayItems(
  date,
  {
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan = [],
    trainingEintraege = [],
    trainingNachDatum = null,
    trainingWochenplan = [],
    gewohnheiten = [],
    gewohnheitErledigt = {},
    workflowPlaene = [],
    workflowPresets = [],
    projekte = [],
    zeitbloecke = [],
    ausnahmenNachSchluessel = null,
  }
) {
  const tagStr = toLocalISODate(date);
  const items = [];

  hormonPlan
    .filter((d) => sameDay(d.date, date))
    .forEach((d) => {
      const k = `${tagStr}__${d.name}__${d.uhrzeit}`;
      const refId = hormonDosierung?.[d.name]?.id ?? null;
      const item = wendeAusnahmeAn(
        {
          kategorie: "hormon",
          key: `h-${k}`,
          refId,
          hour: d.uhrzeit.slice(0, 2),
          uhrzeit: d.uhrzeit,
          name: d.name,
          detail: d.menge,
          done: !!hormonErledigt[k],
          raw: d,
        },
        ausnahmenNachSchluessel,
        "hormon",
        refId,
        tagStr
      );
      if (item) items.push(item);
    });

  // Supplemente kennen seit Migration 0029 dasselbe Intervall-/Uhrzeit-
  // Modell wie Medikamente und Peptide. Einträge mit konkreten Uhrzeiten
  // laufen darüber (inkl. Wochentag-/Zyklus-Prüfung); ältere Einträge ohne
  // Uhrzeiten fallen weiterhin auf die groben Tageszeiten zurück, damit sie
  // nicht aus dem Tagesplan verschwinden.
  supplemente.forEach((s) => {
    const uhrzeiten = s.uhrzeiten || [];
    if (uhrzeiten.length > 0) {
      if (!faelltAnTag(s, date, s.eigenerStart)) return;
      uhrzeiten.forEach((zeit) => {
        const k = `${tagStr}__${s.id}__${zeit}`;
        const item = wendeAusnahmeAn(
          {
            kategorie: "supplement",
            key: `s-${k}`,
            refId: s.id,
            hour: zeit.slice(0, 2),
            uhrzeit: zeit,
            name: s.name,
            detail: s.menge || s.hinweis,
            done: !!supplementErledigt[k],
            raw: s,
          },
          ausnahmenNachSchluessel,
          "supplement",
          s.id,
          tagStr
        );
        if (item) items.push(item);
      });
      return;
    }
    (s.tageszeiten || []).forEach((zeit) => {
      const k = `${tagStr}__${s.id}__${zeit}`;
      const item = wendeAusnahmeAn(
        {
          kategorie: "supplement",
          key: `s-${k}`,
          refId: s.id,
          hour: TAGESZEIT_STUNDE[zeit] || null,
          uhrzeit: zeit,
          name: s.name,
          detail: s.hinweis,
          done: !!supplementErledigt[k],
          raw: s,
        },
        ausnahmenNachSchluessel,
        "supplement",
        s.id,
        tagStr
      );
      if (item) items.push(item);
    });
  });

  // Mahlzeiten erscheinen nur an den Wochentagen, denen sie im
  // Ernährungsplan tatsächlich zugewiesen wurden (meal_wochenplan) — nicht
  // mehr bedingungslos an jedem Tag. `meals.tageszeiten` dient nur noch als
  // Anzeige-Vorbelegung, nicht mehr als Quelle für "wann".
  {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    mealWochenplan
      .filter((w) => w.wochentag === wochentagLabel)
      .forEach((w) => {
        const m = mahlzeiten.find((mm) => mm.id === w.mealId);
        if (!m) return;
        const zeit = w.tageszeit || "Mahlzeit";
        const k = `${tagStr}__${m.id}__${zeit}`;
        // Ausnahme-refId ist die Wochenplan-Zuweisung (w.id), nicht die
        // Mahlzeit selbst (m.id) — dieselbe Mahlzeit kann an mehreren Tagen
        // zu unterschiedlichen Zeiten geplant sein, item.refId bleibt m.id
        // (wird u. a. von toggleMahlzeitErledigt gebraucht).
        const item = wendeAusnahmeAn(
          {
            kategorie: "mahlzeit",
            key: `m-${w.id}`,
            refId: m.id,
            hour: w.uhrzeit ? w.uhrzeit.slice(0, 2) : TAGESZEIT_STUNDE[zeit] || null,
            uhrzeit: w.uhrzeit || zeit,
            logZeit: zeit,
            name: m.name,
            detail: m.hinweis,
            done: !!mahlzeitErledigt[k],
            raw: m,
          },
          ausnahmenNachSchluessel,
          "mahlzeit",
          w.id,
          tagStr
        );
        if (item) items.push(item);
      });
  }

  // Performance-Fix (12.09.): trainingNachDatum (Map, siehe useTrainingData.js)
  // spart den vollen Scan der unbegrenzt wachsenden Trainingshistorie bei
  // jedem Aufruf — trainingEintraege bleibt als Fallback für Aufrufer, die
  // die Map (noch) nicht mitgeben (z. B. wochenprotokollSnapshot.js).
  const heutigeTrainings = trainingNachDatum ? trainingNachDatum.get(tagStr) || [] : trainingEintraege.filter((t) => t.datum === tagStr);
  heutigeTrainings.forEach((t) => {
    items.push({
      kategorie: "training",
      key: `t-${t.id}`,
      refId: t.id,
      hour: t.uhrzeit ? t.uhrzeit.slice(0, 2) : null,
      uhrzeit: t.uhrzeit || "",
      name: t.name ? `${t.art} · ${t.name}` : t.art,
      detail: trainingKompaktDetail(t),
      done: !!t.erledigt,
      raw: t,
    });
  });

  // Noch kein echter Eintrag für heute? Dann zeigt der Wochenplan (falls für
  // diesen Wochentag etwas hinterlegt ist) je Einheit ein virtuelles, noch
  // nicht gespeichertes Training — wird erst beim Antippen zu einer echten
  // Zeile. Mehrere Einheiten am selben Tag zu unterschiedlichen Uhrzeiten
  // sind möglich (siehe WochenplanEditor).
  if (heutigeTrainings.length === 0) {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    trainingWochenplan
      .filter((w) => w.wochentag === wochentagLabel)
      .forEach((zuweisung) => {
        const uhrzeit = zuweisung.uhrzeit || "";
        const anzahlUebungen = (zuweisung.uebungenListe || []).filter((u) => u.name).length;
        const detailTeile = [
          zuweisung.intervallArbeitSek ? `⏱ ${zuweisung.intervallArbeitSek}s/${zuweisung.intervallPauseSek || 0}s × ${zuweisung.runden || 1}` : "",
          anzahlUebungen ? `${anzahlUebungen} Übung${anzahlUebungen === 1 ? "" : "en"}` : "",
          zuweisung.warmup?.aktiv ? `Warm-up${zuweisung.warmup.dauerMin ? ` ${zuweisung.warmup.dauerMin} Min.` : ""}` : "",
          zuweisung.cooldown?.aktiv ? `Cool-down${zuweisung.cooldown.dauerMin ? ` ${zuweisung.cooldown.dauerMin} Min.` : ""}` : "",
        ].filter(Boolean);
        items.push({
          kategorie: "training",
          key: `t-virtual-${tagStr}-${zuweisung.id}`,
          refId: null,
          hour: uhrzeit ? uhrzeit.slice(0, 2) : null,
          uhrzeit,
          name: zuweisung.name || (zuweisung.arten?.length ? zuweisung.arten.join(" + ") : "Training"),
          detail: detailTeile.length ? detailTeile.join(" · ") : "Laut Wochenplan",
          done: false,
          raw: {
            virtuell: true,
            datum: tagStr,
            name: zuweisung.name || "",
            arten: zuweisung.arten,
            uhrzeit,
            uebungenListe: zuweisung.uebungenListe,
            warmup: zuweisung.warmup,
            cooldown: zuweisung.cooldown,
            intervallArbeitSek: zuweisung.intervallArbeitSek,
            intervallPauseSek: zuweisung.intervallPauseSek,
            runden: zuweisung.runden,
          },
        });
      });
  }

  gewohnheiten.forEach((g) => {
    const k = `${tagStr}__${g.id}`;
    const item = wendeAusnahmeAn(
      {
        kategorie: "gewohnheit",
        key: `g-${k}`,
        refId: g.id,
        hour: g.uhrzeit ? g.uhrzeit.slice(0, 2) : null,
        uhrzeit: g.uhrzeit || "",
        name: g.name,
        detail: "",
        done: !!gewohnheitErledigt[k],
        raw: g,
      },
      ausnahmenNachSchluessel,
      "gewohnheit",
      g.id,
      tagStr
    );
    if (item) items.push(item);
  });

  // Workflows (15.08., Nutzerin-Vorgabe: "auch in meinen Tagesplan mit
  // einarbeiten, Tage und Uhrzeiten zuordnen, auf eine bestimmte Zeit oder
  // einen Zeitraum oder unbestimmte Zeit") — wochentage und Gültigkeits-
  // Zeitraum sind unabhängig kombinierbar (siehe Migration 0062): leere
  // wochentage gilt wie bei Supplementen als "jeden Tag", ein gesetztes
  // gueltig_von/-bis grenzt den Zeitraum zusätzlich ein, keins von beiden
  // gesetzt heißt "unbestimmt". Reiner Kalendereintrag ohne Abhaken (wie
  // zeitblock) — Start passiert im Routinen-Bereich (WorkflowTimer.jsx).
  {
    const wochentagLabel = GETDAY_TO_LABEL[date.getDay()];
    workflowPlaene
      .filter((p) => p.aktiv !== false)
      .filter((p) => !p.wochentage?.length || p.wochentage.includes(wochentagLabel))
      .filter((p) => !p.gueltigVon || tagStr >= p.gueltigVon)
      .filter((p) => !p.gueltigBis || tagStr <= p.gueltigBis)
      .forEach((p) => {
        const preset = workflowPresets.find((ps) => ps.id === p.presetId);
        if (!preset) return;
        const item = wendeAusnahmeAn(
          {
            kategorie: "workflow",
            key: `w-${tagStr}-${p.id}`,
            refId: p.id,
            hour: p.uhrzeit ? p.uhrzeit.slice(0, 2) : null,
            uhrzeit: p.uhrzeit || "",
            name: preset.name,
            detail: `${preset.arbeitMin} Min. Arbeit · ${preset.pauseMin} Min. Pause`,
            done: false,
            raw: { ...p, preset },
          },
          ausnahmenNachSchluessel,
          "workflow",
          p.id,
          tagStr
        );
        if (item) items.push(item);
      });
  }

  // Projekte/Zeitblöcke (14.08., Nutzerin-Vorgabe) — farbig je Projekt statt
  // einer festen Kategorie-Farbe, siehe PROJEKT_FARBEN/projektFarbe() oben.
  zeitbloecke
    .filter((z) => z.datum === tagStr)
    .forEach((z) => {
      const projekt = projekte.find((p) => p.id === z.projektId);
      items.push({
        kategorie: "zeitblock",
        key: `z-${z.id}`,
        refId: z.id,
        hour: z.startUhrzeit.slice(0, 2),
        uhrzeit: z.startUhrzeit,
        name: z.titel || projekt?.name || "Zeitblock",
        detail: [z.titel && projekt ? projekt.name : "", z.endUhrzeit ? `bis ${z.endUhrzeit} Uhr` : ""].filter(Boolean).join(" · "),
        done: false,
        farbe: projektFarbe(projekt),
        raw: z,
      });
    });

  items.sort((a, b) => {
    const ha = a.hour ?? "99";
    const hb = b.hour ?? "99";
    if (ha !== hb) return ha.localeCompare(hb);
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });
  return items;
}
