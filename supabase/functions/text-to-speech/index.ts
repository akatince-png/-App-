// Supabase Edge Function: wandelt Text in natürlich klingende Sprache um
// (Google Cloud Text-to-Speech, WaveNet-Stimme) statt der robotisch
// klingenden, geräteeigenen Browser-Sprachausgabe. GOOGLE_TTS_API_KEY bleibt
// nur serverseitig als Secret — landet nie im ausgelieferten Browser-Code.
// Reiner Durchreicher (gleiches Muster wie gemini-chat): der echte
// Google-Status/-Body kommt 1:1 beim Frontend an, statt hier künstlich auf
// 200 gebogen zu werden — src/utils/speech.js ruft diese Funktion per
// fetch() (nicht supabase.functions.invoke()) auf und liest den Status
// selbst aus, ist also vom "non-2xx wird verschluckt"-Problem nicht
// betroffen. Falls diese Funktion (noch) nicht deployt ist oder fehlschlägt,
// weicht das Frontend automatisch auf die Browser-eigene Sprachausgabe aus —
// die App bleibt jederzeit nutzbar.
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_TTS_API_KEY = Deno.env.get("GOOGLE_TTS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// WaveNet statt Neural2/Chirp gewählt: deutlich natürlicher als die
// Standard-Stimme, aber mit eigenem kostenlosem Monatskontingent (1 Mio.
// Zeichen), statt laufender Kosten ab dem ersten Zeichen wie bei den
// höherwertigen Stimmklassen. Bei Bedarf hier einfach eine andere
// de-DE-Wavenet-*-Stimme eintragen (A-F, unterschiedliche Klangfarben).
const STIMME = "de-DE-Wavenet-F";

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
    // könnte jeder, der die URL kennt, auf Kosten des TTS-Kontingents
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

    if (!GOOGLE_TTS_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_TTS_API_KEY ist auf dem Server nicht gesetzt." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Feld 'text' fehlt im Request-Body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "de-DE", name: STIMME },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });

    const data = await response.text();
    return new Response(data, {
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
