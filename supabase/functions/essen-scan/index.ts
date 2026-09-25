// Supabase Edge Function: Essen per Foto (25.09., Nutzerinnen-Vorgabe).
// Zwei Arten:
// - "etikett": Foto einer Nährwerttabelle + Satz ("2 Scheiben von diesem
//   Brot") → Werte für genau diese Menge, Rechenweg aus dem Etikett.
// - "mahlzeit": Foto eines Tellers (+ optionaler Satz) → ca.-Werte je
//   erkannter Komponente mit geschätzten Gramm.
// Wie blutwerte-scan: Bild liegt im privaten "photos"-Bucket, die Function
// lädt es serverseitig und fragt Claude (ANTHROPIC_API_KEY) oder, falls
// nur der vorhandene GEMINI_API_KEY gesetzt ist, Gemini. Schlüssel bleiben hier.
// Die App zeigt das Ergebnis als Rechnung zum Bestätigen, ohne Chat.
// Seit 25.09. auch "supplement"/"medikament": Dose/Packung + "3 Kapseln" →
// Name, Form, Einnahme-Menge und Inhaltsstoffe je Einnahme.
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_VISION_MODEL") || "gemini-3.8-flash";
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

// Präparat (25.09.): Supplement-Dose oder Medikamenten-Packung + "3 Kapseln".
const PRAEPARAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["erkannt", "hinweis", "name", "form", "menge", "portion", "inhaltsstoffe"],
  properties: {
    erkannt: { type: "boolean" },
    hinweis: { type: "string" },
    name: { type: "string" },
    form: { type: "string", enum: ["Kapsel", "Tablette (oral)", "Pulver", "Tropfen", "Nasenspray", "Gel / Creme", "Pflaster", "Injektion", "Sonstiges"] },
    menge: { type: "string" },
    portion: { type: "string" },
    inhaltsstoffe: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "menge", "einheit"],
        properties: { name: { type: "string" }, menge: zahl, einheit: { type: "string" } },
      },
    },
  },
};
const PRAEPARAT_REGELN = [
  "Du liest Etiketten von Nahrungsergänzungsmitteln und Medikamenten für eine deutschsprachige App ab. Alle Texte auf Deutsch, kurz.",
  "name = Produktname wie auf der Packung (Marke + Produkt, z. B. \"Magnesium 400 Kapseln\"). form = Darreichungsform.",
  "menge = die EINE Einnahme, die die Person nimmt, mit Einheit, z. B. \"3 Kapseln\" oder \"1 Messlöffel (12 g)\" oder \"1 Tablette (50 mg)\". Ohne Angabe der Person: die Verzehrempfehlung/Dosis vom Etikett.",
  "portion = was das Etikett als Portion angibt, z. B. \"2 Kapseln\" oder \"1 Messlöffel = 12 g\".",
  "inhaltsstoffe = alle Wirk-/Inhaltsstoffe mit Menge für GENAU diese eine Einnahme (umgerechnet, falls die Person mehr oder weniger als eine Etikett-Portion nimmt). Einheit wie auf dem Etikett (mg, µg, g, IE, mg Koffein …). Hilfsstoffe (Kapselhülle, Trennmittel, Farbstoffe) weglassen.",
  "Nichts erfinden: was nicht lesbar ist, weglassen und in hinweis kurz erwähnen. Keine Bewertung, keine Wirkversprechen.",
  "erkannt = false, wenn keine Packung/kein Etikett zu sehen ist; dann inhaltsstoffe leer und in hinweis kurz, was fehlt.",
];

const REGELN = [
  "Du rechnest Nährwerte für eine deutschsprachige Ernährungs-App. Alle Texte auf Deutsch, kurz.",
  "Werte immer für die GESAMTE gegessene Menge (nicht pro 100 g): kcal, eiweiss/fett/kh/zucker/ballast in g (1 Nachkommastelle), omega3 (ALA+EPA+DHA), epaDha und omega6 in mg.",
  "kh = Kohlenhydrate wie auf deutschen Etiketten, OHNE Ballaststoffe.",
  "Fettsäuren, die nicht auf dem Etikett stehen, aus der Zutat realistisch schätzen (z. B. Leinsamen, Sonnenblumenöl, Fisch); unbekannt = 0.",
  "Bei Eingelegtem die Einlage berücksichtigen (in Wasser, in Öl, in Olivenöl, abgetropft oder mit Öl).",
  "annahme = kurzer Rechenweg, z. B. \"2 Scheiben à 50 g = 100 g, Etikett: 8,5 g Eiweiß/100 g\" oder \"Portion Reis ≈ 180 g (geschätzt aus dem Foto)\".",
  "erkannt = false, wenn auf dem Bild nichts Brauchbares zu sehen ist; dann posten leer und in hinweis kurz, was fehlt.",
];

// Claude (bevorzugt, wenn ANTHROPIC_API_KEY gesetzt ist).
async function mitClaude(bild: string, mediaType: string, aufgabe: string, regeln: string[], schema: unknown) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  // deno-lint-ignore no-explicit-any
  const res: any = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    // @ts-ignore: neuere Parameter (Fallback bei Ablehnung, JSON-Schema)
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system: regeln.join("\n"),
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
  if (res.stop_reason === "refusal") return null;
  const textBlock = (res.content || []).find((b: { type: string }) => b.type === "text");
  return JSON.parse(textBlock?.text || "{}");
}

// Gemini (vorhandener Schlüssel des Projekts), gleiche Regeln + JSON-Ausgabe.
// Bei Überlastung (429/503) weiter zum nächsten Modell.
const GEMINI_MODELLE = [GEMINI_MODEL, "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.6-flash"].filter((m, i, a) => a.indexOf(m) === i);
async function mitGemini(bild: string, mediaType: string, aufgabe: string, regeln: string[], schema: unknown) {
  for (const modell of GEMINI_MODELLE) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modell}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: regeln.join("\n") + "\nAntworte NUR mit JSON: " + JSON.stringify(schema) }] },
        contents: [{ role: "user", parts: [{ inline_data: { mime_type: mediaType || "image/jpeg", data: bild } }, { text: aufgabe }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error(`Gemini-Fehler (${modell}):`, JSON.stringify(j).slice(0, 300));
      if ([404, 429, 500, 503].includes(r.status)) continue;
      return null;
    }
    const text = (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim() || "{}");
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    // Bereitschafts-Check (verrät nur, ob ein Schlüssel hinterlegt ist).
    if (body?.pruefen) {
      let modelle: string[] = [];
      if (body.modelle && GEMINI_API_KEY) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}&pageSize=200`);
        const j = await r.json();
        modelle = (j.models || []).map((m: { name: string }) => m.name).filter((n: string) => /gemini/.test(n));
      }
      return antwort({ bereit: !!ANTHROPIC_API_KEY || !!GEMINI_API_KEY, claude: !!ANTHROPIC_API_KEY, gemini: !!GEMINI_API_KEY, modelle });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return antwort({ error: "Nicht angemeldet." }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return antwort({ error: "Nicht angemeldet." }, 401);

    const { fotoPath, mediaType, art, text } = body || {};
    if (!fotoPath || typeof fotoPath !== "string" || !fotoPath.startsWith(`${user.id}/`)) return antwort({ error: "Ungültiger Foto-Pfad." }, 400);
    if (!ANTHROPIC_API_KEY && !GEMINI_API_KEY) return antwort({ error: "Foto-Erkennung ist noch nicht eingerichtet." }, 503);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: datei, error: ladeFehler } = await admin.storage.from("photos").download(fotoPath);
    if (ladeFehler || !datei) return antwort({ error: "Foto konnte nicht geladen werden." }, 404);
    const bild = base64(await datei.arrayBuffer());

    // Präparat (Supplement/Medikament): eigenes Schema, Antwort 1:1 zurück.
    if (art === "supplement" || art === "medikament") {
      const aufgabeP = `Das Foto zeigt die Packung/das Etikett eines ${art === "supplement" ? "Nahrungsergänzungsmittels" : "Medikaments"}.${text ? ` Die Person sagt: "${text}".` : ""} Lies Name, Form, Portion und alle Inhaltsstoffe ab und rechne auf ihre Einnahme um.`;
      const p = ANTHROPIC_API_KEY
        ? await mitClaude(bild, mediaType, aufgabeP, PRAEPARAT_REGELN, PRAEPARAT_SCHEMA)
        : await mitGemini(bild, mediaType, aufgabeP, PRAEPARAT_REGELN, PRAEPARAT_SCHEMA);
      if (p === null) return antwort({ error: "Das Foto konnte gerade nicht ausgewertet werden – bitte gleich nochmal versuchen." }, 422);
      if (!p.erkannt) return antwort({ error: p.hinweis || "Auf dem Foto war kein Etikett zu erkennen." }, 422);
      return antwort({ praeparat: p });
    }

    const aufgabe =
      art === "etikett"
        ? `Das Foto zeigt eine Nährwerttabelle/Verpackung. Lies die Werte je 100 g (und ggf. Portionsgröße) ab. Gegessen wurde: "${text || "1 Portion"}". Nutze Stück-/Scheibengewichte vom Etikett, sonst übliche Größen. Ein Posten.`
        : `Das Foto zeigt eine Mahlzeit.${text ? ` Dazu sagt die Person: "${text}".` : ""} Erkenne die Komponenten, schätze jeweils die Menge in Gramm aus Tellergröße und Proportionen und berechne die Werte. Ein Posten je Komponente.`;

    const daten = ANTHROPIC_API_KEY ? await mitClaude(bild, mediaType, aufgabe, REGELN, SCHEMA) : await mitGemini(bild, mediaType, aufgabe, REGELN, SCHEMA);
    if (daten === null) return antwort({ error: "Das Foto konnte nicht ausgewertet werden." }, 422);
    if (!daten.erkannt || !Array.isArray(daten.posten) || daten.posten.length === 0) {
      return antwort({ error: daten.hinweis || "Auf dem Foto war nichts Auswertbares zu sehen." }, 422);
    }
    return antwort({ posten: daten.posten, hinweis: daten.hinweis || "" });
  } catch (err) {
    console.error(err);
    return antwort({ error: "Foto konnte nicht ausgewertet werden." }, 500);
  }
});
