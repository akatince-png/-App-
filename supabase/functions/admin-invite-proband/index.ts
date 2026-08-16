// Supabase Edge Function: verschickt eine echte Einladungs-E-Mail an eine
// künftige Coachee (Nutzerinnen-Vorgabe 16.08.: "dass ich jemandem einen
// Link schicke ... er nur darüber reinkommt oder eingeladen werden muss").
// Ersetzt für diesen Anwendungsfall die offene Selbstregistrierung
// (LoginView.jsx "Registrieren"-Tab wurde entfernt) — Konten entstehen ab
// jetzt nur noch über die Admin, entweder mit direkt gesetztem Passwort
// (admin-create-proband) oder per Einladung wie hier.
//
// auth.admin.inviteUserByEmail() legt das Konto an UND verschickt
// Supabases eingebaute Einladungs-Mail mit einem sicheren Link — die
// Person setzt sich beim ersten Klick selbst ein Passwort (siehe
// InviteAcceptView.jsx, das den Link-Typ "invite" im Frontend abfängt).
// Braucht denselben Service-Role-Zugriff wie admin-create-proband, deshalb
// dieselbe Struktur/Absicherung (nur Admins dürfen aufrufen).
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

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Nicht angemeldet." }, 200);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .maybeSingle();
    if (profileError) return json({ error: profileError.message }, 200);
    if (!callerProfile?.is_admin) return json({ error: "Nur Admins dürfen Einladungen verschicken." }, 200);

    const { email, vorname, onboardingModus } = await req.json();
    if (!email) return json({ error: "E-Mail ist ein Pflichtfeld." }, 200);
    const modus = onboardingModus === "lang" ? "lang" : "kurz";

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) return json({ error: inviteError.message }, 200);

    // handle_new_user() (0001_init.sql) legt die profiles-Zeile per
    // Trigger automatisch an — hier nur noch Anzeigename + gewählten
    // Onboarding-Umfang ergänzen.
    await adminClient
      .from("profiles")
      .update({ vorname: vorname || null, onboarding_modus: modus })
      .eq("id", invited.user.id);

    return json({ id: invited.user.id, email: invited.user.email });
  } catch (err) {
    return json({ error: err.message || "Unbekannter Fehler." }, 200);
  }
});
