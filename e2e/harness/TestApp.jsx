import React from "react";
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

export default function TestApp() {
  const appData = baueMockAppData(MOCK_USER_ID);
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
