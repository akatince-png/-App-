import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase-Konfiguration fehlt. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in einer .env-Datei setzen (siehe .env.example)."
  );
}

// Live-Aktualisierung (28.09., data/liveAktualisierung.js): erfolgreiche
// Schreibzugriffe werden einem Beobachter gemeldet. Ohne Beobachter
// verhält sich fetch exakt wie vorher.
let schreibBeobachter = null;
export const setzeSchreibBeobachter = (fn) => {
  schreibBeobachter = fn;
};

const beobachtetesFetch = async (input, init) => {
  const antwort = await fetch(input, init);
  if (schreibBeobachter) {
    try {
      const url = typeof input === "string" ? input : input?.url;
      schreibBeobachter(url, init?.method || input?.method, antwort.ok);
    } catch {
      // Beobachter darf nie das eigentliche Speichern stören.
    }
  }
  return antwort;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: beobachtetesFetch } });
