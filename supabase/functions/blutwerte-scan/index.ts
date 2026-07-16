// Supabase Edge Function: liest Laborwerte aus einem Foto per Claude Vision.
// Erhält KEIN rohes Bild vom Client, sondern einen Storage-Pfad im privaten
// "photos"-Bucket, lädt das Bild serverseitig herunter und ruft damit die
// Anthropic API auf. Der ANTHROPIC_API_KEY bleibt serverseitig.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client mit dem Auth-Header des Nutzers: bestätigt, wer angefragt hat.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fotoPath, mediaType } = await req.json();
    if (!fotoPath || typeof fotoPath !== "string" || !fotoPath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "Ungültiger Foto-Pfad." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-Role-Client zum Herunterladen aus dem privaten Bucket.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: fileData, error: downloadError } = await adminClient.storage.from("photos").download(fotoPath);
    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Foto konnte nicht geladen werden." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const base64 = arrayBufferToBase64(await fileData.arrayBuffer());

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 } },
              {
                type: "text",
                text: "Das ist ein Foto eines Laborberichts mit Blutwerten. Extrahiere alle erkennbaren Laborwerte als JSON-Objekt. Key = Name des Werts (z.B. 'Testosteron', 'Vitamin D', 'CRP'), Value = gemessener Wert inkl. Einheit als String (z.B. '4,2 ng/ml'). Antworte NUR mit dem reinen JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärung.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API Fehler:", errText);
      return new Response(JSON.stringify({ error: "Werte konnten nicht automatisch erkannt werden." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let werte: Record<string, string>;
    try {
      werte = JSON.parse(clean);
    } catch {
      return new Response(JSON.stringify({ error: "Keine Werte erkannt." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entries = Object.entries(werte).filter(([, v]) => v);
    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: "Keine Werte erkannt." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ werte: Object.fromEntries(entries) }), {
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
