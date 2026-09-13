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

  // Bug-Fix (13.09., Teil 60 der App-weiten Durchsuchung): getSession() und
  // onAuthStateChange() liefen bisher unabhängig voneinander — löste
  // onAuthStateChange (z. B. beim Öffnen eines Einladungs-/Recovery-Links,
  // wo laut Kommentar oben ohnehin schon mit dem URL-Hash jongliert wird)
  // zuerst mit der korrekten, neuen Session aus, konnte die danach noch
  // auflösende getSession()-Antwort sie mit einem veralteten Stand
  // überschreiben. `bereitsAusgeloest` verhindert das: sobald
  // onAuthStateChange einmal gefeuert hat, überschreibt die
  // getSession()-Antwort die Session nicht mehr, setzt aber weiterhin
  // sicherheitshalber `loading` auf false, falls onAuthStateChange aus
  // irgendeinem Grund vorher nie feuert.
  useEffect(() => {
    let bereitsAusgeloest = false;
    // Gleiches Muster wie in den übrigen Lade-Hooks (z. B.
    // useProtocolData.js): verhindert, dass eine spät auflösende Antwort
    // (React-StrictMode-Doppel-Mount im Dev-Modus) nach dem Cleanup dieses
    // Effekts noch State setzt.
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      bereitsAusgeloest = true;
      if (cancelled) return;
      setSession(newSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!bereitsAusgeloest) setSession(data.session);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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

// Für die E2E-Testsuite (e2e/harness/TestApp.jsx), gleiches Muster wie
// AppDataContext.jsx.
export { AuthContext };
