import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextInput, TextArea, Stepper } from "../../ui/primitives";
import ZieldauerField from "../../ui/ZieldauerField";
import ErinnerungField from "../../ui/ErinnerungField";
import ZeitErinnerungenCard from "../../ui/ZeitErinnerungenCard";
import WochenplanEditor from "../../ui/WochenplanEditor";
import TimeWheelField from "../../ui/TimeWheelField";
import DosierungFields from "../../ui/DosierungFields";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { accentDark, accentSoft, cardBorder, danger, textMuted } from "../../ui/theme";
import { EINNAHMEARTEN, MEDIKAMENTE_KATEGORIEN, WOCHENTAGE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { CATEGORY_STEPS, PROTOKOLL_SCHRITT_OFFSET, PROTOKOLL_SCHRITTE_GESAMT } from "./categorySteps";
import { useT } from "../../i18n/translate";
import { toLocalISODate } from "../../utils/dates";
import KiChat from "../../ui/KiChat";
import { AIService } from "../../services/aiService";
import { getCoachName } from "../../utils/coachStorage";

// CATEGORY_STEPS-Schlüssel → KATEGORIE_META-Schlüssel (weichen an einigen
// Stellen vom Schritt-Namen ab: "ernaehrung"→"mahlzeit",
// "gewohnheiten"→"gewohnheit", "supplemente"→"supplement",
// "medikamente"→"hormon") — steuert die Farbe von <Shell bereich=…> für
// den jeweils aktuellen Kategorie-Schritt.
const SCHRITT_ZU_KATEGORIE = {
  hydration: "hydration",
  tageslicht: "tageslicht",
  bildschirmzeit: "bildschirmzeit",
  ernaehrung: "mahlzeit",
  training: "training",
  gewohnheiten: "gewohnheit",
  supplemente: "supplement",
  medikamente: "hormon",
};

// Systemprompt je Kategorie für den Coach-Begleitungs-Chat (siehe
// onUebernehmenKategorie() weiter unten) — bewusst kurz und auf die
// jeweiligen fehlenden Angaben fokussiert, statt eines generischen Prompts
// für alle 9 Bereiche.
const KATEGORIE_COACH_PROMPTS = {
  gewohnheiten:
    "Du hilfst dabei, eine neue Gewohnheit einzurichten. Frag nach, was noch fehlt: Name, Menge/Umfang, feste Uhrzeit oder Zeitfenster, und ein Zieltage-Ziel (z. B. 21 oder 66 Tage). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  hydration:
    "Du hilfst dabei, ein tägliches Trinkziel einzurichten. Frag nach, wie viel die Person aktuell trinkt und was ein realistisches Tagesziel wäre. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  tageslicht:
    "Du hilfst dabei, ein tägliches Tageslicht-/Freiluft-Ziel in Minuten einzurichten. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  bildschirmzeit:
    "Du hilfst dabei, ein tägliches Bildschirmzeit-Limit einzurichten (v. a. Freizeit-Scrollen am Telefon). Frag nach: wie viel Bildschirmzeit die Person üblicherweise hat, was sie am meisten am Telefon macht, ob sie sich vorstellen kann, das zu reduzieren, und wie viel Bildschirmzeit sie sich künftig als Limit setzen möchte (eine Obergrenze, kein Ziel zum Erreichen). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  ernaehrung:
    "Du hilfst dabei, eine Mahlzeit für den Wochenplan einzurichten. Frag nach Name, Zutaten, an welchen Wochentagen sie stattfindet, und der Uhrzeit. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  training:
    "Du hilfst dabei, einen Trainingsplan für die Woche einzurichten. Frag nach, wenn wichtige Angaben fehlen (z. B. Erfahrung, verfügbare Tage, Ziele), mach konkrete Vorschläge. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  supplemente:
    "Du hilfst dabei, ein neues Supplement einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart, und der Rhythmus (z. B. täglich, alle X Tage, bestimmte Wochentage, oder Zyklus wie 'X Tage nehmen, Y Tage Pause') sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
  medikamente:
    "Du hilfst dabei, ein neues Medikament einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart, Kategorie, und der Rhythmus sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.",
};

// Erste (vorgelesene) Nachricht je Kategorie — bewusst schon die konkrete,
// zur Substanz/Einnahmeart passende Frage statt eines generischen "Was
// möchtest du einrichten?" (Nutzerinnen-Vorgabe, 28.07.: bei Wasser soll
// gefragt werden "wie viel hast du bisher getrunken, was ist dein
// Tagesziel", nicht irgendwas Allgemeines).
const KATEGORIE_EINLEITUNG = {
  gewohnheiten: (coachName) => `Hi, ich bin ${coachName}! Welche Gewohnheit möchtest du aufbauen, und warum ist sie dir wichtig?`,
  hydration: (coachName) => `Hi, ich bin ${coachName}! Wie viel trinkst du aktuell am Tag, und was wäre ein gutes Tagesziel für dich?`,
  tageslicht: (coachName) => `Hi, ich bin ${coachName}! Wie viel Zeit verbringst du aktuell draußen bei Tageslicht, und was wäre ein realistisches Ziel pro Tag?`,
  bildschirmzeit: (coachName) =>
    `Hi, ich bin ${coachName}! Wie viel Bildschirmzeit hast du üblicherweise am Tag, und was machst du am meisten am Telefon? Kannst du dir vorstellen, das zu reduzieren — und wie viel Bildschirmzeit willst du dir künftig als Limit setzen?`,
  ernaehrung: (coachName) => `Hi, ich bin ${coachName}! Erzähl mir von einer Mahlzeit, die du regelmäßig isst — was ist drin, an welchen Tagen, und um wie viel Uhr?`,
  training: (coachName) => `Hi, ich bin ${coachName}! Wie sieht dein Training aktuell aus, und was schwebt dir für den Plan vor?`,
  supplemente: (coachName) => `Hi, ich bin ${coachName}! Welches Supplement möchtest du eintragen? Sag mir Dosierung, Einnahmeart und wann du es nimmst.`,
  medikamente: (coachName) => `Hi, ich bin ${coachName}! Welches Medikament möchtest du eintragen? Sag mir Dosierung, Einnahmeart und wann du es nimmst.`,
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
  bildschirmzeit: [
    { key: "ueblich", frage: "Wie viel Bildschirmzeit hast Du üblicherweise am Tag?", placeholder: "z. B. ca. 3-4 Stunden" },
    { key: "taetigkeit", frage: "Was machst Du am meisten am Telefon?", placeholder: "z. B. Social Media, Nachrichten, Videos …" },
    { key: "reduzieren", frage: "Kannst Du Dir vorstellen, das zu reduzieren?", placeholder: "" },
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

const neueZutat = () => ({ name: "", menge: "" });

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
// unnatürlichster/klinischster Tracking-Punkt (Hydration, Ernährung,
// Training, Gewohnheiten, Supplemente, Medikamente, Peptid-Plan ganz am
// Ende — Schlaf ist seit 16.09. kein eigener Schritt mehr, siehe
// OnboardingRoutinenView.jsx) — jeweils dieselbe "Jetzt einrichten?"-Gate-Seite und danach die
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
    bildschirmzeitZielMinuten,
    bildschirmzeitZielSetzen,
    mahlzeitHinzufuegen,
    wochenplanMahlzeitSetzen,
    supplementHinzufuegen,
    hormonHinzufuegen,
    setCategoryZiel,
    trainingWochenplan,
    wochenplanHinzufuegen,
    wochenplanBearbeiten,
    wochenplanEntfernen,
    erinnerungen,
    setErinnerung,
    aktivesHauptprotokoll,
    teilprotokolle,
    teilprotokollSpeichern,
  } = useAppData();
  const { t, tLabel } = useT();

  // "Zwischenspeichern" (Nutzerinnen-Vorgabe, 15.08.): schließt jemand die
  // App mitten im Kategorien-Assistenten, soll es beim nächsten Öffnen genau
  // dort weitergehen statt wieder bei Schritt 1 — jede bereits beantwortete
  // (eingerichtete ODER übersprungene) Kategorie hat schon eine
  // teilprotokolle-Zeile für das aktive Hauptprotokoll (siehe weiter() unten),
  // die Anzahl ergibt also direkt den Wiedereinstiegs-Schritt. Bei einem
  // frisch über "Neues Protokoll" angelegten Hauptprotokoll existieren noch
  // keine Zeilen, hier greift dann ganz normal Schritt 0.
  const [index, setIndex] = useState(() => {
    const beantwortet = CATEGORY_STEPS.filter((s) => teilprotokolle.some((t2) => t2.hauptprotokoll_id === aktivesHauptprotokoll?.id && t2.kategorie === s.key)).length;
    return Math.min(beantwortet, CATEGORY_STEPS.length - 1);
  });
  const [modus, setModus] = useState(null); // null | "jetzt"
  const [ziel, setZiel] = useState(ZIEL_LEER);
  const [eingerichtet, setEingerichtet] = useState([]); // [{ key, icon, label }]
  const [hinzugefuegt, setHinzugefuegt] = useState([]); // Namen, die in diesem Bereich schon gespeichert wurden
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // UX-Fix (Nutzerinnen-Vorgabe, 11.09.: "wenn man was ausfüllt und dann ein
  // Ergebnis entsteht ... wird es visuell nicht klar, dass das grade
  // entstanden ist"): Die "Bereits hinzugefügt"-Liste steht oberhalb des
  // Formulars — wer unten das Formular ausfüllt und "Hinzufügen" tippt, sieht
  // den neuen Eintrag sonst gar nicht, ohne von sich aus nach oben zu
  // scrollen. neuesterEintragRef markiert den zuletzt hinzugefügten Eintrag,
  // damit er automatisch ins Bild scrollt und kurz sichtbar hervorgehoben
  // wird (dieselbe slideInSuccess-Animation wie beim Abhaken in
  // QuickTaskList.jsx). Der erste Render (z. B. beim Zwischenspeichern-
  // Wiedereinstieg mit bereits vorhandenen Einträgen) soll NICHT scrollen,
  // nur ein wirklich neu hinzugekommener Eintrag.
  const neuesterEintragRef = useRef(null);
  const hinzugefuegtErstRenderRef = useRef(true);
  useEffect(() => {
    if (hinzugefuegtErstRenderRef.current) {
      hinzugefuegtErstRenderRef.current = false;
      return;
    }
    neuesterEintragRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hinzugefuegt.length]);

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

  // Hydration
  // Bewusst leer statt mit dem bestehenden Ziel vorbelegt — bei "Neues
  // Protokoll" (+) sollen die Onboarding-Masken frisch wirken. Bleibt das
  // Feld leer, greift beim Speichern trotzdem der bisherige Wert (siehe
  // speichernUndWeiter), damit ein reines Durchklicken nichts überschreibt.
  const [hydrationMl, setHydrationMl] = useState("");

  // Tageslicht — analog zu Hydration bewusst leer statt vorbelegt, siehe
  // Kommentar oben.
  const [tageslichtMinuten, setTageslichtMinuten] = useState("");

  // Bildschirmzeit — analog zu Tageslicht bewusst leer statt vorbelegt.
  // Anders als bei Tageslicht ist der Wert hier eine gewünschte
  // OBERGRENZE, kein Mindestwert (siehe BildschirmzeitView.jsx).
  const [bildschirmzeitMinuten, setBildschirmzeitMinuten] = useState("");

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

  const step = CATEGORY_STEPS[index];
  const istLetzter = index === CATEGORY_STEPS.length - 1;
  const istMultiAdd = MULTI_ADD_KEYS.includes(step.key);

  // Bug-Fix (Nutzerinnen-Vorgabe, 11.09.): Beim (Wieder-)Betreten eines
  // Schritts (auch rückwärts) wurden Schlafzeiten und "eigenes Startdatum"
  // bisher IMMER auf den Standardwert zurückgesetzt (siehe
  // resetEingabeFelder/resetLokal unten), statt aus bereits gespeicherten
  // Daten vorbefüllt zu werden. Klicksequenz: individuelle Schlafzeiten
  // setzen → Weiter → später zurück zu Schlaf → erneut speichern → die
  // echten Zeiten wurden stillschweigend durch 22:30/06:30 ersetzt —
  // dasselbe Muster bei einem aktivierten eigenen Startdatum. Läuft NACH
  // resetLokal() (das synchron beim Verlassen des vorherigen Schritts
  // feuert), holt sich hier die tatsächlich gespeicherten Werte für den
  // gerade betretenen Schritt zurück, statt bei den Reset-Defaults zu
  // bleiben.
  useEffect(() => {
    const bestehendesTeilprotokoll = teilprotokolle.find(
      (t2) => t2.hauptprotokoll_id === aktivesHauptprotokoll?.id && t2.kategorie === step.key
    );
    if (bestehendesTeilprotokoll?.eigenes_startdatum) {
      setEigenesStartdatumAktiv(true);
      setEigenesStartdatum(bestehendesTeilprotokoll.eigenes_startdatum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const resetEingabeFelder = () => {
    setGName("");
    setGMenge("");
    setGUhrzeit("");
    setGUrzeitModus("fest");
    setGUrzeitVon("");
    setGUrzeitBis("");
    setGZielTage("");
    setHydrationMl("");
    setTageslichtMinuten("");
    setBildschirmzeitMinuten("");
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

  const weiter = async (wurdeEingerichtet) => {
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
    // Bug-Fix: lief bisher fire-and-forget (kein await, kein Fehler-Check)
    // — schlug der Schreibvorgang fehl, sprang der Flow trotzdem sofort zum
    // nächsten Schritt weiter, ohne dass die Nutzerin je davon erfuhr. Das
    // untergräbt auch das Zwischenspeichern-Feature (der Wiedereinstiegs-
    // Index zählt genau diese Zeilen). Jetzt wird gewartet und bei einem
    // Fehler NICHT weitergesprungen.
    if (aktivesHauptprotokoll?.id) {
      try {
        const result = await teilprotokollSpeichern(aktivesHauptprotokoll.id, step.key, {
          aktiv: wurdeEingerichtet,
          eigenerStartdatum: eigenesStartdatumAktiv ? eigenesStartdatum : null,
          laufzeitWochen: ziel.modus === "wochen" && ziel.wochen ? Number(ziel.wochen) : null,
        });
        if (!result?.ok) {
          setError(result?.error || t("onboarding.error.speichern"));
          return;
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || t("onboarding.error.speichern"));
        return;
      }
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

  // Hydration/Tageslicht haben ein eigenes Erinnerungszeiten-Feld
  // (ZeitErinnerungenCard) statt nur eines Ja/Nein-Schalters — dieser
  // generische Handler bleibt nur noch für die übrigen Kategorien relevant.
  const handleErinnerungChange = async (v) => {
    setError(null);
    const result = await setErinnerung(step.key, v);
    if (!result?.ok) setError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

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

    if (step.key === "hydration") {
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
    } else if (step.key === "bildschirmzeit") {
      const neuesLimit = bildschirmzeitMinuten.trim() === "" ? bildschirmzeitZielMinuten : Math.max(0, Number(bildschirmzeitMinuten) || 0);
      await bildschirmzeitZielSetzen(neuesLimit);
      setCategoryZiel("bildschirmzeit", { modus: ziel.modus, wochen: ziel.wochen, istZustand });
    } else if (step.key === "training") {
      // Der Wochenplan selbst wird schon beim Antippen der Pillen direkt
      // gespeichert (wochenplanHinzufuegen/-Entfernen, wie in TrainingView) —
      // hier wird nur noch die Zieldauer festgehalten.
      setCategoryZiel("training", { modus: ziel.modus, wochen: ziel.wochen, istZustand });
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
        if (!g.name?.trim()) throw new Error(t("onboarding.error.name"));
        const result = await gewohnheitHinzufuegen({
          name: g.name,
          icon: "🌱",
          menge: g.menge || "",
          uhrzeit: g.uhrzeit || "",
          urzeitVon: !g.uhrzeit ? g.urzeitVon || "" : "",
          urzeitBis: !g.uhrzeit ? g.urzeitBis || "" : "",
          zielTage: g.zielTage ? Number(g.zielTage) : null,
        });
        if (!result?.ok) throw new Error(result?.error || t("onboarding.error.speichern"));
        setHinzugefuegt((prev) => [...prev, g.name.trim()]);
        return g;
      }
      case "hydration": {
        const h = await AIService.hydrationAusChat({ verlauf, coachName });
        if (h.zielMl) {
          setHydrationMl(String(h.zielMl));
          await hydrationZielSetzen(Math.max(0, Number(h.zielMl) || 0));
        }
        if (h.istZustandMenge) setIstZustandFeld("menge", h.istZustandMenge);
        if (h.istZustandGetraenke) setIstZustandFeld("getraenke", h.istZustandGetraenke);
        return h;
      }
      case "tageslicht": {
        const tl = await AIService.tageslichtAusChat({ verlauf, coachName });
        setTageslichtMinuten(String(tl.zielMinuten));
        if (tl.zielMinuten) await tageslichtZielSetzen(Math.max(0, Number(tl.zielMinuten) || 0));
        return tl;
      }
      case "bildschirmzeit": {
        const bz = await AIService.bildschirmzeitAusChat({ verlauf, coachName });
        setBildschirmzeitMinuten(String(bz.zielMinuten));
        if (bz.zielMinuten) await bildschirmzeitZielSetzen(Math.max(0, Number(bz.zielMinuten) || 0));
        if (bz.istZustandUeblich) setIstZustandFeld("ueblich", bz.istZustandUeblich);
        if (bz.istZustandTaetigkeit) setIstZustandFeld("taetigkeit", bz.istZustandTaetigkeit);
        if (bz.istZustandReduzieren) setIstZustandFeld("reduzieren", bz.istZustandReduzieren);
        return bz;
      }
      case "ernaehrung": {
        const m = await AIService.mahlzeitplanAusChat({ verlauf, coachName });
        if (!m.name?.trim()) throw new Error(t("onboarding.error.name"));
        const zutaten = m.zutaten?.length ? m.zutaten : [neueZutat()];
        const uhrzeit = m.uhrzeit || "08:00";
        const tage = m.wochentage?.length ? m.wochentage : [...WOCHENTAGE];
        const result = await mahlzeitHinzufuegen({ name: m.name, tageszeiten: [], hinweis: "", zutaten });
        if (!result?.ok) throw new Error(result?.error || t("onboarding.error.speichern"));
        const zuweisungen = await Promise.all(
          tage.map((tag) => wochenplanMahlzeitSetzen(tag, { mealId: result.meal.id, tageszeit: null, uhrzeit }))
        );
        const fehlgeschlagen = zuweisungen.find((z) => !z?.ok);
        if (fehlgeschlagen) throw new Error(fehlgeschlagen.error || t("onboarding.error.speichern"));
        setMahlzeitenListe((prev) => [...prev, { name: m.name.trim(), tage, uhrzeit, zutaten: zutaten.filter((z) => z.name.trim()) }]);
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
        const p = await AIService.supplementAusChat({ verlauf, coachName });
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
      default:
        throw new Error("Für diesen Bereich gibt es noch keine Assistenten-Begleitung.");
    }
  };

  const renderKategorieErgebnis = (ergebnis) => {
    let text = "Felder ausgefüllt — bitte kurz prüfen und unten speichern.";
    if (step.key === "training") {
      const anzahl = Array.isArray(ergebnis) ? ergebnis.length : 0;
      text = `${anzahl} Einheit${anzahl === 1 ? "" : "en"} in den Wochenplan übernommen.`;
    } else if (step.key === "gewohnheiten") {
      text = `"${ergebnis?.name || ""}" wurde direkt gespeichert.`;
    } else if (step.key === "ernaehrung") {
      text = `"${ergebnis?.name || ""}" wurde direkt in den Wochenplan übernommen.`;
    } else if (step.key === "hydration") {
      text = "Trinkziel wurde direkt gespeichert.";
    } else if (step.key === "tageslicht") {
      text = "Tageslicht-Ziel wurde direkt gespeichert.";
    } else if (step.key === "bildschirmzeit") {
      text = "Bildschirmzeit-Limit wurde direkt gespeichert.";
    }
    return <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>{text}</div>;
  };

  return (
    <Shell bereich={SCHRITT_ZU_KATEGORIE[step.key]}>
      <OnboardingNavArrows
        onBack={index > 0 || onBackToStart ? zurueck : undefined}
        backLabel={t("onboarding.zurueck")}
        // Bug-Fix: Während effectiveModus === "jetzt" (Formular gerade
        // ausgefüllt) rief dieser obere Pfeil unconditioned weiter(false)
        // auf — dasselbe "überspringen", das sonst nur "Später einrichten"
        // auslöst. Eingaben im Formular unten wurden dadurch stillschweigend
        // verworfen, sobald jemand naheliegenderweise den oberen "Weiter"-
        // Pfeil statt des eigentlichen Speichern-Buttons antippte. Jetzt
        // ausgeblendet (onForward={undefined}, siehe OnboardingNavArrows.jsx),
        // solange das Formular aktiv ist — Weiter geht dann nur noch über den
        // echten Speichern-Button im Formular.
        onForward={effectiveModus === "jetzt" ? undefined : () => weiter(false)}
        forwardLabel={tLabel("Weiter")}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 8, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textMuted }}>
            {t("onboarding.categories.progress", { current: index + 1 + PROTOKOLL_SCHRITT_OFFSET, total: PROTOKOLL_SCHRITTE_GESAMT })}
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
        </div>
      </div>
      <Stepper step={index + PROTOKOLL_SCHRITT_OFFSET} total={PROTOKOLL_SCHRITTE_GESAMT} />

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
            {/* Bug-Fix (Nutzerinnen-Report, 16.09.: "keine Symmetrie ... unten
                haben die zum Beispiel noch das Abbrechen"): Laborwerte/
                Routinen zeigen "Abbrechen" schon länger als eigenen Knopf
                unter den Haupt-Aktionen (siehe OnboardingLaborwerteView.jsx/
                OnboardingRoutinenView.jsx) — hier saß er bisher nur als
                kleiner Icon-Knopf (⌂) oben rechts neben "Alles überspringen".
                Jetzt derselbe Knopf am selben Ort wie überall sonst im
                Onboarding. */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: `1px solid ${cardBorder}`,
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease-out",
                }}
              >
                {tLabel("Abbrechen")}
              </button>
            )}
          </div>
        </Card>
      )}

      {effectiveModus === "jetzt" && (
        <>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
            Sag {getCoachName()}, was du hier einrichten möchtest — er füllt die Felder für dich aus.
          </div>
          {/* Bug-Fix (Nutzerinnen-Report, 16.09.: "bei Hydration ploppt das
              Fenster gleich komplett auf"): `autoStart` öffnete den Chat hier
              unaufgefordert, sobald "Jetzt einrichten" getippt wurde — anders
              als bei Laborwerte (siehe OnboardingLaborwerteView.jsx, Teil 111,
              genau dort schon als Bug behoben) und der neuen Routinen-Karte
              (siehe OnboardingRoutinenView.jsx) zeigt Aka jetzt überall
              einheitlich nur den schwebenden Orb-Knopf — ein Tap öffnet den
              Chat, statt dass er sich von selbst aufdrängt. */}
          <KiChat
            key={step.key}
            systemPrompt={KATEGORIE_COACH_PROMPTS[step.key]}
            einleitung={
              (KATEGORIE_EINLEITUNG[step.key] || (() => `Hi, ich bin ${getCoachName()}! Was möchtest du für "${tLabel(step.label)}" einrichten?`))(getCoachName())
            }
            onUebernehmen={onUebernehmenKategorie}
            uebernehmenLabel="Übernehmen"
            renderErgebnis={renderKategorieErgebnis}
          />
        <Card>
          {ISTZUSTAND_FRAGEN[step.key] && (
            <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: accentDark, marginBottom: 10 }}>{tLabel("Dein aktueller Stand")}</div>
              {ISTZUSTAND_FRAGEN[step.key].map((f) => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <Label>{tLabel(f.frage)}</Label>
                  <TextArea value={istZustand[f.key] || ""} onChange={(v) => setIstZustandFeld(f.key, v)} placeholder={f.placeholder} diktierbar />
                </div>
              ))}
            </div>
          )}

          {istMultiAdd && step.key !== "ernaehrung" && hinzugefuegt.length > 0 && (
            <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
              <Label>{t("onboarding.hinzugefuegt.label")}</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hinzugefuegt.map((item, i) => {
                  const istNeuester = i === hinzugefuegt.length - 1;
                  return (
                    <div
                      key={i}
                      ref={istNeuester ? neuesterEintragRef : null}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: accentSoft,
                        fontSize: 13,
                        fontWeight: 600,
                        animation: istNeuester ? "slideInSuccess 0.6s ease-out" : "none",
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step.key === "gewohnheiten" && (
            <>
              <Label>{t("onboarding.gewohnheiten.name.label")}</Label>
              <TextInput value={gName} onChange={setGName} placeholder={t("onboarding.gewohnheiten.name.placeholder")} diktierbar />
              <Label>{t("onboarding.gewohnheiten.menge.label")}</Label>
              <TextInput value={gMenge} onChange={setGMenge} placeholder={t("onboarding.gewohnheiten.menge.placeholder")} diktierbar />
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

          {step.key === "bildschirmzeit" && (
            <>
              <Label>{tLabel("Tageslimit in Minuten (Obergrenze, nicht Ziel zum Erreichen)")}</Label>
              <TextInput
                type="number"
                value={bildschirmzeitMinuten}
                onChange={setBildschirmzeitMinuten}
                placeholder={bildschirmzeitZielMinuten ? String(bildschirmzeitZielMinuten) : "z. B. 60"}
              />
              <div style={{ fontSize: 11, color: textMuted, marginTop: 4, marginBottom: 18 }}>
                {tLabel("Wie viel Bildschirmzeit möchtest du künftig maximal am Tag haben?")}
              </div>
              <ZeitErinnerungenCard kategorie="bildschirmzeit" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="20:00" />
            </>
          )}

          {step.key === "ernaehrung" && (
            <>
              <Label>{t("onboarding.ernaehrung.name.label")}</Label>
              <TextInput value={mahlName} onChange={setMahlName} placeholder={t("onboarding.ernaehrung.name.placeholder")} diktierbar />
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
                    <TextInput value={z.name} onChange={(v) => zutatAendern(i, "name", v)} placeholder={t("onboarding.ernaehrung.zutat.placeholder")} diktierbar />
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
                wochenplanBearbeiten={wochenplanBearbeiten}
                wochenplanEntfernen={wochenplanEntfernen}
                titel={null}
              />
            </>
          )}

          {step.key === "supplemente" && (
            <>
              <Label>{t("onboarding.supplemente.name.label")}</Label>
              <TextInput value={suppName} onChange={setSuppName} placeholder={t("onboarding.supplemente.name.placeholder")} diktierbar />
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
              <TextInput value={medName} onChange={setMedName} placeholder={t("onboarding.medikamente.name.placeholder")} diktierbar />
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

          {!istMultiAdd && (
            <div style={{ marginTop: 14 }}>
              <ZieldauerField value={ziel} onChange={setZiel} />
            </div>
          )}

          {error && <div style={{ color: danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {istMultiAdd ? (
              <>
                {/* Bug-Fix: ein echter Netzwerkfehler (nicht nur ein von
                    Supabase zurückgegebenes {error}) lief in hinzufuegen()
                    bisher ungefangen durch — setSaving(false) wurde dann nie
                    erreicht, der Button blieb für immer auf "Speichern..."
                    hängen, ohne jede Fehlermeldung/Möglichkeit, es erneut
                    zu versuchen. */}
                <PrimaryButton
                  onClick={() =>
                    hinzufuegen().catch((err) => {
                      console.error(err);
                      setError(err?.message || t("onboarding.error.speichern"));
                      setSaving(false);
                    })
                  }
                  disabled={saving}
                >
                  {saving ? t("onboarding.saving") : t("onboarding.hinzufuegen")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(hinzugefuegt.length > 0)}>
                  {hinzugefuegt.length > 0 ? tLabel("Weiter") : tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            ) : (
              <>
                {/* Bug-Fix: siehe hinzufuegen() oben — dieselbe Absicherung
                    gegen einen für immer auf "Speichern..." hängenden Button
                    bei echtem Netzwerkfehler. */}
                <PrimaryButton
                  onClick={() =>
                    speichernUndWeiter().catch((err) => {
                      console.error(err);
                      setError(err?.message || t("onboarding.error.speichern"));
                      setSaving(false);
                    })
                  }
                  disabled={saving}
                >
                  {saving ? t("onboarding.saving") : tLabel("Speichern & weiter")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
                  {tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: `1px solid ${cardBorder}`,
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease-out",
                }}
              >
                {tLabel("Abbrechen")}
              </button>
            )}
          </div>
        </Card>
        </>
      )}
    </Shell>
  );
}
