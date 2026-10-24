// Erinnerungen für den Kalender „Mein Alltag“ (28.09., Migration 0118).
// Eigene kleine Function statt Erweiterung von send-due-reminders, damit die
// große Erinnerungs-Function unangetastet bleibt. Läuft per pg_cron jede
// Minute (Job "aka-alltag-erinnerungen", gleicher Header wie
// send-due-reminders; das Geheimnis steht in public.cron_konfig).
// Schickt zur Startzeit jedes Eintrags mit erinnerung = true eine Push-
// Nachricht – wöchentlich (wochentage) oder einmalig (datum). Abschaltbar je
// Person über profiles.erinnerungen.alltag = false bzw. { aktiv: false }.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendeAnGeraet } from "../_shared/push.ts";
import { erinnerungsZeit, matrixText } from "./matrix.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function lokal(zeitzone: string): { jetzt: string; heute: string; wochentag: string } | null {
  try {
    const teile = new Intl.DateTimeFormat("en-CA", {
      timeZone: zeitzone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(new Date());
    const w = (t: string) => teile.find((x) => x.type === t)?.value || "";
    const heute = `${w("year")}-${w("month")}-${w("day")}`;
    const stunde = w("hour") === "24" ? "00" : w("hour");
    return { jetzt: `${stunde}:${w("minute")}`, heute, wochentag: WOCHENTAGE[new Date(`${heute}T12:00:00Z`).getUTCDay()] };
  } catch {
    return null;
  }
}

function abgeschaltet(wert: unknown): boolean {
  if (wert === false) return true;
  return !!wert && typeof wert === "object" && (wert as { aktiv?: boolean }).aktiv === false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const geschickt = req.headers.get("x-cron-secret");
  const { data: konfig } = await admin.from("cron_konfig").select("wert").eq("name", "send-due-reminders").maybeSingle();
  if (!geschickt || !konfig?.wert || geschickt !== konfig.wert) {
    return new Response(JSON.stringify({ error: "Nicht autorisiert." }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { data: eintraege, error } = await admin
      .from("alltag_eintraege")
      .select("user_id, titel, start_zeit, wochentage, datum")
      .eq("erinnerung", true);
    if (error) throw error;
    // Matrix-Aufgaben mit Erinnerung (24.10., Migration 0132).
    const { data: aufgaben, error: mError } = await admin
      .from("matrix_aufgaben")
      .select("user_id, titel, geplant_am, frist, uhrzeit, erinnerung, erledigt_am")
      .not("erinnerung", "is", null)
      .is("erledigt_am", null);
    if (mError) throw mError;
    const userIds = [...new Set([...(eintraege || []), ...(aufgaben || [])].map((e) => e.user_id as string))];
    if (!userIds.length) return new Response(JSON.stringify({ ok: true, faellig: 0, versendet: 0 }), { headers: { "Content-Type": "application/json" } });

    const { data: profile, error: pError } = await admin.from("profiles").select("id, zeitzone, erinnerungen").in("id", userIds);
    if (pError) throw pError;
    const info = new Map<string, { jetzt: string; heute: string; wochentag: string }>();
    for (const p of profile || []) {
      if (!p.zeitzone || abgeschaltet((p.erinnerungen || {}).alltag)) continue;
      const l = lokal(p.zeitzone);
      if (l) info.set(p.id, l);
    }

    const faellig = new Map<string, string[]>();
    const matrixFaellig = new Map<string, string[]>();
    for (const e of eintraege || []) {
      const i = info.get(e.user_id as string);
      if (!i || String(e.start_zeit || "").slice(0, 5) !== i.jetzt) continue;
      const gilt = e.datum ? e.datum === i.heute : ((e.wochentage as string[]) || []).includes(i.wochentag);
      if (!gilt) continue;
      faellig.set(e.user_id as string, [...(faellig.get(e.user_id as string) || []), (e.titel as string) || "Termin"]);
    }
    for (const a of aufgaben || []) {
      const i = info.get(a.user_id as string);
      if (!i || erinnerungsZeit(a, i.heute) !== i.jetzt) continue;
      matrixFaellig.set(a.user_id as string, [...(matrixFaellig.get(a.user_id as string) || []), matrixText(a)]);
    }
    if (!faellig.size && !matrixFaellig.size) return new Response(JSON.stringify({ ok: true, faellig: 0, versendet: 0 }), { headers: { "Content-Type": "application/json" } });

    const empfaenger = [...new Set([...faellig.keys(), ...matrixFaellig.keys()])];
    const { data: subs, error: sError } = await admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth_key").in("user_id", empfaenger);
    if (sError) throw sError;
    let versendet = 0;
    for (const sub of subs || []) {
      const nachrichten = [
        { titel: faellig.get(sub.user_id as string), kopf: "🗓️ Mein Alltag", url: "/#/kalender" },
        { titel: matrixFaellig.get(sub.user_id as string), kopf: "🗂️ Aus deiner Matrix", url: "/#/matrix" },
      ];
      for (const n of nachrichten) {
        if (!n.titel?.length) continue;
        const ergebnis = await sendeAnGeraet(sub, { title: n.kopf, body: n.titel.join(" · "), url: n.url });
        if (ergebnis === "ok") versendet++;
        else if (ergebnis === "ungueltig") {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          break;
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, faellig: faellig.size + matrixFaellig.size, versendet }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unerwarteter Fehler." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
