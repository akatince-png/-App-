import React, { useState } from "react";
import { markiereLiveNeuladen, useLiveAktualisierung } from "./data/liveAktualisierung";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useT } from "./i18n/translate";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import LoginView from "./views/LoginView";
import InviteAcceptView from "./views/InviteAcceptView";
import AuthenticatedApp from "./AuthenticatedApp";
import { ErrorBoundary } from "./ui/ErrorBoundary";

function LoadingScreen() {
  const { t } = useT();
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>{t("common.loading")}</div>
    </Shell>
  );
}

function Root() {
  const { user, loading, invitePending } = useAuth();
  const { proband } = useAdmin();
  // Live-Aktualisierung (28.09.): speichert der Coach im Verwalten-Modus
  // etwas für diese Person, lädt ihre App die Daten neu (gleiche Seite).
  const [liveStand, setLiveStand] = useState(0);
  useLiveAktualisierung(user?.id, !!user && !proband, () => {
    markiereLiveNeuladen();
    setLiveStand((n) => n + 1);
  });
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginView />;
  // Einladungs-/Passwort-Vergessen-Link angeklickt (siehe AuthContext.jsx)
  // — erst ein eigenes Passwort setzen lassen, bevor die eigentliche App
  // (inkl. Onboarding) startet.
  if (invitePending) return <InviteAcceptView />;
  return (
    // key erzwingt beim Betreten/Verlassen des "Verwalten als"-Modus einen
    // kompletten Remount von AppDataProvider + AuthenticatedApp — sonst
    // bliebe z. B. der view-State ("admin") oder alter Proband-State hängen.
    <AppDataProvider key={proband?.id || `self-${liveStand}`}>
      <AuthenticatedApp />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminProvider>
          <ErrorBoundary>
            <Root />
          </ErrorBoundary>
        </AdminProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
