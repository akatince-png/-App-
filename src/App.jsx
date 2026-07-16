import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import { Shell } from "./ui/primitives";
import { textMuted } from "./ui/theme";
import LoginView from "./views/LoginView";
import AuthenticatedApp from "./AuthenticatedApp";

function LoadingScreen() {
  return (
    <Shell>
      <div style={{ textAlign: "center", marginTop: 120, color: textMuted, fontSize: 14 }}>Lädt...</div>
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
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
