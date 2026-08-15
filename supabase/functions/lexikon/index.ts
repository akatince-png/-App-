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

    const { frage, kategorie } = await req.json();
    if (!frage || typeof frage !== "string") {
      return new Response(JSON.stringify({ error: "Feld 'frage' fehlt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Domänenwissen aus dem Curriculum "Das ADHS-Paradoxon" — wird nur bei
    // dieser Kategorie mitgeschickt, damit die Antworten auf diesem
    // spezifischen Rahmenwerk basieren statt auf allgemeinem KI-Wissen.
    const wissensKontext = kategorie === "ADHS & Lebensrahmenbedingungen" ? `

Hintergrundwissen (Curriculum "Das ADHS-Paradoxon", nutze dies als Grundlage):
Zwei Menschen mit vergleichbarer ADHS-Ausprägung können völlig unterschiedliche Lebenswege nehmen — das ist das ADHS-Paradoxon. Nicht die Diagnose selbst entscheidet über Erfolg oder Misserfolg, sondern das Zusammenspiel aus internen Schutzfaktoren und externer Passung: Lebenserfolg bei ADHS ≈ interne Schutzfaktoren (Selbstverständnis, Coping, Resilienz) × externe Passung (Umgebung, Beziehungen, Arbeitsform).
Schutzfaktoren aus der Forschung: Gewissenhaftigkeit und Extraversion, emotionsfokussierte adaptive Coping-Strategien, positive Kindheitserfahrungen, verlässliche soziale Unterstützung, sowie erlernbare Grundhaltungen wie Resilienz, Mut, Selbstakzeptanz, Motivation und Neugier.
Der Struktur-Paradox: Das ADHS-Gehirn lehnt nicht Struktur grundsätzlich ab, sondern schlechte Struktur, die nicht zu seiner Funktionsweise passt.
Person-Environment-Fit ("Goodness of Fit") ist wahrscheinlich die wichtigste Einzelvariable für Arbeitszufriedenheit und Lebenserfolg bei ADHS. Selbstständigkeit/Unternehmertum korreliert überdurchschnittlich mit ADHS-Merkmalen, weil klassisch als Defizite gerahmte Eigenschaften (Reizsuche, Handlungsorientierung, Autonomiebedürfnis) dort zu Stärken werden.
Stärken-Forschung nennt wiederkehrend: Kreativität, divergentes Denken, hohe Energie, Hyperfokus, Abenteuerlust, Risikobereitschaft, Empathie, Individualität, Authentizität, Autonomie.
Risikofaktoren: eingeschränkter Zugang zu Diagnostik/Behandlung, unbehandelte Komorbiditäten, sozioökonomische Benachteiligung, kumulative Wirkung wiederholter Beschämung in Kindheit/Jugend. Späte/fehlende Diagnose ist selbst ein Risikofaktor (führt oft zu einem Selbstbild aus "ich bin faul/dumm/kaputt").
Biografische Beispiele: Simone Biles (früh diagnostiziert, früh behandelt, hochstrukturierte passende Umgebung im Spitzensport). Michael Phelps (Struktur/Bewegung als Ventil, aber auch Beispiel dafür, dass äußerer Erfolg psychische Gesundheit nicht ersetzt — litt nach jeder Olympiade an Depression). Richard Branson (Schulversagen, Legasthenie, delegiert konsequent an andere statt an eigenen Schwächen zu arbeiten). David Neeleman (JetBlue-Gründer, ADHS erst als Erwachsener nach mehreren Firmengründungen diagnostiziert — Kernbeispiel für Spätdiagnose, Prinzip "staff your weaknesses").
Wiederkehrende Muster: Verstehen statt Selbstvorwurf, Stärken nutzen statt nur Defizite reparieren, die Umgebung aktiv gestalten statt sich anzupassen, Erfolg ist kein Endpunkt (psychische Gesundheit bleibt eigenständiges Thema).
Rollenklarheit: Dies ist Coaching-Wissen, keine Therapie, keine Berufs-, Paar- oder Finanzberatung.` : "";

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
            }". Beantworte die folgende Frage kurz, sachlich und leicht verständlich in 3-5 Sätzen auf Deutsch. Keine Dosierungsempfehlungen oder medizinische Handlungsanweisungen geben, nur allgemeine, informative Fakten.${wissensKontext} Frage: ${frage}`,
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
