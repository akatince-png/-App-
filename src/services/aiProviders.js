// Low-Level-Anbindung an die konfigurierte KI-Quelle. aiService.js baut
// darauf die eigentlichen App-Funktionen auf (Morgenimpuls, Trainingsplan,
// Ernährungsplan). Die Provider-Wahl läuft ausschließlich über ENV-
// Variablen (siehe .env.example) — ein Wechsel von lokalem Ollama auf eine
// Cloud-API braucht dadurch keine Codeänderung, nur eine neue .env.
//
// WICHTIG bei Ollama: Ollama blockt Browser-Anfragen von fremden Origins
// standardmäßig (CORS), da die Vite-Dev-App auf einem anderen Port läuft
// als Ollama selbst. Vor dem Start einmal die erlaubte Origin freigeben,
// z. B. im Terminal:
//   OLLAMA_ORIGINS=http://localhost:5173 ollama serve
// (Port ggf. an den tatsächlichen Vite-Dev-Server anpassen — steht in der
// Kommandozeile, wenn `npm run dev` läuft.)
//
// WICHTIG bei Groq/Gemini: Ein clientseitig gesetzter VITE_AI_API_KEY landet
// sichtbar im ausgelieferten Browser-Code — nur zum schnellen Testen
// gedacht. Im Normalbetrieb (kein VITE_AI_API_KEY gesetzt) läuft die Anfrage
// stattdessen automatisch über die passende Supabase Edge Function
// ("groq-chat" bzw. "gemini-chat" in supabase/functions/), die den echten
// Key nur serverseitig als Secret hält.
import { supabase } from "../lib/supabaseClient";

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER || "ollama").toLowerCase();
const MODEL = import.meta.env.VITE_AI_MODEL || "llama3.1";
const API_KEY = import.meta.env.VITE_AI_API_KEY || "";

const STANDARD_BASE_URLS = {
  ollama: "http://localhost:11434",
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

const BASE_URL = import.meta.env.VITE_AI_BASE_URL || STANDARD_BASE_URLS[PROVIDER] || STANDARD_BASE_URLS.ollama;

/**
 * Schickt eine Chat-Anfrage an den konfigurierten Provider und liefert den
 * rohen Antworttext zurück — das JSON-Parsing für Formulare übernimmt
 * aiService.js, da nur dort bekannt ist, welches Format erwartet wird.
 *
 * @param {{system?: string, messages: Array<{role: "user"|"assistant", content: string}>, json?: boolean}} params
 *   messages: der volle bisherige Gesprächsverlauf (nicht nur die neueste
 *   Nachricht) — erst dadurch kann das Modell auf frühere Antworten Bezug
 *   nehmen, statt bei jeder Anfrage "vergesslich" neu zu starten.
 *   json: true fordert vom Modell strukturierte JSON-Ausgabe an (bei jedem
 *   Provider anders umgesetzt, siehe die einzelnen anfrage*-Funktionen).
 * @returns {Promise<string>}
 */
export async function sendeAnfrage({ system, messages, json = false }) {
  if (PROVIDER === "ollama") return anfrageOllama({ system, messages, json });
  if (PROVIDER === "groq") return anfrageOpenAiKompatibel({ system, messages, json });
  if (PROVIDER === "gemini") return anfrageGemini({ system, messages, json });
  throw new Error(`Unbekannter VITE_AI_PROVIDER: "${PROVIDER}". Erlaubt: ollama, groq, gemini.`);
}

/**
 * Wie sendeAnfrage(), aber ruft onTeilantwort(bisherigerText) bei jedem
 * neuen Textstück auf, statt am Ende einmal die komplette Antwort
 * zurückzugeben — lässt den Chat wortweise "mitschreiben" statt lange
 * stillzustehen und dann alles auf einmal zu zeigen. Bei Ollama und Gemini
 * echtes Streaming; bei Groq kommt die Antwort (noch) am Stück,
 * onTeilantwort wird dort einmalig mit dem Volltext aufgerufen, damit der
 * Aufrufer nicht mehrere verschiedene Codepfade braucht.
 *
 * @param {{system?: string, messages: Array<{role: "user"|"assistant", content: string}>, onTeilantwort: (text: string) => void}} params
 * @returns {Promise<string>} die vollständige Antwort, wenn sie fertig ist
 */
export async function sendeAnfrageStreamend({ system, messages, onTeilantwort }) {
  if (PROVIDER === "ollama") return anfrageOllamaStreamend({ system, messages, onTeilantwort });
  if (PROVIDER === "gemini") return anfrageGeminiStreamend({ system, messages, onTeilantwort });
  const antwort = await sendeAnfrage({ system, messages, json: false });
  onTeilantwort(antwort);
  return antwort;
}

// ---------------------------------------------------------------------
// Ollama — lokal, kein API-Key. Chat-Endpunkt mit optionalem JSON-Mode
// ("format": "json" zwingt das Modell zu syntaktisch validem JSON).
// https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
// ---------------------------------------------------------------------
async function anfrageOllama({ system, messages, json }) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
      stream: false,
      ...(json ? { format: "json" } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Ollama-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

// Ollama liefert bei "stream: true" den Text zeilenweise als NDJSON
// (ein JSON-Objekt pro Zeile, letzte Zeile hat "done: true") statt einer
// einzelnen Antwort — wir lesen den Response-Body deshalb selbst statt
// res.json() zu nutzen.
async function anfrageOllamaStreamend({ system, messages, onTeilantwort }) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
      stream: true,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let volltext = "";
  let rest = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    rest += decoder.decode(value, { stream: true });
    const zeilen = rest.split("\n");
    rest = zeilen.pop() ?? ""; // letzte, evtl. noch unvollständige Zeile für den nächsten Durchlauf aufheben
    for (const zeile of zeilen) {
      if (!zeile.trim()) continue;
      const stueck = JSON.parse(zeile);
      if (stueck.message?.content) {
        volltext += stueck.message.content;
        onTeilantwort(volltext);
      }
    }
  }
  return volltext;
}

// ---------------------------------------------------------------------
// Groq — und jede andere OpenAI-kompatible API (gleiches Schema, nur
// baseUrl/model tauschen). JSON-Mode über response_format.
//
// Zwei Wege, je nachdem ob VITE_AI_API_KEY gesetzt ist:
// - Gesetzt (Schnellweg zum Testen): Groq direkt aus dem Browser mit dem
//   Key im Bearer-Header — der Key ist dann im Programmcode sichtbar.
// - Nicht gesetzt (sicherer Normalweg): Anfrage geht an die eigene
//   Supabase Edge Function "groq-chat", die den echten Key nur
//   serverseitig kennt. Braucht ein aktives Login.
// ---------------------------------------------------------------------
async function anfrageOpenAiKompatibel({ system, messages, json }) {
  const body = {
    model: MODEL,
    messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };

  if (!API_KEY) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Nicht angemeldet — für den KI-Coach über Groq wird ein aktives Login benötigt.");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Groq-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Groq-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------
// Google Gemini — eigenes Request-/Response-Format: "assistant" heißt dort
// "model", und der Verlauf steht als "contents" statt "messages".
//
// Zwei Wege, je nachdem ob VITE_AI_API_KEY gesetzt ist (gleiches Prinzip
// wie bei Groq oben):
// - Gesetzt (Schnellweg zum Testen): Gemini direkt aus dem Browser, Key als
//   Query-Param — der Key ist dann im Programmcode sichtbar.
// - Nicht gesetzt (sicherer Normalweg): Anfrage geht an die eigene
//   Supabase Edge Function (Quellcode in supabase/functions/gemini-chat/),
//   die den echten Key nur serverseitig kennt. Braucht ein aktives Login.
// ---------------------------------------------------------------------
// Der über den Supabase-Browser-Editor deployte Funktions-Slug (Teil der
// URL) wird beim allerersten Anlegen automatisch vergeben und lässt sich
// über die Supabase-Oberfläche im Nachhinein NICHT mehr umbenennen — ein
// späteres Ändern des angezeigten "Name"-Felds ändert nur die Anzeige,
// nicht die tatsächliche Adresse. Deshalb hier der real deployte Slug statt
// des ursprünglich geplanten "gemini-chat" (falls die Funktion später unter
// dem eigentlichen Namen neu angelegt wird, hier einfach zurückändern).
const GEMINI_EDGE_FUNCTION_SLUG = "clever-worker";

async function anfrageGemini({ system, messages, json }) {
  const payload = {
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  };

  if (!API_KEY) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Nicht angemeldet — für den KI-Coach über Gemini wird ein aktives Login benötigt.");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${GEMINI_EDGE_FUNCTION_SLUG}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ model: MODEL, ...payload }),
    });
    if (!res.ok) throw new Error(`Gemini-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  const res = await fetch(`${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Gemini-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// Gemini liefert im Streaming-Modus Server-Sent Events (SSE): pro Textstück
// eine Zeile "data: {...}", die ein Teilstück der Antwort als JSON enthält
// — wir lesen den Response-Body deshalb selbst statt res.json() zu nutzen
// (gleiches Prinzip wie bei Ollama oben, nur anderes Zeilenformat).
async function anfrageGeminiStreamend({ system, messages, onTeilantwort }) {
  const payload = {
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
  };

  let res;
  if (!API_KEY) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Nicht angemeldet — für den KI-Coach über Gemini wird ein aktives Login benötigt.");
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${GEMINI_EDGE_FUNCTION_SLUG}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ model: MODEL, stream: true, ...payload }),
    });
  } else {
    res = await fetch(`${BASE_URL}/models/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  if (!res.ok || !res.body) throw new Error(`Gemini-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let volltext = "";
  let rest = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    rest += decoder.decode(value, { stream: true });
    const zeilen = rest.split("\n");
    rest = zeilen.pop() ?? ""; // letzte, evtl. noch unvollständige Zeile für den nächsten Durchlauf aufheben
    for (const zeile of zeilen) {
      const inhalt = zeile.trim();
      if (!inhalt.startsWith("data:")) continue;
      const jsonText = inhalt.slice(5).trim();
      if (!jsonText || jsonText === "[DONE]") continue;
      const stueck = JSON.parse(jsonText);
      const text = stueck.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        volltext += text;
        onTeilantwort(volltext);
      }
    }
  }
  return volltext;
}
