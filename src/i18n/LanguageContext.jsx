import React, { createContext, useContext, useState } from "react";

const STORAGE_KEY = "myprotocols_lang";

export const LanguageContext = createContext(null);

// Sprachwahl fürs UI (Deutsch/Englisch) — unabhängig vom eigentlichen Login,
// deshalb in localStorage statt in der Datenbank: gilt pro Gerät, nicht pro
// Konto, und ist so auch schon vor dem Login (LoginView) verfügbar.
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return stored === "en" ? "en" : "de";
  });

  const setLang = (next) => {
    const val = next === "en" ? "en" : "de";
    setLangState(val);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, val);
  };

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage muss innerhalb von LanguageProvider verwendet werden.");
  return ctx;
}
