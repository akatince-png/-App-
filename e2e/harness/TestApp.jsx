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
