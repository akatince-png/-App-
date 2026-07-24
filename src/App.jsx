import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
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
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginView />;
  return (
    <AppDataProvider>
      <AuthenticatedApp />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </LanguageProvider>
  );
}
