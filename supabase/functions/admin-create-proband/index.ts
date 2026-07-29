// Supabase Edge Function: legt aus dem Admin-Dashboard heraus ein neues
// Probanden-Konto an (z. B. für Eltern, die selbst nicht technisch versiert
// genug sind, um sich anzumelden und ihren eigenen Plan einzurichten).
//
// Warum eine Edge Function statt einfach supabase.auth.signUp() im Browser:
// signUp() im normalen Browser-Client ERSETZT die aktuell eingeloggte
// Session durch die neue — die Admin-Person würde sich dadurch selbst
// ausloggen und in das gerade angelegte Konto wechseln. Nur serverseitig
// mit dem Service-Role-Key (auth.admin.createUser) lässt sich ein Konto
// anlegen, ohne die aufrufende Session zu berühren.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht angemeldet." }, 200);

    // Wer ruft auf? — mit Anon-Key + weitergereichtem Authorization-Header,
    // damit getUser() den echten aufrufenden Account liefert.
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Nicht angemeldet." }, 200);

    // Service-Role-Client fürs eigentliche Anlegen — RLS-unabhängig, nur
    // serverseitig verfügbar (SUPABASE_SERVICE_ROLE_KEY steht in jeder
    // Edge Function automatisch als Umgebungsvariable bereit).
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .maybeSingle();
    if (profileError) return json({ error: profileError.message }, 200);
    if (!callerProfile?.is_admin) return json({ error: "Nur Admins dürfen neue Zugänge anlegen." }, 200);

    const { email, password, vorname } = await req.json();
    if (!email || !password) return json({ error: "E-Mail und Passwort sind Pflichtfelder." }, 200);
    if (password.length < 6) return json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein." }, 200);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) return json({ error: createError.message }, 200);

    if (vorname) {
      // handle_new_user() (0001_init.sql) legt die profiles-Zeile per
      // Trigger automatisch an — hier nur noch den Anzeigenamen ergänzen.
      await adminClient.from("profiles").update({ vorname }).eq("id", created.user.id);
    }

    return json({ id: created.user.id, email: created.user.email });
  } catch (err) {
    return json({ error: err.message || "Unbekannter Fehler." }, 200);
  }
});
