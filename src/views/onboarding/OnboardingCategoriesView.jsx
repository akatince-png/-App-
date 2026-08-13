import React, { useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextInput, TextArea, Stepper } from "../../ui/primitives";
import ZieldauerField from "../../ui/ZieldauerField";
import ErinnerungField from "../../ui/ErinnerungField";
import ZeitErinnerungenCard from "../../ui/ZeitErinnerungenCard";
import WochenplanEditor from "../../ui/WochenplanEditor";
import TimeWheelField from "../../ui/TimeWheelField";
import NumberWheelField from "../../ui/NumberWheelField";
import DosierungFields from "../../ui/DosierungFields";
import { SignedPhoto } from "../../ui/SignedPhoto";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { accent, accentDark, accentSoft, cardBorder, danger, textMuted } from "../../ui/theme";
import { EINNAHMEARTEN, MEDIKAMENTE_KATEGORIEN, PEPTIDE_OPTIONEN, WOCHENTAGE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { CATEGORY_STEPS } from "./categorySteps";
import { useT } from "../../i18n/translate";
import { toLocalISODate } from "../../utils/dates";
import KiChat from "../../ui/KiChat";
import { AIService } from "../../services/aiService";
import { getCoachName } from "../../utils/coachStorage";

// CATEGORY_STEPS-Schlüssel → KATEGORIE_META-Schlüssel (weichen an einigen
// Stellen vom Schritt-Namen ab: "ernaehrung"→"mahlzeit",
// "gewohnheiten"→"gewohnheit", "supplemente"→"supplement",
// "medikamente"→"hormon", "peptide"→"peptid") — steuert die Farbe von
// <Shell bereich=…> für den jeweils aktuellen Kategorie-Schritt.
const SCHRITT_ZU_KATEGORIE = {
  schlaf: "schlaf",
  hydration: "hydration",
  tageslicht: "tageslicht",
  ernaehrung: "mahlzeit",
  training: "training",
  gewohnheiten: "gewohnheit",
  supplemente: "supplement",
  medikamente: "hormon",
  peptide: "peptid",
};

// Systemprompt je Kategorie für den Coach-Begleitungs-Chat (siehe
// onUebernehmenKategorie() weiter unten) — bewusst kurz und auf die
// jeweiligen fehlenden Angaben fokussiert, statt eines generischen Prompts
// für alle 9 Bereiche.
const KATEGORIE_COACH_PROMPTS = {
  gewohnheiten:
    "Du hilfst dabei, eine neue Gewohnheit einzurichten. Frag nach, was noch fehlt: Name, Menge/Umfang, feste Uhrzeit oder Zeitfenster, und ein Zieltage-Ziel (z. B. 21 oder 66 Tage). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  schlaf:
    "Du hilfst dabei, den gewünschten Schlafrhythmus einzurichten. Frag nach der üblichen Bettzeit und Aufwachzeit. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  hydration:
    "Du hilfst dabei, ein tägliches Trinkziel einzurichten. Frag nach, wie viel die Person aktuell trinkt und was ein realistisches Tagesziel wäre. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  tageslicht:
    "Du hilfst dabei, ein tägliches Tageslicht-/Freiluft-Ziel in Minuten einzurichten. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  ernaehrung:
    "Du hilfst dabei, eine Mahlzeit für den Wochenplan einzurichten. Frag nach Name, Zutaten, an welchen Wochentagen sie stattfindet, und der Uhrzeit. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  training:
    "Du hilfst dabei, einen Trainingsplan für die Woche einzurichten. Frag nach, wenn wichtige Angaben fehlen (z. B. Erfahrung, verfügbare Tage, Ziele), mach konkrete Vorschläge. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  supplemente:
    "Du hilfst dabei, ein neues Supplement einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart, und der Rhythmus (z. B. täglich, alle X Tage, bestimmte Wochentage, oder Zyklus wie 'X Tage nehmen, Y Tage Pause') sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  medikamente:
    "Du hilfst dabei, ein neues Medikament oder Hormon einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart, Kategorie, und der Rhythmus sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  peptide:
    "Du hilfst dabei, ein neues Peptid einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart, und der Rhythmus sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
};

// Erste (vorgelesene) Nachricht je Kategorie — bewusst schon die konkrete,
// zur Substanz/Einnahmeart passende Frage statt eines generischen "Was
// möchtest du einrichten?" (Nutzerinnen-Vorgabe, 28.07.: bei Wasser soll
// gefragt werden "wie viel hast du bisher getrunken, was ist dein
// Tagesziel", nicht irgendwas Allgemeines).
const KATEGORIE_EINLEITUNG = {
  gewohnheiten: (coachName) => `Hi, ich bin ${coachName}! Welche Gewohnheit möchtest du aufbauen, und warum ist sie dir wichtig?`,
  schlaf: (coachName) => `Hi, ich bin ${coachName}! Wann gehst du normalerweise ins Bett, und wann willst du aufwachen?`,
  hydration: (coachName) => `Hi, ich bin ${coachName}! Wie viel trinkst du aktuell am Tag, und was wäre ein gutes Tagesziel für dich?`,
  tageslicht: (coachName) => `Hi, ich bin ${coachName}! Wie viel Zeit verbringst du aktuell draußen bei Tageslicht, und was wäre ein realistisches Ziel pro Tag?`,
  ernaehrung: (coachName) => `Hi, ich bin ${coachName}! Erzähl mir von einer Mahlzeit, die du regelmäßig isst — was ist drin, an welchen Tagen, und um wie viel Uhr?`,
  training: (coachName) => `Hi, ich bin ${coachName}! Wie sieht dein Training aktuell aus, und was schwebt dir für den Plan vor?`,
  supplemente: (coachName) => `Hi, ich bin ${coachName}! Welches Supplement möchtest du eintragen? Sag mir Dosierung, Einnahmeart und wann du es nimmst.`,
  medikamente: (coachName) => `Hi, ich bin ${coachName}! Welches Medikament oder Hormon möchtest du eintragen? Sag mir Dosierung, Einnahmeart und wann du es nimmst.`,
  peptide: (coachName) => `Hi, ich bin ${coachName}! Welches Peptid möchtest du eintragen? Sag mir Dosierung, Einnahmeart und wann du es nimmst.`,
};

const ZIEL_LEER = { modus: "offen", wochen: "" };
const MULTI_ADD_KEYS = ["gewohnheiten", "ernaehrung", "supplemente", "medikamente"];
// Kategorien, für die vor der zukünftigen Zielplanung erst der aktuelle
// Ist-Zustand erfragt wird (Peptide/Hormone/Medikamente/Supplemente bewusst
// ausgenommen — dort deckt Grund/Ziel des Hauptprotokolls das schon ab).
// Die Antworten landen in categoryZiele[kategorie].istZustand und werden auf
// dem Abschluss-Screen neben Ziel und Plan angezeigt.
export const ISTZUSTAND_FRAGEN = {
  schlaf: [{ key: "aktuell", frage: "Wie ist dein aktueller Schlaf?", placeholder: "z. B. unruhig, zu wenig, wache oft auf …" }],
  hydration: [
    { key: "menge", frage: "Wie viel trinkst Du aktuell am Tag?", placeholder: "z. B. ca. 1 Liter" },
    { key: "getraenke", frage: "Was trinkst Du außer Wasser?", placeholder: "z. B. Kaffee, Saft, Limonade …" },
  ],
  ernaehrung: [{ key: "aktuell", frage: "Wie ernährst Du dich aktuell?", placeholder: "z. B. unregelmäßig, viel Fast Food …" }],
  training: [{ key: "aktuell", frage: "Wie sieht dein aktuelles Training/Sport aus?", placeholder: "z. B. 1x pro Woche, gar nicht, unregelmäßig …" }],
  gewohnheiten: [
    { key: "warum", frage: "Warum möchtest Du diese Gewohnheit aufbauen?", placeholder: "" },
    { key: "schwierigkeiten", frage: "Hast Du grundsätzlich Schwierigkeiten mit Gewohnheiten?", placeholder: "" },
    { key: "schwer", frage: "Welche Arten von Gewohnheiten fallen Dir schwer?", placeholder: "" },
    { key: "leicht", frage: "Welche Arten von Gewohnheiten fallen Dir leicht?", placeholder: "" },
  ],
};
const MULTI_ADD_ISTZUSTAND_KEYS = ["gewohnheiten", "ernaehrung"];

// Startwerte für die geteilte Dosierungs-Maske (Supplemente/Medikamente) —
// "täglich um 20:00" ist der häufigste Fall und lässt sich mit einem Tipp
// ändern.
const LEERE_DOSIERUNG = {
  menge: "",
  intervallTyp: "fixed",
  intervallDays: 1,
  customDays: "",
  onDays: "",
  offDays: "",
  weekdays: [],
  uhrzeiten: ["20:00"],
  eigenerStart: "",
};

// DosierungFields meldet "intervallPreset" als kombinierte Änderung
// (Modus + Tage in einem Schritt); alle anderen Felder gehen 1:1 durch.
function anwendenDosierungsFeld(prev, feld, val) {
  if (feld === "intervallPreset") return { ...prev, intervallTyp: "fixed", intervallDays: val };
  return { ...prev, [feld]: val };
}

// Dieselbe Prüfung wie intervallGueltig() für Peptide: die Modi mit
// Zusatzangaben (alle X Tage / Zyklus / feste Wochentage) sind erst
// vollständig, wenn diese Angaben auch ausgefüllt sind.
function dosierungVollstaendig(d) {
  const typ = d?.intervallTyp || "fixed";
  if (typ === "custom") return !!d.customDays;
  if (typ === "cycle") return !!d.onDays && !!d.offDays;
  if (typ === "weekdays") return (d.weekdays || []).length > 0;
  return true;
}

const neuerSchlafblock = (wochentage) => ({
  id: Math.random().toString(36).slice(2),
  wochentage,
  bettzeit: "22:30",
  aufwachzeit: "06:30",
});
const neueZutat = () => ({ name: "", menge: "" });

function berechneSchlafstunden(bett, auf) {
  if (!bett || !auf) return "–";
  const [bh, bm] = bett.split(":").map(Number);
  const [ah, am] = auf.split(":").map(Number);
  let minuten = ah * 60 + am - (bh * 60 + bm);
  if (minuten <= 0) minuten += 24 * 60;
  return Math.round((minuten / 60) * 10) / 10;
}

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// Kompakter "+"-Button im selben Stil wie an anderen Stellen der App
// (z. B. DosierungFields "+ weitere Uhrzeit") — hier mehrfach für
// Schlafblöcke, Hydration-Erinnerungszeiten und Zutaten wiederverwendet.
function AddZeile({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: 10,
        border: "1px dashed #C7D8D2",
        background: "transparent",
        color: disabled ? textMuted : accentDark,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        marginBottom: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

// Ein Kurz-Screen pro "Pläne"-Bereich, in der Reihenfolge natürlichster bis
// unnatürlichster/klinischster Tracking-Punkt (Schlaf, Hydration, Ernährung,
// Training, Gewohnheiten, Supplemente, Medikamente, Peptid-Plan ganz am
// Ende) — jeweils dieselbe "Jetzt einrichten?"-Gate-Seite und danach die
// Felder des Bereichs direkt auf derselben Seite. Auch der Peptid-Plan, der
// früher in einen eigenen fünfstufigen Assistenten abgezweigt ist: Auswahl
// und Dosierung stehen jetzt gemeinsam hier, damit Peptide sich wie jede
// andere Kategorie anfühlen statt wie eine App in der App.
//
// Vier Bereiche (Gewohnheiten/Ernährung/Supplemente/Medikamente) erlauben
// mehrere Einträge nacheinander, statt nach dem ersten sofort zum nächsten
// Bereich zu springen — "+ Hinzufügen" bleibt auf der Seite und sammelt eine
// "bereits hinzugefügt"-Liste, "Weiter" schließt den Bereich bewusst ab.
export default function OnboardingCategoriesView({ onFinished, onCancel, onBackToStart }) {
  const {
    gewohnheitHinzufuegen,
    hydrationZielMl,
    hydrationZielSetzen,
    tageslichtZielMinuten,
    tageslichtZielSetzen,
    mahlzeitHinzufuegen,
    wochenplanMahlzeitSetzen,
    supplementHinzufuegen,
    hormonHinzufuegen,
    setCategoryZiel,
    trainingWochenplan,
    wochenplanHinzufuegen,
    wochenplanEntfernen,
    erinnerungen,
    setErinnerung,
    aktivesHauptprotokoll,
    teilprotokollSpeichern,
    peptide,
    togglePeptid,
    einnahmeart,
    setEinnahmeart,
    addCustomPreparat,
    dosierung,
    setDose,
    setPeptidFoto,
    intervallGueltig,
  } = useAppData();
  const { t, tLabel } = useT();

  const [index, setIndex] = useState(0);
  const [modus, setModus] = useState(null); // null | "jetzt"
  const [ziel, setZiel] = useState(ZIEL_LEER);
  const [eingerichtet, setEingerichtet] = useState([]); // [{ key, icon, label }]
  const [hinzugefuegt, setHinzugefuegt] = useState([]); // Namen, die in diesem Bereich schon gespeichert wurden
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Eigenes Startdatum je Teilprotokoll (weicht optional vom Hauptprotokoll ab)
  const [eigenesStartdatumAktiv, setEigenesStartdatumAktiv] = useState(false);
  const [eigenesStartdatum, setEigenesStartdatum] = useState(toLocalISODate(new Date()));

  // Ist-Zustand-Antworten des aktuellen Schritts (siehe ISTZUSTAND_FRAGEN)
  const [istZustand, setIstZustand] = useState({});
  const setIstZustandFeld = (feld, val) => setIstZustand((prev) => ({ ...prev, [feld]: val }));

  // Gewohnheiten
  const [gName, setGName] = useState("");
  const [gMenge, setGMenge] = useState("");
  const [gUhrzeit, setGUhrzeit] = useState("");
  const [gUrzeitModus, setGUrzeitModus] = useState("fest"); // "fest" | "fenster"
  const [gUrzeitVon, setGUrzeitVon] = useState("");
  const [gUrzeitBis, setGUrzeitBis] = useState("");
  const [gZielTage, setGZielTage] = useState("");

  // Schlaf — mehrere Blöcke, jeweils mit eigenen Wochentagen (z. B. Woche
  // anders als Wochenende), damit auch als Wecker nutzbar. Zusätzlich
  // Intervall-Modi für mehr Flexibilität wie bei Supplementen/Medikamenten.
  const [schlafIntervallTyp, setSchlafIntervallTyp] = useState("weekdays"); // "fixed" | "weekdays"
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);

  // Hydration
  // Bewusst leer statt mit dem bestehenden Ziel vorbelegt — bei "Neues
  // Protokoll" (+) sollen die Onboarding-Masken frisch wirken. Bleibt das
  // Feld leer, greift beim Speichern trotzdem der bisherige Wert (siehe
  // speichernUndWeiter), damit ein reines Durchklicken nichts überschreibt.
  const [hydrationMl, setHydrationMl] = useState("");

  // Tageslicht — analog zu Hydration bewusst leer statt vorbelegt, siehe
  // Kommentar oben.
  const [tageslichtMinuten, setTageslichtMinuten] = useState("");

  // Ernährung — Wochentage (an welchen Tagen gilt diese Mahlzeit) + eine
  // einzelne Uhrzeit statt der pauschalen Morgens/Mittags/Abends-Auswahl,
  // damit sie später wie jede andere Mahlzeit über meal_wochenplan
  // tagesgenau im Tagesplan erscheint (siehe wochenplanMahlzeitSetzen).
  // Zusätzlich nun auch Intervall-Modi (täglich, bestimmte Wochentage) für
  // mehr Flexibilität wie bei Supplementen/Medikamenten.
  const [mahlName, setMahlName] = useState("");
  const [mahlIntervallTyp, setMahlIntervallTyp] = useState("weekdays"); // "fixed" | "weekdays"
  const [mahlTage, setMahlTage] = useState([...WOCHENTAGE]);
  const [mahlUhrzeit, setMahlUhrzeit] = useState("08:00");
  const [mahlZutaten, setMahlZutaten] = useState([neueZutat()]);
  const [mahlzeitenListe, setMahlzeitenListe] = useState([]); // bereits in diesem Durchlauf hinzugefügte Mahlzeiten
  const [ernaehrungAnsicht, setErnaehrungAnsicht] = useState("alle");

  // Supplemente und Medikamente teilen sich dieselbe Dosierungs-Maske wie
  // Peptide (DosierungFields): Menge, Intervall inkl. fester Wochentage,
  // konkrete Uhrzeiten, eigenes Startdatum. Ohne Uhrzeit lässt sich keine
  // Erinnerung timen — deshalb hier dieselbe Detailtiefe wie bei Peptiden
  // statt der früheren groben Morgens/Mittags/Abends-Auswahl.
  const [suppName, setSuppName] = useState("");
  const [suppEinnahmeart, setSuppEinnahmeart] = useState("Kapsel");
  const [suppDosierung, setSuppDosierung] = useState(LEERE_DOSIERUNG);

  // Medikamente
  const [medName, setMedName] = useState("");
  const [medKategorie, setMedKategorie] = useState("Hormone");
  const [medEinnahmeart, setMedEinnahmeart] = useState("Injektion");
  const [medDosierung, setMedDosierung] = useState(LEERE_DOSIERUNG);

  const setSuppDosierungFeld = (feld, val) => setSuppDosierung((prev) => anwendenDosierungsFeld(prev, feld, val));
  const setMedDosierungFeld = (feld, val) => setMedDosierung((prev) => anwendenDosierungsFeld(prev, feld, val));

  // Peptid-Plan — Auswahl und Dosierung stehen jetzt gemeinsam auf dieser
  // Seite (früher: eigener fünfstufiger Assistent), deshalb hier nur noch
  // der Entwurf für "eigenes Peptid hinzufügen".
  const [customPeptidName, setCustomPeptidName] = useState("");
  const [customPeptidArt, setCustomPeptidArt] = useState("Injektion");

  const step = CATEGORY_STEPS[index];
  const istLetzter = index === CATEGORY_STEPS.length - 1;
  const istMultiAdd = MULTI_ADD_KEYS.includes(step.key);

  const resetEingabeFelder = () => {
    setGName("");
    setGMenge("");
    setGUhrzeit("");
    setGUrzeitModus("fest");
    setGUrzeitVon("");
    setGUrzeitBis("");
    setGZielTage("");
    setSchlafIntervallTyp("weekdays");
    setSchlafBloecke([neuerSchlafblock([...WOCHENTAGE])]);
    setHydrationMl("");
    setTageslichtMinuten("");
    setMahlName("");
    setMahlIntervallTyp("weekdays");
    setMahlTage([...WOCHENTAGE]);
    setMahlUhrzeit("08:00");
    setMahlZutaten([neueZutat()]);
    setSuppName("");
    setSuppEinnahmeart("Kapsel");
    setSuppDosierung(LEERE_DOSIERUNG);
    setMedName("");
    setMedKategorie("Hormone");
    setMedEinnahmeart("Injektion");
    setMedDosierung(LEERE_DOSIERUNG);
    setCustomPeptidName("");
    setCustomPeptidArt("Injektion");
    setEigenesStartdatumAktiv(false);
    setEigenesStartdatum(toLocalISODate(new Date()));
    setIstZustand({});
  };

  const resetLokal = () => {
    setModus(null);
    setZiel(ZIEL_LEER);
    setError(null);
    setHinzugefuegt([]);
    setMahlzeitenListe([]);
    setErnaehrungAnsicht("alle");
    resetEingabeFelder();
  };

  const weiter = (wurdeEingerichtet) => {
    // Gewohnheiten/Ernährung speichern ihre Kategorie-Zieldauer nirgendwo
    // sonst (Mehrfach-Hinzufügen statt einer einzelnen setCategoryZiel-
    // Speicherung wie bei Schlaf/Hydration/Training) — deshalb hier die
    // Ist-Zustand-Antworten separat sichern, statt in speichernUndWeiter.
    if (wurdeEingerichtet && MULTI_ADD_ISTZUSTAND_KEYS.includes(step.key)) {
      const hatAntwort = Object.values(istZustand).some((v) => (v || "").trim());
      if (hatAntwort) setCategoryZiel(step.key, { istZustand });
    }
    const ohneAktuellen = eingerichtet.filter((e) => e.key !== step.key);
    const naechsteListe = wurdeEingerichtet ? [...ohneAktuellen, { key: step.key, icon: step.icon, label: step.label }] : ohneAktuellen;
    // Teilprotokoll-Zuordnung (aktiv/inaktiv, eigenes Startdatum, Laufzeit)
    // — eine Zeile je Kategorie unter dem aktuellen Hauptprotokoll, egal ob
    // gerade eingerichtet oder übersprungen wurde.
    if (aktivesHauptprotokoll?.id) {
      teilprotokollSpeichern(aktivesHauptprotokoll.id, step.key, {
        aktiv: wurdeEingerichtet,
        eigenerStartdatum: eigenesStartdatumAktiv ? eigenesStartdatum : null,
        laufzeitWochen: ziel.modus === "wochen" && ziel.wochen ? Number(ziel.wochen) : null,
      });
    }
    if (istLetzter) {
      onFinished(naechsteListe);
      return;
    }
    setEingerichtet(naechsteListe);
    setIndex((i) => i + 1);
    resetLokal();
  };

  const zurueck = () => {
    // Vom ersten Kategorie-Schritt aus zurück in den vorgelagerten Teil des
    // Onboardings (Laborwerte → Profil → Ziel & Grund), statt hier in einer
    // Sackgasse zu enden.
    if (index === 0) {
      onBackToStart?.();
      return;
    }
    setIndex((i) => i - 1);
    resetLokal();
  };

  // ---------------------------------------------------------------------
  // Schlaf: Wochentage je Block; ein Tag kann nur einem Block angehören,
  // damit klar ist, welche Bett-/Aufwachzeit an welchem Tag als Wecker gilt.
  // ---------------------------------------------------------------------
  const tageBelegtVonAnderen = (idx) => schlafBloecke.filter((_, i) => i !== idx).flatMap((b) => b.wochentage);
  const verfuegbareTage = (idx) => WOCHENTAGE.filter((tag) => !tageBelegtVonAnderen(idx).includes(tag));

  const toggleBlockTag = (idx, tag) => {
    setSchlafBloecke((prev) => prev.map((b, i) => (i === idx ? { ...b, wochentage: toggleInArray(b.wochentage, tag) } : b)));
  };
  const blockAlleUmschalten = (idx) => {
    const verfuegbar = verfuegbareTage(idx);
    setSchlafBloecke((prev) =>
      prev.map((b, i) => {
        if (i !== idx) return b;
        const vollstaendig = verfuegbar.length > 0 && verfuegbar.every((t) => b.wochentage.includes(t));
        return { ...b, wochentage: vollstaendig ? [] : [...verfuegbar] };
      })
    );
  };
  const setBlockFeld = (idx, feld, val) => {
    setSchlafBloecke((prev) => prev.map((b, i) => (i === idx ? { ...b, [feld]: val } : b)));
  };
  const schlafblockHinzufuegen = () => {
    const belegt = schlafBloecke.flatMap((b) => b.wochentage);
    const frei = WOCHENTAGE.filter((t) => !belegt.includes(t));
    if (frei.length === 0) return;
    setSchlafBloecke((prev) => [...prev, neuerSchlafblock(frei)]);
  };
  const schlafblockEntfernen = (idx) => {
    setSchlafBloecke((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };
  const alleTageVergeben = WOCHENTAGE.every((t) => schlafBloecke.some((b) => b.wochentage.includes(t)));

  // Hydration/Tageslicht/Schlaf haben ein eigenes Erinnerungszeiten-Feld
  // (ZeitErinnerungenCard) statt nur eines Ja/Nein-Schalters — dieser
  // generische Handler bleibt nur noch für die übrigen Kategorien relevant.
  const handleErinnerungChange = (v) => setErinnerung(step.key, v);

  // ---------------------------------------------------------------------
  // Ernährung: Zutaten-Zeilen wie im vollen Ernährungsplan.
  // ---------------------------------------------------------------------
  const zutatAendern = (i, feld, val) => setMahlZutaten((prev) => prev.map((z, idx) => (idx === i ? { ...z, [feld]: val } : z)));
  const zutatHinzufuegen = () => setMahlZutaten((prev) => [...prev, neueZutat()]);
  const zutatEntfernen = (i) => setMahlZutaten((prev) => prev.filter((_, idx) => idx !== i));

  // ---------------------------------------------------------------------
  // Speichern: einmalige Bereiche (Schlaf/Hydration/Training) springen nach
  // dem Speichern direkt weiter; Listen-Bereiche (Gewohnheiten/Ernährung/
  // Supplemente/Medikamente) bleiben auf der Seite und sammeln weitere
  // Einträge, bis "Weiter" bewusst angetippt wird.
  // ---------------------------------------------------------------------
  const speichernUndWeiter = async () => {
    setError(null);
    setSaving(true);
    let result = { ok: true };

    if (step.key === "schlaf") {
      setCategoryZiel("schlaf", {
        bloecke: schlafBloecke.map(({ wochentage, bettzeit, aufwachzeit }) => ({ wochentage, bettzeit, aufwachzeit })),
        modus: ziel.modus,
        wochen: ziel.wochen,
        istZustand,
      });
    } else if (step.key === "hydration") {
      // Leer gelassen (bewusst nicht vorbefüllt) heißt "unverändert lassen",
      // nicht "auf 0 setzen" — sonst würde reines Durchklicken das
      // bestehende Ziel überschreiben.
      const neuesZiel = hydrationMl.trim() === "" ? hydrationZielMl : Math.max(0, Number(hydrationMl) || 0);
      await hydrationZielSetzen(neuesZiel);
      setCategoryZiel("hydration", { modus: ziel.modus, wochen: ziel.wochen, istZustand });
    } else if (step.key === "tageslicht") {
      const neuesZiel = tageslichtMinuten.trim() === "" ? tageslichtZielMinuten : Math.max(0, Number(tageslichtMinuten) || 0);
      await tageslichtZielSetzen(neuesZiel);
      setCategoryZiel("tageslicht", { modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "training") {
      // Der Wochenplan selbst wird schon beim Antippen der Pillen direkt
      // gespeichert (wochenplanHinzufuegen/-Entfernen, wie in TrainingView) —
      // hier wird nur noch die Zieldauer festgehalten.
      setCategoryZiel("training", { modus: ziel.modus, wochen: ziel.wochen, istZustand });
    } else if (step.key === "peptide") {
      // Peptid-Auswahl und Dosierung wurden bereits beim Antippen
      // gespeichert — hier nur noch prüfen, dass überhaupt etwas gewählt
      // wurde und die Intervalle vollständig sind.
      if (peptide.length === 0) {
        setError(t("onboarding.error.peptid"));
        setSaving(false);
        return;
      }
      const unvollstaendig = peptide.find((p) => !intervallGueltig(p));
      if (unvollstaendig) {
        setError(t("onboarding.error.intervall", { peptid: unvollstaendig }));
        setSaving(false);
        return;
      }
      setCategoryZiel("peptide", { modus: ziel.modus, wochen: ziel.wochen });
    }

    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || t("onboarding.error.speichern"));
      return;
    }
    weiter(true);
  };

  const hinzufuegen = async () => {
    setError(null);
    setSaving(true);
    let result = { ok: true };
    let label = "";

    if (step.key === "gewohnheiten") {
      if (!gName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      label = gName.trim();
      result = await gewohnheitHinzufuegen({
        name: gName,
        icon: "🌱",
        menge: gMenge,
        uhrzeit: gUrzeitModus === "fest" ? gUhrzeit : "",
        urzeitVon: gUrzeitModus === "fenster" ? gUrzeitVon : "",
        urzeitBis: gUrzeitModus === "fenster" ? gUrzeitBis : "",
        zielTage: gZielTage ? Number(gZielTage) : null,
      });
      if (result?.ok) {
        setGName("");
        setGMenge("");
        setGUhrzeit("");
        setGZielTage("");
      }
    } else if (step.key === "ernaehrung") {
      if (!mahlName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      const tageZuweisen = mahlIntervallTyp === "fixed" ? [...WOCHENTAGE] : mahlTage;
      if (tageZuweisen.length === 0) {
        setError(t("onboarding.error.wochentag"));
        setSaving(false);
        return;
      }
      label = mahlName.trim();
      result = await mahlzeitHinzufuegen({ name: mahlName, tageszeiten: [], hinweis: "", zutaten: mahlZutaten });
      if (result?.ok) {
        const zuweisungen = await Promise.all(
          tageZuweisen.map((tag) => wochenplanMahlzeitSetzen(tag, { mealId: result.meal.id, tageszeit: null, uhrzeit: mahlUhrzeit }))
        );
        const fehlgeschlagen = zuweisungen.find((z) => !z?.ok);
        if (fehlgeschlagen) {
          result = { ok: false, error: fehlgeschlagen.error || t("onboarding.error.speichern") };
        } else {
          setMahlzeitenListe((prev) => [
            ...prev,
            { name: mahlName.trim(), tage: tageZuweisen, uhrzeit: mahlUhrzeit, zutaten: mahlZutaten.filter((z) => z.name.trim()) },
          ]);
          setMahlName("");
          setMahlTage([...WOCHENTAGE]);
          setMahlUhrzeit("08:00");
          setMahlZutaten([neueZutat()]);
          setMahlIntervallTyp("weekdays");
        }
      }
    } else if (step.key === "supplemente") {
      if (!suppName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      if (!dosierungVollstaendig(suppDosierung)) {
        setError(t("onboarding.error.dosierung"));
        setSaving(false);
        return;
      }
      label = suppName.trim();
      result = await supplementHinzufuegen({
        name: suppName,
        tageszeiten: [],
        hinweis: "",
        einnahmeart: suppEinnahmeart,
        ...suppDosierung,
      });
      if (result?.ok) {
        setSuppName("");
        setSuppEinnahmeart("Kapsel");
        setSuppDosierung(LEERE_DOSIERUNG);
      }
    } else if (step.key === "medikamente") {
      if (!medName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      if (!dosierungVollstaendig(medDosierung)) {
        setError(t("onboarding.error.dosierung"));
        setSaving(false);
        return;
      }
      label = medName.trim();
      result = await hormonHinzufuegen({
        name: medName,
        kategorie: medKategorie,
        einnahmeart: medEinnahmeart,
        ...medDosierung,
      });
      if (result?.ok) {
        setMedName("");
        setMedKategorie("Hormone");
        setMedEinnahmeart("Injektion");
        setMedDosierung(LEERE_DOSIERUNG);
      }
    }

    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || t("onboarding.error.speichern"));
      return;
    }
    setHinzugefuegt((prev) => [...prev, label]);
  };

  // ---------------------------------------------------------------------
  // Peptid-Plan: Auswahl + Dosierung stehen jetzt gemeinsam auf dieser
  // Seite. Die Peptid-Zeilen selbst werden beim Antippen direkt gespeichert
  // (togglePeptid/setDose schreiben sofort nach protocol_peptide, wie in
  // der "echten" Peptid-Verwaltung) — "Speichern & weiter" hält deshalb nur
  // noch Zieldauer und Teilprotokoll-Zuordnung fest.
  // ---------------------------------------------------------------------
  const customPeptidHinzufuegen = async () => {
    setError(null);
    const result = await addCustomPreparat(customPeptidName, customPeptidArt);
    if (!result?.ok) {
      setError(result?.error || t("onboarding.error.speichern"));
      return;
    }
    setCustomPeptidName("");
  };

  const handlePeptidFoto = (p, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPeptidFoto(p, file);
    e.target.value = "";
  };

  // Hydration bekommt keine eigene "Jetzt einrichten?"-Gate-Seite mehr —
  // Tagesziel, Erinnerung und Uhrzeiten gehörten für den Nutzer erkennbar
  // zusammen und sollen nicht auf zwei Seiten aufgeteilt sein.
  const effectiveModus = step.key === "hydration" ? "jetzt" : modus;

  // Coach-Begleitung je Kategorie-Schritt (siehe UEBERGABEPROTOKOLL.md,
  // "Coach-Begleitung für Laborwerte + die 9 Kategorien-Schritte"): der
  // Coach übernimmt NICHT das Speichern selbst, sondern füllt dieselben
  // lokalen Felder aus, die auch das manuelle Formular unten benutzt — die
  // Person klickt danach ganz normal "Hinzufügen"/"Speichern & weiter",
  // genau wie bei der Schritt-für-Schritt-Begleitung in
  // OnboardingCoachGuide.jsx. Ausnahmen: Training und Peptide speichern
  // schon beim manuellen Antippen direkt (siehe Kommentare oben), deshalb
  // übernimmt der Coach dort ebenfalls sofort statt nur Felder zu füllen.
  const onUebernehmenKategorie = async (verlauf) => {
    const coachName = getCoachName();
    switch (step.key) {
      case "gewohnheiten": {
        const g = await AIService.gewohnheitAusChat({ verlauf, coachName });
        setGName(g.name || "");
        setGMenge(g.menge || "");
        if (g.uhrzeit) {
          setGUrzeitModus("fest");
          setGUhrzeit(g.uhrzeit);
        } else if (g.urzeitVon || g.urzeitBis) {
          setGUrzeitModus("fenster");
          setGUrzeitVon(g.urzeitVon || "");
          setGUrzeitBis(g.urzeitBis || "");
        }
        setGZielTage(g.zielTage ? String(g.zielTage) : "");
        return g;
      }
      case "schlaf": {
        const s = await AIService.schlafzielAusChat({ verlauf, coachName });
        setSchlafIntervallTyp("fixed");
        if (s.bettzeit) setBlockFeld(0, "bettzeit", s.bettzeit);
        if (s.aufwachzeit) setBlockFeld(0, "aufwachzeit", s.aufwachzeit);
        if (s.istZustand) setIstZustandFeld("aktuell", s.istZustand);
        return s;
      }
      case "hydration": {
        const h = await AIService.hydrationAusChat({ verlauf, coachName });
        if (h.zielMl) setHydrationMl(String(h.zielMl));
        if (h.istZustandMenge) setIstZustandFeld("menge", h.istZustandMenge);
        if (h.istZustandGetraenke) setIstZustandFeld("getraenke", h.istZustandGetraenke);
        return h;
      }
      case "tageslicht": {
        const tl = await AIService.tageslichtAusChat({ verlauf, coachName });
        setTageslichtMinuten(String(tl.zielMinuten));
        return tl;
      }
      case "ernaehrung": {
        const m = await AIService.mahlzeitplanAusChat({ verlauf, coachName });
        setMahlName(m.name || "");
        setMahlZutaten(m.zutaten?.length ? m.zutaten : [neueZutat()]);
        setMahlUhrzeit(m.uhrzeit || "08:00");
        const tage = m.wochentage?.length ? m.wochentage : [...WOCHENTAGE];
        if (tage.length < WOCHENTAGE.length) {
          setMahlIntervallTyp("weekdays");
          setMahlTage(tage);
        } else {
          setMahlIntervallTyp("fixed");
          setMahlTage([...WOCHENTAGE]);
        }
        if (m.istZustand) setIstZustandFeld("aktuell", m.istZustand);
        return m;
      }
      case "training": {
        const einheiten = await AIService.trainingsplanAusChat({ verlauf, coachName });
        for (const einheit of einheiten) {
          await wochenplanHinzufuegen(einheit);
        }
        return einheiten;
      }
      case "supplemente": {
        const p = await AIService.peptidAusChat({ verlauf, coachName });
        setSuppName(p.name || "");
        setSuppEinnahmeart(p.einnahmeart || "Kapsel");
        setSuppDosierung({
          menge: p.menge || "",
          intervallTyp: p.intervallTyp || "fixed",
          intervallDays: p.intervallDays || 1,
          customDays: p.customDays || "",
          onDays: p.onDays || "",
          offDays: p.offDays || "",
          weekdays: p.weekdays || [],
          uhrzeiten: p.uhrzeiten?.length ? p.uhrzeiten : ["20:00"],
          eigenerStart: p.eigenerStart || "",
        });
        return p;
      }
      case "medikamente": {
        const m = await AIService.medikamentAusChat({ verlauf, coachName });
        setMedName(m.name || "");
        setMedKategorie(m.kategorie || "Hormone");
        setMedEinnahmeart(m.einnahmeart || "Injektion");
        setMedDosierung({
          menge: m.menge || "",
          intervallTyp: m.intervallTyp || "fixed",
          intervallDays: m.intervallDays || 1,
          customDays: m.customDays || "",
          onDays: m.onDays || "",
          offDays: m.offDays || "",
          weekdays: m.weekdays || [],
          uhrzeiten: m.uhrzeiten?.length ? m.uhrzeiten : ["20:00"],
          eigenerStart: m.eigenerStart || "",
        });
        return m;
      }
      case "peptide": {
        const p = await AIService.peptidAusChat({ verlauf, coachName });
        const name = p.name.trim();
        const art = p.einnahmeart || "Injektion";
        if (!peptide.includes(name)) {
          const result = await addCustomPreparat(name, art);
          if (!result?.ok) throw new Error(result?.error || t("onboarding.error.speichern"));
        } else {
          setEinnahmeart(name, art);
        }
        if ((p.intervallTyp || "fixed") === "fixed") {
          setDose(name, "intervallPreset", p.intervallDays || 7);
        } else {
          setDose(name, "intervallTyp", p.intervallTyp);
          setDose(name, "customDays", p.customDays || "");
          setDose(name, "onDays", p.onDays || "");
          setDose(name, "offDays", p.offDays || "");
          setDose(name, "weekdays", p.weekdays || []);
        }
        setDose(name, "menge", p.menge || "");
        setDose(name, "uhrzeiten", p.uhrzeiten?.length ? p.uhrzeiten : ["20:00"]);
        return { name, menge: p.menge || "" };
      }
      default:
        throw new Error("Für diesen Bereich gibt es noch keine Assistenten-Begleitung.");
    }
  };

  const renderKategorieErgebnis = (ergebnis) => {
    let text = "Felder ausgefüllt — bitte kurz prüfen und unten speichern.";
    if (step.key === "training") {
      const anzahl = Array.isArray(ergebnis) ? ergebnis.length : 0;
      text = `${anzahl} Einheit${anzahl === 1 ? "" : "en"} in den Wochenplan übernommen.`;
    } else if (step.key === "peptide") {
      text = `${ergebnis?.name || ""} ${ergebnis?.menge ? `(${ergebnis.menge})` : ""} eingerichtet.`;
    }
    return <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>{text}</div>;
  };

  return (
    <Shell bereich={SCHRITT_ZU_KATEGORIE[step.key]}>
      <OnboardingNavArrows
        onBack={index > 0 || onBackToStart ? zurueck : undefined}
        backLabel={t("onboarding.zurueck")}
        onForward={() => weiter(false)}
        forwardLabel={tLabel("Weiter")}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 8, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textMuted }}>
            {t("onboarding.categories.progress", { current: index + 1, total: CATEGORY_STEPS.length })}
          </div>
          {(index > 0 || onBackToStart) && (
            <div className="mp-tap" onClick={zurueck} style={{ fontSize: 15, fontWeight: 700, color: textMuted, cursor: "pointer", padding: "8px 12px" }}>
              {t("onboarding.zurueck")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="mp-tap" onClick={() => onFinished(eingerichtet)} style={{ fontSize: 15, fontWeight: 700, color: accentDark, cursor: "pointer", padding: "8px 12px" }}>
            {tLabel("Alles überspringen")}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 }}
              title={tLabel("Abbrechen")}
            >
              ⌂
            </button>
          )}
        </div>
      </div>
      <Stepper step={index} total={CATEGORY_STEPS.length} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 28 }}>{step.icon}</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.gate.title", { label: tLabel(step.label) })}</div>
      </div>

      {effectiveModus === null && (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            {t("onboarding.gate.instructions")}
          </div>
          <div style={{ marginBottom: 16 }}>
            <ErinnerungField value={erinnerungen[step.key]} onChange={handleErinnerungChange} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <CheckRow
              label={t("onboarding.eigenesStartdatum.checkbox")}
              checked={eigenesStartdatumAktiv}
              onToggle={() => setEigenesStartdatumAktiv((v) => !v)}
            />
            {eigenesStartdatumAktiv && (
              <div style={{ marginTop: 8 }}>
                <Label>{t("onboarding.eigenesStartdatum.label")}</Label>
                <TextInput type="date" value={eigenesStartdatum} onChange={setEigenesStartdatum} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => setModus("jetzt")}>{tLabel("Jetzt einrichten")}</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
              {tLabel("Später einrichten")}
            </PrimaryButton>
          </div>
        </Card>
      )}

      {effectiveModus === "jetzt" && (
        <>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
            Sag {getCoachName()}, was du hier einrichten möchtest — er füllt die Felder für dich aus.
          </div>
          <KiChat
            key={step.key}
            systemPrompt={KATEGORIE_COACH_PROMPTS[step.key]}
            einleitung={
              (KATEGORIE_EINLEITUNG[step.key] || (() => `Hi, ich bin ${getCoachName()}! Was möchtest du für "${tLabel(step.label)}" einrichten?`))(getCoachName())
            }
            onUebernehmen={onUebernehmenKategorie}
            uebernehmenLabel="Übernehmen"
            renderErgebnis={renderKategorieErgebnis}
            autoStart
          />
        <Card>
          {ISTZUSTAND_FRAGEN[step.key] && (
            <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: accentDark, marginBottom: 10 }}>{tLabel("Dein aktueller Stand")}</div>
              {ISTZUSTAND_FRAGEN[step.key].map((f) => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <Label>{tLabel(f.frage)}</Label>
                  <TextArea value={istZustand[f.key] || ""} onChange={(v) => setIstZustandFeld(f.key, v)} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
          )}

          {istMultiAdd && step.key !== "ernaehrung" && hinzugefuegt.length > 0 && (
            <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
              <Label>{t("onboarding.hinzugefuegt.label")}</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hinzugefuegt.map((item, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 12, background: accentSoft, fontSize: 13, fontWeight: 600 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step.key === "gewohnheiten" && (
            <>
              <Label>{t("onboarding.gewohnheiten.name.label")}</Label>
              <TextInput value={gName} onChange={setGName} placeholder={t("onboarding.gewohnheiten.name.placeholder")} />
              <Label>{t("onboarding.gewohnheiten.menge.label")}</Label>
              <TextInput value={gMenge} onChange={setGMenge} placeholder={t("onboarding.gewohnheiten.menge.placeholder")} />
              <Label>{t("onboarding.gewohnheiten.uhrzeit.label")}</Label>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Pill
                  label={tLabel("Feste Uhrzeit")}
                  selected={gUrzeitModus === "fest"}
                  onClick={() => setGUrzeitModus("fest")}
                />
                <Pill
                  label={tLabel("Zeitfenster")}
                  selected={gUrzeitModus === "fenster"}
                  onClick={() => setGUrzeitModus("fenster")}
                />
              </div>
              {gUrzeitModus === "fenster" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <TimeWheelField value={gUrzeitVon} onChange={setGUrzeitVon} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textMuted }}>–</div>
                  <div style={{ flex: 1 }}>
                    <TimeWheelField value={gUrzeitBis} onChange={setGUrzeitBis} />
                  </div>
                </div>
              ) : (
                <TimeWheelField value={gUhrzeit} onChange={setGUhrzeit} />
              )}
              <Label>{t("onboarding.gewohnheiten.zieltage.label")}</Label>
              <TextInput type="number" value={gZielTage} onChange={setGZielTage} placeholder={t("onboarding.gewohnheiten.zieltage.placeholder")} />
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}`, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: accentDark }}>✓ Häufig verwendete Ziele</div>
                <div>21–66 Tage sind etablierte Richtwerte — du kannst aber jedes Ziel wählen, das zu dir passt.</div>
              </div>
            </>
          )}

          {step.key === "schlaf" && (
            <>
              <Label>{tLabel("Intervall")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 16 }}>
                <Pill
                  label={tLabel("Täglich")}
                  selected={schlafIntervallTyp === "fixed"}
                  onClick={() => setSchlafIntervallTyp("fixed")}
                />
                <Pill
                  label={tLabel("Bestimmte Wochentage")}
                  selected={schlafIntervallTyp === "weekdays"}
                  onClick={() => setSchlafIntervallTyp("weekdays")}
                />
              </div>
              {schlafIntervallTyp === "fixed" ? (
                <>
                  <div style={{ padding: "12px", borderRadius: 12, background: accentSoft, marginBottom: 14 }}>
                    <Label>{t("onboarding.schlaf.bettzeit.label")}</Label>
                    <TimeWheelField value={schlafBloecke[0]?.bettzeit || "22:30"} onChange={(v) => setBlockFeld(0, "bettzeit", v)} />
                    <Label>{t("onboarding.schlaf.aufwachzeit.label")}</Label>
                    <TimeWheelField value={schlafBloecke[0]?.aufwachzeit || "06:30"} onChange={(v) => setBlockFeld(0, "aufwachzeit", v)} />
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
                      {t("onboarding.schlaf.ziel", { stunden: berechneSchlafstunden(schlafBloecke[0]?.bettzeit, schlafBloecke[0]?.aufwachzeit) })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {schlafBloecke.map((block, idx) => (
                    <div key={block.id} style={{ marginBottom: idx < schlafBloecke.length - 1 ? 20 : 0, paddingBottom: idx < schlafBloecke.length - 1 ? 16 : 0, borderBottom: idx < schlafBloecke.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                      <Label>{t("onboarding.schlaf.tage.label")}</Label>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        <Pill label={t("onboarding.schlaf.alle")} selected={verfuegbareTage(idx).length > 0 && verfuegbareTage(idx).every((t2) => block.wochentage.includes(t2))} onClick={() => blockAlleUmschalten(idx)} />
                        {verfuegbareTage(idx).map((tag) => (
                          <Pill key={tag} label={tag} selected={block.wochentage.includes(tag)} onClick={() => toggleBlockTag(idx, tag)} />
                        ))}
                      </div>
                      <Label>{t("onboarding.schlaf.bettzeit.label")}</Label>
                      <TimeWheelField value={block.bettzeit} onChange={(v) => setBlockFeld(idx, "bettzeit", v)} />
                      <Label>{t("onboarding.schlaf.aufwachzeit.label")}</Label>
                      <TimeWheelField value={block.aufwachzeit} onChange={(v) => setBlockFeld(idx, "aufwachzeit", v)} />
                      <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
                        {t("onboarding.schlaf.ziel", { stunden: berechneSchlafstunden(block.bettzeit, block.aufwachzeit) })}
                      </div>
                      {schlafBloecke.length > 1 && (
                        <button
                          type="button"
                          onClick={() => schlafblockEntfernen(idx)}
                          style={{ marginTop: 8, border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                        >
                          {t("onboarding.schlaf.block.entfernen")}
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <AddZeile label={t("onboarding.schlaf.block.hinzufuegen")} onClick={schlafblockHinzufuegen} disabled={alleTageVergeben} />
                  </div>
                </>
              )}
              <div style={{ marginTop: 16 }}>
                <ZeitErinnerungenCard kategorie="schlaf" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="22:00" />
              </div>
            </>
          )}

          {step.key === "hydration" && (
            <>
              <Label>{t("onboarding.hydration.tagesziel.label")}</Label>
              <TextInput
                type="number"
                value={hydrationMl}
                onChange={setHydrationMl}
                placeholder={hydrationZielMl ? String(hydrationZielMl) : t("onboarding.hydration.tagesziel.placeholder")}
              />
              <div style={{ fontSize: 11, color: textMuted, marginTop: 4, marginBottom: 18 }}>{t("onboarding.hydration.tagesziel.hinweis")}</div>

              <div style={{ marginBottom: 16 }}>
                <ZeitErinnerungenCard
                  kategorie="hydration"
                  labelKey="onboarding.hydration.erinnerungszeiten.label"
                  mengeLabel="ml"
                  mengeStandard="300"
                />
              </div>

              <CheckRow
                label={t("onboarding.eigenesStartdatum.checkbox")}
                checked={eigenesStartdatumAktiv}
                onToggle={() => setEigenesStartdatumAktiv((v) => !v)}
              />
              {eigenesStartdatumAktiv && (
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <Label>{t("onboarding.eigenesStartdatum.label")}</Label>
                  <TextInput type="date" value={eigenesStartdatum} onChange={setEigenesStartdatum} />
                </div>
              )}
            </>
          )}

          {step.key === "tageslicht" && (
            <>
              <Label>{tLabel("Tagesziel in Minuten")}</Label>
              <TextInput
                type="number"
                value={tageslichtMinuten}
                onChange={setTageslichtMinuten}
                placeholder={tageslichtZielMinuten ? String(tageslichtZielMinuten) : "z. B. 30"}
              />
              <div style={{ fontSize: 11, color: textMuted, marginTop: 4, marginBottom: 18 }}>
                {tLabel("Wie viele Minuten am Tag möchtest du bewusst im Freien/Tageslicht verbringen?")}
              </div>
              <ZeitErinnerungenCard kategorie="tageslicht" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="12:00" />
            </>
          )}

          {step.key === "ernaehrung" && (
            <>
              <Label>{t("onboarding.ernaehrung.name.label")}</Label>
              <TextInput value={mahlName} onChange={setMahlName} placeholder={t("onboarding.ernaehrung.name.placeholder")} />
              <Label>{tLabel("Intervall")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 12 }}>
                <Pill
                  label={tLabel("Täglich")}
                  selected={mahlIntervallTyp === "fixed"}
                  onClick={() => setMahlIntervallTyp("fixed")}
                />
                <Pill
                  label={tLabel("Bestimmte Wochentage")}
                  selected={mahlIntervallTyp === "weekdays"}
                  onClick={() => setMahlIntervallTyp("weekdays")}
                />
              </div>
              {mahlIntervallTyp === "weekdays" && (
                <>
                  <Label>{t("onboarding.ernaehrung.wochentage.label")}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    <Pill
                      label={t("onboarding.schlaf.alle")}
                      selected={WOCHENTAGE.every((tag) => mahlTage.includes(tag))}
                      onClick={() => setMahlTage((prev) => (WOCHENTAGE.every((tag) => prev.includes(tag)) ? [] : [...WOCHENTAGE]))}
                    />
                    {WOCHENTAGE.map((tag) => (
                      <Pill key={tag} label={tag} selected={mahlTage.includes(tag)} onClick={() => setMahlTage((prev) => toggleInArray(prev, tag))} />
                    ))}
                  </div>
                </>
              )}
              <Label>{t("onboarding.ernaehrung.uhrzeit.label")}</Label>
              <TimeWheelField value={mahlUhrzeit} onChange={setMahlUhrzeit} />
              <Label>{t("onboarding.ernaehrung.zutaten.label")}</Label>
              {mahlZutaten.map((z, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 2 }}>
                    <TextInput value={z.name} onChange={(v) => zutatAendern(i, "name", v)} placeholder={t("onboarding.ernaehrung.zutat.placeholder")} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput value={z.menge} onChange={(v) => zutatAendern(i, "menge", v)} placeholder={t("onboarding.ernaehrung.zutatmenge.placeholder")} />
                  </div>
                  {mahlZutaten.length > 1 && (
                    <button type="button" onClick={() => zutatEntfernen(i)} style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              <AddZeile label={t("onboarding.ernaehrung.zutat.hinzufuegen")} onClick={zutatHinzufuegen} />

              {mahlzeitenListe.length > 0 && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
                  <Label>{t("onboarding.ernaehrung.uebersicht.label")}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>
                    <Pill
                      label={t("onboarding.ernaehrung.ansicht.alle")}
                      selected={ernaehrungAnsicht === "alle"}
                      onClick={() => setErnaehrungAnsicht("alle")}
                    />
                    {WOCHENTAGE.map((tag) => (
                      <Pill key={tag} label={tag} selected={ernaehrungAnsicht === tag} onClick={() => setErnaehrungAnsicht(tag)} />
                    ))}
                  </div>
                  {mahlzeitenListe
                    .filter((m) => ernaehrungAnsicht === "alle" || m.tage.includes(ernaehrungAnsicht))
                    .map((m, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: 12, background: accentSoft, marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {m.name} · {m.uhrzeit}
                        </div>
                        <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                          {m.tage.length === WOCHENTAGE.length ? t("onboarding.schlaf.alle") : m.tage.join(", ")}
                          {m.zutaten.length > 0 ? ` · ${m.zutaten.map((z) => z.name).join(", ")}` : ""}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {step.key === "training" && (
            <>
              <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("onboarding.training.frage")}</div>
              <WochenplanEditor
                trainingWochenplan={trainingWochenplan}
                wochenplanHinzufuegen={wochenplanHinzufuegen}
                wochenplanEntfernen={wochenplanEntfernen}
                titel={null}
              />
            </>
          )}

          {step.key === "supplemente" && (
            <>
              <Label>{t("onboarding.supplemente.name.label")}</Label>
              <TextInput value={suppName} onChange={setSuppName} placeholder={t("onboarding.supplemente.name.placeholder")} />
              <Label>{tLabel("Einnahmeart")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {EINNAHMEARTEN.map((a) => (
                  <Pill key={a} label={tLabel(a)} selected={suppEinnahmeart === a} onClick={() => setSuppEinnahmeart(a)} />
                ))}
              </div>
              <DosierungFields
                value={suppDosierung}
                onChange={(feld, val) => setSuppDosierungFeld(feld, val)}
                mengePlaceholder={t("onboarding.supplemente.menge.placeholder")}
              />
            </>
          )}

          {step.key === "medikamente" && (
            <>
              <Label>{tLabel("Name")}</Label>
              <TextInput value={medName} onChange={setMedName} placeholder={t("onboarding.medikamente.name.placeholder")} />
              <Label>{tLabel("Kategorie")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {MEDIKAMENTE_KATEGORIEN.map((k) => (
                  <Pill key={k} label={tLabel(k)} selected={medKategorie === k} onClick={() => setMedKategorie(k)} />
                ))}
              </div>
              <Label>{tLabel("Einnahmeart")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {EINNAHMEARTEN.map((a) => (
                  <Pill key={a} label={tLabel(a)} selected={medEinnahmeart === a} onClick={() => setMedEinnahmeart(a)} />
                ))}
              </div>
              <DosierungFields
                value={medDosierung}
                onChange={(feld, val) => setMedDosierungFeld(feld, val)}
                mengePlaceholder={t("onboarding.medikamente.dosis.placeholder")}
              />
            </>
          )}

          {step.key === "peptide" && (
            <>
              <Label>{t("onboarding.peptide.auswahl.label")}</Label>
              {PEPTIDE_OPTIONEN.map((p) => (
                <CheckRow key={p} label={p} checked={peptide.includes(p)} onToggle={() => togglePeptid(p)} />
              ))}
              {peptide
                .filter((p) => !PEPTIDE_OPTIONEN.includes(p))
                .map((p) => (
                  <CheckRow key={p} label={`${p} (${tLabel(einnahmeart[p] || "Eigenes")})`} checked onToggle={() => togglePeptid(p)} />
                ))}

              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}` }}>
                <Label>{t("onboarding.peptide.eigenes.label")}</Label>
                <div style={{ fontSize: 11, color: textMuted, marginTop: -4, marginBottom: 8 }}>{t("onboarding.peptide.eigenes.hinweis")}</div>
                <TextInput value={customPeptidName} onChange={setCustomPeptidName} placeholder={t("onboarding.peptide.eigenes.placeholder")} />
                <Label>{tLabel("Einnahmeart")}</Label>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {EINNAHMEARTEN.map((a) => (
                    <Pill key={a} label={tLabel(a)} selected={customPeptidArt === a} onClick={() => setCustomPeptidArt(a)} />
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <PrimaryButton onClick={customPeptidHinzufuegen} disabled={!customPeptidName.trim()} variant="ghost">
                    {t("onboarding.hinzufuegen")}
                  </PrimaryButton>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                <Label>{t("onboarding.peptide.dosierung.label")}</Label>
                {peptide.length === 0 && <div style={{ fontSize: 13, color: textMuted, marginTop: 8 }}>{t("onboarding.peptide.keineAuswahl")}</div>}
                {peptide.map((p) => (
                  <div key={p} style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p}</div>
                      {dosierung[p]?.fotoPath && <SignedPhoto path={dosierung[p].fotoPath} alt={p} size={36} />}
                    </div>

                    <Label>{tLabel("Einnahmeart")}</Label>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {EINNAHMEARTEN.map((a) => (
                        <Pill key={a} label={tLabel(a)} selected={(einnahmeart[p] || "Injektion") === a} onClick={() => setEinnahmeart(p, a)} />
                      ))}
                    </div>

                    <DosierungFields value={dosierung[p]} onChange={(feld, val) => setDose(p, feld, val)} />

                    {(einnahmeart[p] || "Injektion") === "Injektion" && (
                      <>
                        <Label>{t("onboarding.peptide.bacwasser.label")}</Label>
                        <TextInput type="number" value={dosierung[p]?.bacWasser || ""} onChange={(val) => setDose(p, "bacWasser", val)} placeholder="z. B. 2" />
                      </>
                    )}

                    {einnahmeart[p] === "Nasenspray" && (
                      <>
                        <Label>{t("onboarding.peptide.spruehstoesse.label")}</Label>
                        <NumberWheelField value={dosierung[p]?.spruehstoesse || ""} onChange={(val) => setDose(p, "spruehstoesse", val)} min={1} max={20} placeholder="z. B. 2" />
                      </>
                    )}

                    <Label>{t("onboarding.peptide.foto.label")}</Label>
                    <input type="file" accept="image/*" id={`onboarding-praeparat-foto-${p}`} style={{ display: "none" }} onChange={(e) => handlePeptidFoto(p, e)} />
                    <label
                      htmlFor={`onboarding-praeparat-foto-${p}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "9px",
                        borderRadius: 10,
                        border: `1.5px dashed ${accent}`,
                        background: "#fff",
                        color: accentDark,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📷 {dosierung[p]?.fotoPath ? tLabel("Foto ersetzen") : tLabel("Foto aufnehmen")}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {!istMultiAdd && (
            <div style={{ marginTop: 14 }}>
              <ZieldauerField value={ziel} onChange={setZiel} />
            </div>
          )}

          {error && <div style={{ color: danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {istMultiAdd ? (
              <>
                <PrimaryButton onClick={hinzufuegen} disabled={saving}>
                  {saving ? t("onboarding.saving") : t("onboarding.hinzufuegen")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(hinzugefuegt.length > 0)}>
                  {hinzugefuegt.length > 0 ? tLabel("Weiter") : tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            ) : (
              <>
                <PrimaryButton onClick={speichernUndWeiter} disabled={saving}>
                  {saving ? t("onboarding.saving") : tLabel("Speichern & weiter")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
                  {tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            )}
          </div>
        </Card>
        </>
      )}
    </Shell>
  );
}
