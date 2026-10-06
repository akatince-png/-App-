import React, { useState } from "react";
import { LanguageProvider } from "../../src/i18n/LanguageContext";
import { AdminProvider, useAdmin } from "../../src/context/AdminContext";
import { AuthContext } from "../../src/context/AuthContext";
import { AppDataContext } from "../../src/context/AppDataContext";
import AuthenticatedApp from "../../src/AuthenticatedApp";
import { baueMockAppData } from "./mockAppData";
import { setzeKiErlaubt } from "../../src/utils/kiEinwilligung";

// Rendert die App OHNE echtes Supabase/echte Auth — AuthProvider und
// AppDataProvider (beide würden echte Netzwerkaufrufe machen) werden
// bewusst übersprungen und durch <Context.Provider value={mock}> ersetzt.
// AdminProvider bleibt real (reiner lokaler State, keine Netzwerkaufrufe,
// siehe AdminContext.jsx).
const MOCK_USER_ID = "e2e-test-user";

const mockAuthValue = {
  session: { user: { id: MOCK_USER_ID, email: "e2e@test.local" } },
  user: { id: MOCK_USER_ID, email: "e2e@test.local" },
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
  invitePending: false,
  clearInvitePending: () => {},
};

// Test-Steuerung über URL-Parameter statt separater Harness-Einstiegspunkte
// — ?onboarding=1 simuliert einen frischen Account (onboardingComplete:
// false), ?isAdmin=0 einen nicht-administrativen Account. Ausschließlich
// für e2e/*.spec.js gedacht, wirkt sich auf die echte App nicht aus.
function leseOverridesAusUrl() {
  const params = new URLSearchParams(window.location.search);
  // ?startvariante=b: Schnellzugriff in der Leiste (30.09., Vorschau).
  try {
    if (params.get("startvariante")) localStorage.setItem("mp-start-variante", params.get("startvariante"));
    // Ohne Angabe Variante A, damit die älteren Tests die vier Knöpfe finden.
    else localStorage.setItem("mp-start-variante", "a");
    // Morgen-/Abendfenster (06.10.) nur mit ?morgen=1 / ?abend=1 – sonst würde es morgens alle Startseiten-Tests verdecken.
    for (const art of ["morgen", "abend"]) {
      if (params.get(art) === "1") localStorage.removeItem(`aka-${art}fenster-aus`);
      else localStorage.setItem(`aka-${art}fenster-aus`, "1");
    }
  } catch {
    /* ohne Speicher: Variante A */
  }
  const overrides = {};
  // Einwilligungen (28.09.): standardmäßig erteilt; ?einwilligung=0 zeigt den
  // Einwilligungs-Schritt, ?ki=0 = KI nicht erlaubt.
  const kiErlaubtParam = params.get("ki") !== "0";
  setzeKiErlaubt(kiErlaubtParam);
  overrides.einwilligung =
    params.get("einwilligung") === "0"
      ? { datenschutzAm: null, kiAm: null, geladen: true }
      : { datenschutzAm: "2026-09-01T08:00:00.000Z", kiAm: kiErlaubtParam ? "2026-09-01T08:00:00.000Z" : null, geladen: true };
  if (params.get("onboarding") === "1") overrides.onboardingComplete = false;
  if (params.get("isAdmin") === "0") {
    overrides.isAdmin = false;
    overrides.istAdminKonto = false;
  }
  // ?team=1: Mitglied in einem Beispiel-Team (Team-Seite, 24.09.).
  if (params.get("team") === "1") {
    overrides.team = { id: "e2e-team-1", name: "Team Sonnenaufgang" };
    overrides.teamKollegen = [
      { id: "e2e-lena", vorname: "Lena", profilbild_pfad: null },
      { id: "e2e-mira", vorname: "Mira", profilbild_pfad: null },
    ];
  }
  // ?coachnachricht=1: ungelesene Nachricht vom Coach (Coach-Chat, 24.09.).
  if (params.get("coachnachricht") === "1") {
    overrides.coacheeNachrichten = [{ id: "n9", text: "Hi, wie läuft deine Woche?", gelesen: false, absender: "coach", erstelltAm: new Date().toISOString() }];
  }
  // ?spaet=1: Morgenroutine an 3 der letzten 5 Tage deutlich später als
  // geplant (06:00) — Karte "Passt deine Zeit noch?" (25.09.).
  if (params.get("spaet") === "1") {
    const h = new Date();
    const lauf = (n, std, min) => {
      const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() - n, std, min);
      const datum = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { id: `d${n}`, routine: "morgen", datum, schritte: [], gestartetUm: d.toISOString(), abgeschlossenUm: d.toISOString() };
    };
    overrides.routineSchritte = [{ id: "r1", routine: "morgen", reihenfolge: 1, name: "Wasser trinken", dauerMin: 1 }];
    overrides.routineEinstellungen = { morgen: { routine: "morgen", startZeit: "06:00", endZeit: "09:00" } };
    overrides.routineDurchlaeufe = [lauf(1, 8, 40), lauf(2, 8, 50), lauf(3, 6, 5), lauf(4, 9, 0)];
    overrides.protokollEintraege = [];
  }
  // ?schicht=1: Schichtarbeit (25.09.) — Früh/Spät/Frei, heute Frühschicht,
  // morgen Spätschicht. ?schicht=leer: Seite ohne Varianten.
  if (params.get("schicht") === "1") {
    const h = new Date();
    const iso = (n) => {
      const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    overrides.routineVarianten = [
      { id: "vf", name: "Frühschicht", icon: "🌅", arbeitVon: "06:00", arbeitBis: "14:00", morgenStart: "04:30", abendStart: "21:00", reihenfolge: 0 },
      { id: "vs", name: "Spätschicht", icon: "🌆", arbeitVon: "14:00", arbeitBis: "22:00", morgenStart: "09:30", abendStart: "23:45", reihenfolge: 1 },
      { id: "vx", name: "Frei", icon: "🌿", arbeitVon: "", arbeitBis: "", morgenStart: "08:00", abendStart: "22:30", reihenfolge: 2 },
    ];
    overrides.routineSchichtplan = {
      [iso(0)]: { datum: iso(0), varianteId: "vf", art: "variante" },
      [iso(1)]: { datum: iso(1), varianteId: "vs", art: "variante" },
    };
    overrides.routineEinstellungen = { morgen: { routine: "morgen", startZeit: "06:00", endZeit: "08:00" }, abend: { routine: "abend", startZeit: "22:00", endZeit: "" } };
    overrides.routineSchritte = [{ id: "r1", routine: "morgen", reihenfolge: 1, name: "Wasser trinken", dauerMin: 1 }];
  }
  // ?atem=1: feste Atem-Zeit am Morgen (25.09.).
  if (params.get("atem") === "1") {
    overrides.atemZeiten = [{ id: "z1", uhrzeit: "07:10", uebungKey: "energie", dauerMinuten: 2, aktiv: true }];
    overrides.atemuebungLogs = [];
  }
  // ?tagebuch=1: 16 Tagebuch-Einträge (gute Tage draußen, schwere mit Zucker).
  if (params.get("tagebuch") === "1") {
    const h = new Date();
    const iso = (n) => {
      const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    overrides.tagebuchEintraege = Array.from({ length: 16 }, (_, i) => {
      const gut = i % 3 !== 0;
      return { datum: iso(16 - i), stimmung: gut ? 4 : 2, orte: gut ? ["🌳 Natur / draußen"] : ["🏠 Zuhause"], personen: [], essen: gut ? [] : ["viel Zucker"], tagesart: [], koerper: [], notiz: "", notizTeilen: false, auto: { draussenMin: gut ? 50 : 5 } };
    });
  }
  // ?programm=wartet: Einstellungsphase freigeschaltet, Start noch offen (26.09.).
  if (params.get("programm") === "wartet") overrides.kernStand = { aktiv: false, etappe: null, wartet: true };
  // ?kern=1..4: AKA-Kernprogramm in Einführungswoche N (25.09.);
  // ?kern=erhaltung: Etappe 2 (Erhaltung) läuft, 2. Woche.
  const kern = params.get("kern");
  if (kern) {
    const h = new Date();
    const iso = (n) => {
      const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    if (kern === "geplant") {
      // ?kern=geplant: Start ist morgen abend (27.09., Tour-Vorschau).
      overrides.kernEtappen = [{ id: "k1", nummer: 1, art: "einfuehrung", start: iso(1), ende: iso(28), status: "laufend" }];
    } else if (kern === "erhaltung") {
      overrides.kernEtappen = [
        { id: "k1", nummer: 1, art: "einfuehrung", start: iso(-35), ende: iso(-8), status: "abgeschlossen", gespraechAm: iso(-7) },
        { id: "k2", nummer: 2, art: "erhaltung", start: iso(-7), ende: iso(20), status: "laufend" },
      ];
    } else {
      const w = Number(kern);
      overrides.kernEtappen = [{ id: "k1", nummer: 1, art: "einfuehrung", start: iso(-(w - 1) * 7), ende: iso(27 - (w - 1) * 7), status: "laufend" }];
    }
    overrides.routineSchritte = [
      { id: "ks1", routine: "morgen", reihenfolge: 0, name: "💧 Glas Wasser", dauerMin: 1, kernKey: "wasser" },
      { id: "ks2", routine: "morgen", reihenfolge: 1, name: "Zähne putzen", dauerMin: 3, kernKey: null },
    ];
    overrides.trainingWochenplan = [];
  }
  // ?atemschritt=1 (mit ?kern=1): Kernprogramm-Schritt „Atemübung (2 Min.)“ (29.09.).
  if (params.get("atemschritt") === "1") {
    overrides.routineSchritte = [...(overrides.routineSchritte || []), { id: "ks3", routine: "morgen", reihenfolge: 2, name: "🌬️ Atemübung (2 Min.)", dauerMin: 2, kernKey: "atem_morgen" }];
  }
  // ?mess=1 (mit ?kern=1): drei gemessene Morgenroutinen in der Messwoche (26.09.).
  if (params.get("mess") === "1") {
    const h = new Date();
    const heute = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
    overrides.routineDurchlaeufe = [170, 180, 190].map((sek, i) => ({
      id: `md${i}`,
      routine: "morgen",
      datum: heute,
      gestartetUm: `${heute}T06:00:00`,
      abgeschlossenUm: `${heute}T06:${String(20 + i * 5).padStart(2, "0")}:00`,
      schritte: [{ schrittId: "ks2", name: "Zähne putzen", geplantMin: 3, tatsaechlichSek: sek }],
    }));
  }
  // ?essen=1: Ernährungsziel + zwei Einträge heute (25.09.).
  if (params.get("essen") === "1") {
    const h = new Date();
    const heute = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
    overrides.personalData = { gewichtStart: 82, geschlecht: "Männlich", geburtsdatum: "1981-05-01", groesse: 182 };
    overrides.categoryZiele = { ernaehrung: { ziel: "abnehmen", kalorienZiel: 2100, eiweissGProKg: 1.8, fettProzent: 30, omega3Mg: 250, omega6zu3Max: 5, fischProWoche: 2, quellen: { eiweiss: ["Skyr/Quark", "Eier"] } } };
    overrides.essenEintraege = [
      { id: "es1", datum: heute, uhrzeit: "07:30", text: "Rührei aus 3 Eiern und 2 Scheiben Vollkornbrot", posten: [], werte: { kcal: 548, eiweiss: 32, fett: 22, kh: 39, zucker: 4, ballast: 5, omega3: 400, epaDha: 190, omega6: 5900 } },
      { id: "es2", datum: heute, uhrzeit: "12:45", text: "125 g Lachs, 250 g Kartoffeln, Brokkoli", posten: [], werte: { kcal: 520, eiweiss: 38, fett: 16, kh: 52, zucker: 3, ballast: 8, omega3: 3100, epaDha: 2900, omega6: 2500 } },
    ];
  }
  // ?ereignisse=1: spontan Passiertes heute (30.09.) – Getränk, Snack, Nickerchen.
  if (params.get("ereignisse") === "1") {
    const h = new Date();
    const heute = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
    overrides.spontanEintraege = [
      { id: "sp1", art: "getraenk", datum: heute, uhrzeit: "08:10", mengeMl: 330, name: "Kaffee" },
      { id: "sp2", art: "nickerchen", datum: heute, uhrzeit: "13:30", dauerMin: 20, name: "" },
    ];
    overrides.essenEintraege = [...(overrides.essenEintraege || []), { id: "es9", datum: heute, uhrzeit: "10:15", text: "Apfel und Handvoll Nüsse", posten: [], werte: { kcal: 260 } }];
  }
  // ?teilt=1: eigene Punkte in der Rangliste geteilt (Standard: aus, 24.09.).
  if (params.get("teilt") === "1") overrides.ranglisteSichtbar = true;
  // ?gruppe=1 (mit ?team=1): ein laufendes Gruppenprotokoll (24.09.).
  if (params.get("gruppe") === "1") {
    const heute = new Date();
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const tag = (n) => iso(new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - n));
    const erledigt = new Set([`e2e-lena|gb1|${tag(0)}`, `e2e-lena|gb1|${tag(1)}`, `e2e-test-user|gb1|${tag(1)}`, `e2e-lena|gb2|${tag(0)}`]);
    overrides.gruppenprotokolle = [
      {
        id: "gp1",
        team_id: "e2e-team-1",
        name: "21 Tage Morgenroutine",
        ziel: "Jeden Morgen gut in den Tag starten",
        startdatum: tag(3),
        enddatum: iso(new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + 17)),
        status: "active",
        bausteine: [
          { id: "gb1", art: "morgenroutine", name: "Morgenroutine abschließen", icon: "🌅", reihenfolge: 0 },
          { id: "gb2", art: "eigen", name: "10 Min. frische Luft", icon: "🌱", reihenfolge: 1 },
        ],
        quests: [{ id: "gq1", titel: "Gemeinsam 10× Morgenroutine", baustein_id: "gb1", ziel_anzahl: 10, belohnung: "Pizza-Abend" }],
        stand: {
          mitglieder: [
            { userId: "e2e-test-user", vorname: "Aka", profilbildPfad: null, privat: false },
            { userId: "e2e-lena", vorname: "Lena", profilbildPfad: null, privat: false },
          ],
          erledigt,
        },
      },
    ];
    overrides.eigeneGruppenLogs = [];
  }
  // ?fokus=1: Gemeinsam fokussieren (27.09.) – Team mit zwei Leuten, die
  // gerade fokussieren, und einem geteilten Erfolg von heute früh.
  if (params.get("fokus") === "1") {
    const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
    overrides.team = { id: "t1", name: "Team Sonne" };
    overrides.teamKollegen = [
      { id: "u2", vorname: "Anna" },
      { id: "u3", vorname: "Jonas" },
    ];
    overrides.fokusSitzungen = [
      { id: "f1", userId: "u2", ziel: "Bewerbung fertig schreiben", dauerMinuten: 25, startUm: vor(8), beendetUm: null, ergebnis: null, teilen: true },
      { id: "f2", userId: "u3", ziel: "", dauerMinuten: 50, startUm: vor(20), beendetUm: null, ergebnis: null, teilen: true },
      { id: "f3", userId: "u2", ziel: "Küche aufräumen", dauerMinuten: 15, startUm: vor(Math.min(180, new Date().getHours() * 60)), beendetUm: vor(1), ergebnis: "geschafft", teilen: true },
    ];
    overrides.fokusRunden = [];
  }
  // ?beispiel=1: ein realistischer Tag (Morgenroutine, Medikament,
  // Supplement, Gewohnheit) für Design-Vorschauen.
  // ?spontan=1: Training + Workflow für heute geplant, dazu Pläne (30.09.).
  if (params.get("spontan") === "1") {
    const wt = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date().getDay()];
    overrides.trainingWochenplan = [{ id: "tw-heute", wochentag: wt, name: "Laufen", uhrzeit: "17:00", arten: ["Cardio"] }];
    overrides.trainingTemplates = [
      { id: "tp1", name: "30-Min-Ganzkörper", art: "Krafttraining", uebungen: [{ name: "Kniebeugen", saetze: "3", wiederholungen: "12", gewicht: "", pauseSekunden: "60" }] },
      { id: "tp2", name: "HIIT 20", art: "Bodyweight", uebungen: [], intervallArbeitSek: 40, intervallPauseSek: 20, runden: 10 },
    ];
    overrides.workflowPresets = [{ id: "wp1", name: "Deep Work", arbeitMin: 50, pauseMin: 10, gesamtMin: 120, modus: "durchgehend" }];
    overrides.workflowPlaene = [{ id: "pl1", presetId: "wp1", wochentage: [], uhrzeit: "14:00", aktiv: true }];
  }
  // ?matrix=1: Aufgaben-Matrix mit Beispiel-Projekt (30.09., Vorschau).
  if (params.get("matrix") === "1") {
    const tagIso = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    overrides.projekte = [{ id: "p-steuer", name: "Steuer 2025", farbeIndex: 0 }, { id: "p-umzug", name: "Umzug", farbeIndex: 1 }];
    overrides.matrixAufgaben = [
      { id: "m1", projektId: "p-steuer", titel: "Antrag abschicken", wichtig: true, frist: tagIso(1), dauerMin: 20, naechsterSchritt: "", verschoben: 0 },
      { id: "m2", projektId: "p-steuer", titel: "Belege fotografieren", wichtig: true, frist: tagIso(0), dauerMin: 10, naechsterSchritt: "Schuhkarton mit Belegen holen", verschoben: 0 },
      { id: "m3", projektId: "p-steuer", titel: "Ordner sortieren", wichtig: true, frist: tagIso(9), dauerMin: 30, geplantAm: tagIso(0), naechsterSchritt: "", verschoben: 3 },
      { id: "m4", projektId: "p-steuer", titel: "Steuerberater fragen", wichtig: true, frist: null, naechsterSchritt: "", verschoben: 0 },
      { id: "m5", projektId: "p-umzug", titel: "Mail an Vermieter", wichtig: false, frist: tagIso(0), dauerMin: 5, naechsterSchritt: "", verschoben: 0 },
      { id: "m6", projektId: "p-umzug", titel: "Alte Quittungen scannen", wichtig: false, frist: null, naechsterSchritt: "", verschoben: 0 },
    ];
  }
  // ?alltag=1: Kalender „Mein Alltag“ mit Beispiel-Einträgen (28.09., Vorschau).
  if (params.get("alltag") === "1") {
    const iso0 = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    overrides.routineEinstellungen = { morgen: { startZeit: "06:30", endZeit: "07:30" }, abend: { startZeit: "21:30", endZeit: "22:30" } };
    overrides.programmTeilnahmen = [{ id: "pt-a", programmId: "alltag", status: "laufend", start: iso0(-1), einstellungen: {} }];
    overrides.alltagBereiche = [{ id: "b-kinder", name: "Kinder", icon: "👶", farbeIndex: 0 }];
    overrides.alltagErledigt = {};
    overrides.alltagEintraege = [
      { id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:30", ende: "16:30", wochentage: ["Mo", "Di", "Mi", "Do"] },
      { id: 2, bereich: "arbeit", titel: "Arbeit (Homeoffice)", start: "08:30", ende: "13:00", wochentage: ["Fr"] },
      { id: 3, bereich: "haushalt", titel: "Staubsaugen", start: "10:00", ende: "10:45", wochentage: ["Sa"] },
      { id: 4, bereich: "haushalt", titel: "Wäsche", start: "19:00", ende: "19:30", wochentage: ["Mi"] },
      { id: 5, bereich: "haushalt", titel: "Einkaufen", start: "17:00", ende: "17:45", wochentage: ["Fr"] },
      { id: 6, bereich: "hobby", titel: "Gitarre", start: "19:30", ende: "20:30", wochentage: ["Di", "Do"] },
      { id: 7, bereich: "sozial", titel: "Familie", start: "14:00", ende: "17:00", wochentage: ["So"] },
      { id: 9, bereich: "metime", titel: "Sauna", start: "18:30", ende: "20:00", wochentage: ["So"] },
      { id: 10, bereich: "eigen", bereichId: "b-kinder", titel: "Kita abholen", start: "16:45", ende: "17:15", wochentage: ["Mo", "Di", "Mi", "Do"] },
      { id: 8, bereich: "termin", titel: "Zahnarzt", start: "15:00", ende: "16:00", datum: iso0(2) },
    ];
    overrides.trainingWochenplan = [
      { id: "tw1", wochentag: "Mo", name: "Krafttraining", uhrzeit: "17:30", arten: ["Krafttraining"] },
      { id: "tw2", wochentag: "Mi", name: "Laufen", uhrzeit: "17:00", arten: ["Cardio"] },
      { id: "tw3", wochentag: "Sa", name: "Krafttraining", uhrzeit: "11:30", arten: ["Krafttraining"] },
    ];
  }
  if (params.get("beispiel") === "1") {
    overrides.hormonPlan = [{ date: new Date(), name: "Elvanse", uhrzeit: "08:00", menge: "30 mg" }];
    overrides.supplemente = [{ id: "s1", name: "Vitamin D3", tageszeiten: ["morgens"], hinweis: "1 Kapsel zum Frühstück" }];
    overrides.gewohnheiten = [
      { id: "g1", name: "10 Minuten Spaziergang", uhrzeit: "12:30", wochentage: [0, 1, 2, 3, 4, 5, 6], aktiv: true },
      // Bild-Tagesplan (27.09.): Gewohnheiten mit Symbol + Dauer.
      { id: "g2", name: "Wäsche machen", icon: "🧺", uhrzeit: "09:30", dauerMin: 30, wochentage: [0, 1, 2, 3, 4, 5, 6], aktiv: true },
      { id: "g3", name: "Steuerunterlagen sortieren", icon: "🧾", uhrzeit: "", dauerMin: 25, wochentage: [0, 1, 2, 3, 4, 5, 6], aktiv: true },
    ];
    // Mit ?alltag=1 (Arbeit 8:30–16:30) liegt die Wäsche sinnvoll am Abend
    // statt mitten in der Arbeitszeit (Nutzerin 28.09.: Beispiele müssen stimmen).
    if (params.get("alltag") === "1") overrides.gewohnheiten[1] = { ...overrides.gewohnheiten[1], uhrzeit: "18:15" };
    overrides.routineEinstellungen = { morgen: { routine: "morgen", startZeit: "06:30" }, abend: { routine: "abend", startZeit: "21:30" } };
    overrides.routineSchritte = [
      { id: "r1", routine: "morgen", reihenfolge: 1, name: "Wasser trinken", dauerMin: 1 },
      { id: "r2", routine: "morgen", reihenfolge: 2, name: "Zähne putzen", dauerMin: 3 },
      { id: "r3", routine: "abend", reihenfolge: 1, name: "Handy weglegen", dauerMin: 1 },
    ];
  }
  return overrides;
}

// Wie App.jsx: beim Wechsel in/aus "Verwalten als" neu aufbauen (27.09.,
// damit der Direkt-Sprung der Einrichtungs-Checkliste testbar ist).
function MitVerwaltungsSchluessel() {
  const { proband } = useAdmin();
  return <AuthenticatedApp key={proband?.id || "self"} />;
}

export default function TestApp() {
  // Coachee-Ansicht eines Admin-Kontos (AnsichtUmschalter) als echter
  // State, damit der Umschalter im Test wirklich umschaltet.
  const [coacheeAnsicht, setCoacheeAnsicht] = useState(false);
  const overrides = leseOverridesAusUrl();
  const istAdminKonto = overrides.istAdminKonto ?? true;
  // Gemeinsam fokussieren (27.09.): echte Zustandsänderung, damit der Ablauf
  // Start → Ring → "Wie lief's?" im Test durchspielbar ist.
  const [fokusSitzungen, setFokusSitzungen] = useState(() => overrides.fokusSitzungen || []);
  const fokusFunktionen = {
    fokusSitzungen,
    eigeneFokusSitzungen: fokusSitzungen.filter((x) => x.userId === MOCK_USER_ID),
    fokusRunden: overrides.fokusRunden || [],
    fokusStarten: async ({ ziel = "", dauerMinuten = 25, rundeId = null, teilen = true }) => {
      const sitzung = { id: `f${Date.now()}`, userId: MOCK_USER_ID, rundeId, ziel, dauerMinuten, startUm: new Date().toISOString(), beendetUm: null, ergebnis: null, teilen };
      setFokusSitzungen((p) => [...p, sitzung]);
      return { ok: true, sitzung };
    },
    fokusAbschliessen: async (id, ergebnis) => {
      setFokusSitzungen((p) => p.map((x) => (x.id === id ? { ...x, ergebnis, beendetUm: new Date().toISOString() } : x)));
      return { ok: true };
    },
    fokusNeuLaden: async () => {},
  };
  const appData = baueMockAppData(MOCK_USER_ID, {
    ...overrides,
    ...fokusFunktionen,
    istAdminKonto,
    isAdmin: istAdminKonto && !coacheeAnsicht,
    coacheeAnsicht,
    setCoacheeAnsicht,
  });
  return (
    <LanguageProvider>
      <AdminProvider>
        <AuthContext.Provider value={mockAuthValue}>
          <AppDataContext.Provider value={appData}>
            <MitVerwaltungsSchluessel />
          </AppDataContext.Provider>
        </AuthContext.Provider>
      </AdminProvider>
    </LanguageProvider>
  );
}
