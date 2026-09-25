import React, { useState } from "react";
import { LanguageProvider } from "../../src/i18n/LanguageContext";
import { AdminProvider } from "../../src/context/AdminContext";
import { AuthContext } from "../../src/context/AuthContext";
import { AppDataContext } from "../../src/context/AppDataContext";
import AuthenticatedApp from "../../src/AuthenticatedApp";
import { baueMockAppData } from "./mockAppData";

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
  const overrides = {};
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
  // ?teilt=1:  // ?teilt=1: eigene Punkte in der Rangliste geteilt (Standard: aus, 24.09.).
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
  // ?beispiel=1: ein realistischer Tag (Morgenroutine, Medikament,
  // Supplement, Gewohnheit) für Design-Vorschauen.
  if (params.get("beispiel") === "1") {
    overrides.hormonPlan = [{ date: new Date(), name: "Elvanse", uhrzeit: "08:00", menge: "30 mg" }];
    overrides.supplemente = [{ id: "s1", name: "Vitamin D3", tageszeiten: ["morgens"], hinweis: "1 Kapsel zum Frühstück" }];
    overrides.gewohnheiten = [{ id: "g1", name: "10 Minuten Spaziergang", uhrzeit: "12:30", wochentage: [0, 1, 2, 3, 4, 5, 6], aktiv: true }];
    overrides.routineSchritte = [
      { id: "r1", routine: "morgen", reihenfolge: 1, name: "Wasser trinken", dauerMin: 1 },
      { id: "r2", routine: "morgen", reihenfolge: 2, name: "Zähne putzen", dauerMin: 3 },
      { id: "r3", routine: "abend", reihenfolge: 1, name: "Handy weglegen", dauerMin: 1 },
    ];
  }
  return overrides;
}

export default function TestApp() {
  // Coachee-Ansicht eines Admin-Kontos (AnsichtUmschalter) als echter
  // State, damit der Umschalter im Test wirklich umschaltet.
  const [coacheeAnsicht, setCoacheeAnsicht] = useState(false);
  const overrides = leseOverridesAusUrl();
  const istAdminKonto = overrides.istAdminKonto ?? true;
  const appData = baueMockAppData(MOCK_USER_ID, {
    ...overrides,
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
            <AuthenticatedApp />
          </AppDataContext.Provider>
        </AuthContext.Provider>
      </AdminProvider>
    </LanguageProvider>
  );
}
