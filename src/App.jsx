import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useT } from "./i18n/translate";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import LoginView from "./views/LoginView";
import AuthenticatedApp from "./AuthenticatedApp";

function LoadingScreen() {
  const { t } = useT();
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>{t("common.loading")}</div>
    </Shell>
  );
}

function Root() {
  const { user, loading } = useAuth();
  const { proband } = useAdmin();
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginView />;
  return (
    // key erzwingt beim Betreten/Verlassen des "Verwalten als"-Modus einen
    // kompletten Remount von AppDataProvider + AuthenticatedApp — sonst
    // bliebe z. B. der view-State ("admin") oder alter Proband-State hängen.
    <AppDataProvider key={proband?.id || "self"}>
      <AuthenticatedApp />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminProvider>
          <Root />
        </AdminProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
