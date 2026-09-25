// Supabase Edge Function: beantwortet Lexikon-Fragen über die Anthropic API.
// Der ANTHROPIC_API_KEY liegt als Function-Secret nur serverseitig vor und
// wird niemals an das Frontend ausgeliefert.
// Seit 25.09.: ohne ANTHROPIC_API_KEY über Gemini (kostenlose Stufe) –
// betrifft auch "Was hilft mir jetzt?" im Akutmodus (modus "akut").
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Gemini (kostenlose Stufe, 25.09.): Standard, solange kein ANTHROPIC_API_KEY
// gesetzt ist. Bei Überlastung/Kontingent weiter zum nächsten Modell.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODELLE = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.6-flash"];
// deno-lint-ignore no-explicit-any
async function gemini(parts: any[], json = false): Promise<string | null> {
  for (const modell of GEMINI_MODELLE) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modell}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.2, ...(json ? { responseMimeType: "application/json" } : {}) } }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error(`Gemini-Fehler (${modell}):`, JSON.stringify(j).slice(0, 300));
      if ([404, 429, 500, 503].includes(r.status)) continue;
      return null;
    }
    return (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
  }
  return null;
}


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

    const { frage, kategorie, kontext, modus } = await req.json();
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

    // "akut" (Akutmodus-Feature, HomeView.jsx/AkutModusKarte.jsx): statt
    // der sachlich-neutralen Lexikon-Rolle eine warme, direktive Rolle für
    // Momente akuter ADHS-Symptomatik (Reizüberflutung, innere Unruhe
    // usw.) — Ziel ist ein sofort umsetzbarer nächster Schritt, keine
    // Definition/Erklärung. Standardverhalten (kein modus-Feld) bleibt
    // exakt wie zuvor, damit LexikonView.jsx unverändert funktioniert.
    const promptText =
      modus === "akut"
        ? `Du bist der ruhige, warmherzige Begleiter in einer ADHS-Coaching-App, gerade im "Akutmodus" — die Person hat eben ein akutes Symptom gemeldet und braucht JETZT einen konkreten, sofort umsetzbaren nächsten Schritt, keine Erklärung/Definition. Antworte auf Deutsch in maximal 4 kurzen Sätzen: zuerst ein Satz, der den Zustand kurz anerkennt (ohne Mitleid/Dramatik), danach 1-2 ganz konkrete, sofort machbare Handlungsschritte. Keine Dosierungsempfehlungen oder medizinischen Handlungsanweisungen, keine Diagnose. Gemeldetes Symptom/Beschreibung: ${frage}${kontextBlock}`
        : `Du bist das Lexikon einer Protokoll- und Biohacking-App, aktueller Themenbereich: "${
            kategorie || "Allgemein"
          }". Beantworte die folgende Frage kurz, sachlich und leicht verständlich in 3-5 Sätzen auf Deutsch. Keine Dosierungsempfehlungen oder medizinische Handlungsanweisungen geben, nur allgemeine, informative Fakten. Frage: ${frage}${kontextBlock}`;

    let text = "";
    if (ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 400,
          messages: [{ role: "user", content: promptText }],
        }),
      });
      if (!response.ok) {
        console.error("Anthropic API Fehler:", await response.text());
        return new Response(JSON.stringify({ error: "Antwort konnte nicht geladen werden." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      text = (data.content || []).map((b: { text?: string }) => b.text || "").join("");
    } else {
      const g = await gemini([{ text: promptText }]);
      if (g === null) {
        return new Response(JSON.stringify({ error: "Antwort konnte gerade nicht geladen werden – bitte gleich nochmal versuchen." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      text = g.trim();
    }

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
