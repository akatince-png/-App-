// Kalender-Abo (24.10., Migration 0131): liefert den AKA-Plan einer Person
// als iCalendar für den Apple-/Google-Kalender. Aufruf ohne Login über den
// geheimen Link …/functions/v1/kalender-abo?t=<token> (verify_jwt = false);
// das Token ist der einzige Schlüssel und lässt sich in der App jederzeit
// neu ziehen („Link sperren“). Liefert nur Zeiten und Titel: Routinen,
// „Mein Alltag“ (ohne ausgenommene Bereiche), offene Matrix-Aufgaben mit
// Datum, Trainings-Wochenplan – keine Notizen, keine Gesundheitsdaten.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { kalenderIcs } from "./ics.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function heuteIn(zeitzone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zeitzone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const plusTage = (datum: string, tage: number) => {
  const [j, m, t] = datum.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, t + tage)).toISOString().slice(0, 10);
};

const fehler = (status: number, text: string) => new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") return fehler(405, "Nur GET.");
  const token = new URL(req.url).searchParams.get("t") || "";
  if (!/^[0-9a-f]{64}$/.test(token)) return fehler(404, "Unbekannter Kalender.");

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: abo } = await admin.from("kalender_abos").select("user_id, ohne_bereiche").eq("token", token).maybeSingle();
  if (!abo) return fehler(404, "Unbekannter Kalender.");
  const uid = abo.user_id as string;

  const { data: profil } = await admin.from("profiles").select("zeitzone").eq("id", uid).maybeSingle();
  const zeitzone = (profil?.zeitzone as string) || "Europe/Berlin";
  const heute = heuteIn(zeitzone);

  const [routinen, alltag, aufgaben, training] = await Promise.all([
    admin.from("routine_einstellungen").select("routine, start_zeit, end_zeit").eq("user_id", uid),
    admin.from("alltag_eintraege").select("id, titel, datum, wochentage, start_zeit, end_zeit, bereich_id").eq("user_id", uid),
    admin.from("matrix_aufgaben").select("id, titel, geplant_am, uhrzeit, dauer_min, frist").eq("user_id", uid).is("erledigt_am", null),
    admin.from("training_wochenplan").select("id, wochentag, uhrzeit, name, art").eq("user_id", uid),
  ]);
  const fehlgeschlagen = [routinen, alltag, aufgaben, training].find((r) => r.error);
  if (fehlgeschlagen) {
    console.error(fehlgeschlagen.error);
    return fehler(500, "Kalender gerade nicht lesbar.");
  }

  const ohne = new Set((abo.ohne_bereiche as string[]) || []);
  const von = plusTage(heute, -30);
  const bis = plusTage(heute, 365);
  const ics = kalenderIcs({
    zeitzone,
    heute,
    stempel: new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"),
    routinen: (routinen.data || [])
      .filter((r) => r.routine === "morgen" || r.routine === "abend")
      .map((r) => ({ key: r.routine as "morgen" | "abend", start: String(r.start_zeit || "").slice(0, 5), ende: r.end_zeit ? String(r.end_zeit).slice(0, 5) : null })),
    alltag: (alltag.data || [])
      .filter((e) => !(e.bereich_id && ohne.has(e.bereich_id as string)))
      .filter((e) => !e.datum || (e.datum >= von && e.datum <= bis))
      .map((e) => ({ id: e.id as string, titel: e.titel as string, datum: e.datum as string | null, wochentage: e.wochentage as string[], start: String(e.start_zeit || "").slice(0, 5), ende: e.end_zeit ? String(e.end_zeit).slice(0, 5) : null })),
    aufgaben: (aufgaben.data || []).map((a) => ({ id: a.id as string, titel: a.titel as string, geplant_am: a.geplant_am as string | null, uhrzeit: a.uhrzeit ? String(a.uhrzeit).slice(0, 5) : null, dauer_min: a.dauer_min as number | null, frist: a.frist as string | null })),
    training: (training.data || []).map((t) => ({ id: t.id as string, wochentag: t.wochentag as string, uhrzeit: t.uhrzeit ? String(t.uhrzeit).slice(0, 5) : null, name: t.name as string | null, art: t.art as string | null })),
  });

  await admin.from("kalender_abos").update({ abgerufen_am: new Date().toISOString() }).eq("user_id", uid);

  return new Response(req.method === "HEAD" ? null : ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="aka.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
});
