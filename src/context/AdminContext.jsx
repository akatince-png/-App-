import React, { createContext, useCallback, useContext, useState } from "react";

// Trägt, welche Probandin/welcher Proband gerade stellvertretend verwaltet
// wird ("Verwalten als"-Modus, siehe AdminDashboardView.jsx) — null heißt:
// die eingeloggte Person sieht/nutzt die App ganz normal als sich selbst.
// Bewusst NICHT persistiert (kein sessionStorage o. ä.): bei jedem Neuladen
// der Seite startet man wieder im eigenen Konto, damit niemand aus Versehen
// dauerhaft im fremden Konto hängen bleibt.
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [proband, setProband] = useState(null); // { id, email, vorname } | null

  const verwalteAls = useCallback((p) => setProband(p), []);
  const verlasseVerwaltung = useCallback(() => setProband(null), []);

  return <AdminContext.Provider value={{ proband, verwalteAls, verlasseVerwaltung }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin muss innerhalb von AdminProvider verwendet werden.");
  return ctx;
}
