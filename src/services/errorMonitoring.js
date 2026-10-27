import * as Sentry from "@sentry/react";
import { supabase } from "../lib/supabaseClient";

// Fehler-Frühwarnsystem (14.09., Nutzerinnen-Vorgabe aus dem App-Bauplan):
// ohne das erfährt man von einem echten Absturz draußen bei der Nutzung
// nur, wenn er zufällig gemeldet wird. Bewusst mit einer Ausschalt-
// Möglichkeit, statt Sentry hart vorauszusetzen — diese Umgebung hat
// keinen Sentry-Zugang, die Nutzerin muss selbst ein (kostenloses) Sentry-
// Projekt anlegen und die DSN in ihrer echten .env-Datei/Vercel-
// Umgebungsvariable eintragen (siehe .env.example). Ohne gesetzte DSN
// bleibt initErrorMonitoring() ein reines No-op, die App läuft ganz normal
// weiter — Sentry ist ein Zusatz, keine Voraussetzung.
export function initErrorMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    // "development" vs. "production" — hilft beim Filtern in Sentry, damit
    // lokale Testläufe nicht mit echten Nutzerinnen-Abstürzen vermischt
    // werden.
    environment: import.meta.env.MODE,
    // Bewusst niedrig gehalten: Performance-Tracing ist für eine
    // Einzelnutzer-App kein Schwerpunkt, würde aber unnötig Sentry-
    // Kontingent verbrauchen.
    tracesSampleRate: 0.1,
  });
}

// Von ErrorBoundary.jsx aufgerufen, sobald sie einen Absturz auffängt —
// meldet ihn an Sentry (falls aktiv), zusätzlich zur eigenen
// console.error-Ausgabe. Kein Fehler, falls Sentry nicht initialisiert
// wurde (captureException ist dann einfach wirkungslos).
export function meldeAbsturz(fehler, componentStack) {
  Sentry.captureException(fehler, { extra: { componentStack } });
  // Eigene Fehler-Erfassung (27.10., Migration 0138): ohne Sentry-Zugang
  // landet jeder Absturz in public.app_fehler, damit Claude die Ursache
  // lesen kann (Nutzerin: „die App hat immer wieder Probleme“).
  speichereAbsturz(fehler, componentStack);
}

async function speichereAbsturz(fehler, componentStack) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;
    await supabase.from("app_fehler").insert({
      user_id: userId,
      nachricht: String(fehler?.message || fehler || "").slice(0, 1000),
      stack: String(fehler?.stack || "").slice(0, 4000),
      komponenten: String(componentStack || "").slice(0, 4000),
      adresse: String(globalThis.location?.href || "").slice(0, 500),
      geraet: String(globalThis.navigator?.userAgent || "").slice(0, 300),
    });
  } catch {
    // Erfassen darf nie selbst einen Fehler werfen.
  }
}
