// Supabase Edge Function: leitet KI-Coach-Anfragen an Google Gemini weiter,
// mit dem GEMINI_API_KEY nur serverseitig als Secret — landet nie im
// ausgelieferten Browser-Code (anders als bei einem clientseitig gesetzten
// VITE_AI_API_KEY, siehe src/services/aiProviders.js). Reiner Durchreicher:
// der Anfrage-Body kommt 1:1 wie für Geminis eigene generateContent-API an
// (plus "model", das Gemini normalerweise in der URL statt im Body erwartet),
// hier wird nur der geheime Schlüssel eingefügt.
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Nur eingeloggte Nutzer:innen dürfen die Funktion aufrufen — sonst
    // könnte jeder, der die URL kennt, auf Kosten des Gemini-Kontingents
    // Anfragen schicken.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY ist auf dem Server nicht gesetzt." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { model, ...payload } = await req.json();
    if (!model) {
      return new Response(JSON.stringify({ error: "Feld 'model' fehlt im Request-Body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
