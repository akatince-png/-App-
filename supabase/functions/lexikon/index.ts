// Supabase Edge Function: beantwortet Lexikon-Fragen über die Anthropic API.
// Der ANTHROPIC_API_KEY liegt als Function-Secret nur serverseitig vor und
// wird niemals an das Frontend ausgeliefert.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
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
    // Nur eingeloggte Nutzer:innen dürfen die Funktion aufrufen.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    const { frage, kategorie, kontext } = await req.json();
    if (!frage || typeof frage !== "string") {
      return new Response(JSON.stringify({ error: "Feld 'frage' fehlt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wenn der Client zur gewählten Kategorie kuratierten Kontext aus der
    // App-eigenen Wissensbasis mitschickt (src/wissen/, siehe
    // wissensBasisFuerLexikonKategorie() in utils/wissensBasis.js), wird
    // die Antwort darauf gestützt statt rein aus freiem Modellwissen zu
    // kommen — Ziel: Konsistenz zwischen dem, was die App im Lexikon
    // antwortet, und den kuratierten Coaching-Unterlagen. Nicht jede
    // Kategorie hat einen eigenen Wissens-Ordner (z. B. "Hormone",
    // "Anti-Aging") — dann ist kontext leer und die Antwort kommt wie
    // bisher aus freiem Modellwissen.
    const kontextBlock =
      typeof kontext === "string" && kontext.trim()
        ? `\n\nStütze deine Antwort auf folgenden kuratierten Hintergrundtext, sofern er zur Frage passt (nicht wörtlich zitieren, sinngemäß wiedergeben):\n\n${kontext.trim()}`
        : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Du bist das Lexikon einer Protokoll- und Biohacking-App, aktueller Themenbereich: "${
              kategorie || "Allgemein"
            }". Beantworte die folgende Frage kurz, sachlich und leicht verständlich in 3-5 Sätzen auf Deutsch. Keine Dosierungsempfehlungen oder medizinische Handlungsanweisungen geben, nur allgemeine, informative Fakten. Frage: ${frage}${kontextBlock}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API Fehler:", errText);
      return new Response(JSON.stringify({ error: "Antwort konnte nicht geladen werden." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");

    return new Response(JSON.stringify({ antwort: text || "Keine Antwort erhalten." }), {
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
