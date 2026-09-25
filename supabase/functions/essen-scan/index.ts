// Supabase Edge Function: Essen per Foto (25.09., Nutzerinnen-Vorgabe).
// Zwei Arten:
// - "etikett": Foto einer Nährwerttabelle + Satz ("2 Scheiben von diesem
//   Brot") → Werte für genau diese Menge, Rechenweg aus dem Etikett.
// - "mahlzeit": Foto eines Tellers (+ optionaler Satz) → ca.-Werte je
//   erkannter Komponente mit geschätzten Gramm.
// Wie blutwerte-scan: Bild liegt im privaten "photos"-Bucket, die Function
// lädt es serverseitig und fragt Claude; der ANTHROPIC_API_KEY bleibt hier.
// Die App zeigt das Ergebnis als Rechnung zum Bestätigen, ohne Chat.
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const antwort = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function base64(buffer: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const zahl = { type: "number" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["erkannt", "posten", "hinweis"],
  properties: {
    erkannt: { type: "boolean" },
    hinweis: { type: "string" },
    posten: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "gramm", "annahme", "kcal", "eiweiss", "fett", "kh", "zucker", "ballast", "omega3", "epaDha", "omega6"],
        properties: {
          name: { type: "string" },
          gramm: zahl,
          annahme: { type: "string" },
          kcal: zahl,
          eiweiss: zahl,
          fett: zahl,
          kh: zahl,
          zucker: zahl,
          ballast: zahl,
          omega3: zahl,
          epaDha: zahl,
          omega6: zahl,
        },
      },
    },
  },
};

const REGELN = [
  "Du rechnest Nährwerte für eine deutschsprachige Ernährungs-App. Alle Texte auf Deutsch, kurz.",
  "Werte immer für die GESAMTE gegessene Menge (nicht pro 100 g): kcal, eiweiss/fett/kh/zucker/ballast in g (1 Nachkommastelle), omega3 (ALA+EPA+DHA), epaDha und omega6 in mg.",
  "kh = Kohlenhydrate wie auf deutschen Etiketten, OHNE Ballaststoffe.",
  "Fettsäuren, die nicht auf dem Etikett stehen, aus der Zutat realistisch schätzen (z. B. Leinsamen, Sonnenblumenöl, Fisch); unbekannt = 0.",
  "Bei Eingelegtem die Einlage berücksichtigen (in Wasser, in Öl, in Olivenöl, abgetropft oder mit Öl).",
  "annahme = kurzer Rechenweg, z. B. \"2 Scheiben à 50 g = 100 g, Etikett: 8,5 g Eiweiß/100 g\" oder \"Portion Reis ≈ 180 g (geschätzt aus dem Foto)\".",
  "erkannt = false, wenn auf dem Bild nichts Brauchbares zu sehen ist; dann posten leer und in hinweis kurz, was fehlt.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    // Bereitschafts-Check (verrät nur, ob ein Schlüssel hinterlegt ist).
    if (body?.pruefen) return antwort({ bereit: !!ANTHROPIC_API_KEY });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return antwort({ error: "Nicht angemeldet." }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return antwort({ error: "Nicht angemeldet." }, 401);

    const { fotoPath, mediaType, art, text } = body || {};
    if (!fotoPath || typeof fotoPath !== "string" || !fotoPath.startsWith(`${user.id}/`)) return antwort({ error: "Ungültiger Foto-Pfad." }, 400);
    if (!ANTHROPIC_API_KEY) return antwort({ error: "Foto-Erkennung ist noch nicht eingerichtet." }, 503);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: datei, error: ladeFehler } = await admin.storage.from("photos").download(fotoPath);
    if (ladeFehler || !datei) return antwort({ error: "Foto konnte nicht geladen werden." }, 404);
    const bild = base64(await datei.arrayBuffer());

    const aufgabe =
      art === "etikett"
        ? `Das Foto zeigt eine Nährwerttabelle/Verpackung. Lies die Werte je 100 g (und ggf. Portionsgröße) ab. Gegessen wurde: "${text || "1 Portion"}". Nutze Stück-/Scheibengewichte vom Etikett, sonst übliche Größen. Ein Posten.`
        : `Das Foto zeigt eine Mahlzeit.${text ? ` Dazu sagt die Person: "${text}".` : ""} Erkenne die Komponenten, schätze jeweils die Menge in Gramm aus Tellergröße und Proportionen und berechne die Werte. Ein Posten je Komponente.`;

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    // deno-lint-ignore no-explicit-any
    const res: any = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      // @ts-ignore: neuere Parameter (Fallback bei Ablehnung, JSON-Schema)
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: REGELN.join("\n"),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: bild } },
            { type: "text", text: aufgabe },
          ],
        },
      ],
    });
    if (res.stop_reason === "refusal") return antwort({ error: "Das Foto konnte nicht ausgewertet werden." }, 422);
    const textBlock = (res.content || []).find((b: { type: string }) => b.type === "text");
    const daten = JSON.parse(textBlock?.text || "{}");
    if (!daten.erkannt || !Array.isArray(daten.posten) || daten.posten.length === 0) {
      return antwort({ error: daten.hinweis || "Auf dem Foto war nichts Auswertbares zu sehen." }, 422);
    }
    return antwort({ posten: daten.posten, hinweis: daten.hinweis || "" });
  } catch (err) {
    console.error(err);
    return antwort({ error: "Foto konnte nicht ausgewertet werden." }, 500);
  }
});
