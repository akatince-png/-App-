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
 * @param {{system?: string, prompt: string, json?: boolean}} params
 *   json: true fordert vom Modell strukturierte JSON-Ausgabe an (bei jedem
 *   Provider anders umgesetzt, siehe die einzelnen anfrage*-Funktionen).
 * @returns {Promise<string>}
 */
export async function sendeAnfrage({ system, prompt, json = false }) {
  if (PROVIDER === "ollama") return anfrageOllama({ system, prompt, json });
  if (PROVIDER === "groq") return anfrageOpenAiKompatibel({ system, prompt, json });
  if (PROVIDER === "gemini") return anfrageGemini({ system, prompt, json });
  throw new Error(`Unbekannter VITE_AI_PROVIDER: "${PROVIDER}". Erlaubt: ollama, groq, gemini.`);
}

// ---------------------------------------------------------------------
// Ollama — lokal, kein API-Key. Chat-Endpunkt mit optionalem JSON-Mode
// ("format": "json" zwingt das Modell zu syntaktisch validem JSON).
// https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
// ---------------------------------------------------------------------
async function anfrageOllama({ system, prompt, json }) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      stream: false,
      ...(json ? { format: "json" } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Ollama-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

// ---------------------------------------------------------------------
// Groq — und jede andere OpenAI-kompatible API (gleiches Schema, nur
// baseUrl/model tauschen). Bearer-Token im Header, JSON-Mode über
// response_format.
// ---------------------------------------------------------------------
async function anfrageOpenAiKompatibel({ system, prompt, json }) {
  if (!API_KEY) throw new Error("VITE_AI_API_KEY fehlt — für Groq/OpenAI-kompatible Provider erforderlich.");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------
// Google Gemini — eigenes Request-/Response-Format, API-Key als Query-Param
// statt Header.
// ---------------------------------------------------------------------
async function anfrageGemini({ system, prompt, json }) {
  if (!API_KEY) throw new Error("VITE_AI_API_KEY fehlt — für Gemini erforderlich.");
  const res = await fetch(`${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Gemini-Anfrage fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
