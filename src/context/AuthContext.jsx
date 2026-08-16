import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

// Erkennt einen Einladungs- oder Passwort-Vergessen-Link (Supabase hängt
// "type=invite"/"type=recovery" an den URL-Hash) — einmalig beim Laden
// gelesen, BEVOR der Supabase-Client den Hash beim Session-Aufbau
// aufräumt. Steuert in App.jsx, ob statt der normalen App erst
// InviteAcceptView (Passwort festlegen) gezeigt wird. Wirkt sich NICHT auf
// den normalen Login/Logout aus — ohne diese URL-Parameter bleibt es bei
// false, wie bisher.
function leseEinladungsTypAusUrl() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const type = params.get("type");
  return type === "invite" || type === "recovery";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invitePending, setInvitePending] = useState(leseEinladungsTypAusUrl);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signOut,
    invitePending,
    clearInvitePending: () => setInvitePending(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden.");
  return ctx;
}
