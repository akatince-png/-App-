import { supabase } from "../lib/supabaseClient";
import { EINSTELLUNG } from "../utils/programme";
import { VORLAGE } from "../utils/einrichtung";

// Einrichtungs-Checkliste (27.09.): lädt für EINE Person alles, was die
// Checkliste braucht (als Admin, RLS-Admin-Rechte wie bei "Verwalten"), und
// setzt die AKA-Vorlagen per Tipp. Jede Vorlage lässt sich danach ganz
// normal manuell in der jeweiligen Seite ändern.
const anzahl = async (tabelle, userId, filter) => {
  let q = supabase.from(tabelle).select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (filter) q = filter(q);
  const { count } = await q;
  return count || 0;
};

export async function einrichtungLaden(userId) {
  const [profil, routinen, schritte, training, wasser, licht, mahlzeiten, medikamente, supplemente, geraete, teilnahme] = await Promise.all([
    supabase.from("profiles").select("vorname, zeitzone, onboarding_complete, erinnerungen, category_ziele, team_id, steckbrief").eq("id", userId).maybeSingle(),
    supabase.from("routine_einstellungen").select("routine, start_zeit, end_zeit").eq("user_id", userId),
    supabase.from("routine_schritte").select("routine").eq("user_id", userId),
    supabase.from("training_wochenplan").select("wochentag").eq("user_id", userId),
    supabase.from("hydration_settings").select("ziel_ml").eq("user_id", userId).maybeSingle(),
    supabase.from("tageslicht_settings").select("ziel_minuten").eq("user_id", userId).maybeSingle(),
    anzahl("meal_wochenplan", userId),
    anzahl("hormones", userId),
    anzahl("supplements", userId),
    anzahl("push_subscriptions", userId),
    supabase.from("programm_teilnahmen").select("status, start").eq("user_id", userId).eq("programm_id", EINSTELLUNG).maybeSingle(),
  ]);
  if (profil.error) return { ok: false, error: profil.error.message };
  const p = profil.data || {};
  let teamName = null;
  if (p.team_id) {
    const { data: t } = await supabase.from("teams").select("name").eq("id", p.team_id).maybeSingle();
    teamName = t?.name || null;
  }
  const r = Object.fromEntries((routinen.data || []).map((x) => [x.routine, { start: x.start_zeit, ende: x.end_zeit }]));
  const s = { morgen: 0, abend: 0 };
  (schritte.data || []).forEach((x) => (s[x.routine] = (s[x.routine] || 0) + 1));
  const schlaf = p.category_ziele?.schlaf;
  return {
    ok: true,
    fakten: {
      vorname: p.vorname,
      angemeldet: !!p.zeitzone,
      onboardingFertig: !!p.onboarding_complete,
      steckbrief: p.steckbrief || null,
      erinnerungen: p.erinnerungen || {},
      teamId: p.team_id || null,
      teamName,
      routinen: r,
      schritte: s,
      trainingTage: new Set((training.data || []).map((x) => x.wochentag)).size,
      wasserMl: wasser.data?.ziel_ml || null,
      lichtMin: licht.data?.ziel_minuten || null,
      schlafGeplant: !!(schlaf && ((Array.isArray(schlaf.bloecke) && schlaf.bloecke.length) || schlaf.bettzeit || schlaf.aufwachzeit)),
      mahlzeiten,
      medikamente,
      supplemente,
      geraete,
      teilnahme: teilnahme.data || null,
    },
  };
}

const fehler = (error) => {
  console.error(error);
  return { ok: false, error: error.message };
};

// Eine Vorlage für einen Schritt übernehmen (nur für Schritte mit `vorlage`).
export async function vorlageUebernehmen(userId, key, fakten) {
  if (key === "abendroutine" || key === "morgenroutine") {
    const routine = key === "abendroutine" ? "abend" : "morgen";
    const v = VORLAGE[routine];
    const { error } = await supabase.from("routine_einstellungen").upsert({ user_id: userId, routine, start_zeit: v.start, end_zeit: v.ende }, { onConflict: "user_id,routine" });
    return error ? fehler(error) : { ok: true };
  }
  if (key === "wasser") {
    const { error } = await supabase.from("hydration_settings").upsert({ user_id: userId, ziel_ml: VORLAGE.wasserMl }, { onConflict: "user_id" });
    return error ? fehler(error) : { ok: true };
  }
  if (key === "licht") {
    const { error } = await supabase.from("tageslicht_settings").upsert({ user_id: userId, ziel_minuten: VORLAGE.lichtMin }, { onConflict: "user_id" });
    return error ? fehler(error) : { ok: true };
  }
  if (key === "erinnerungen") {
    const alt = fakten?.erinnerungen || {};
    const an = (w) => ({ ...(w && typeof w === "object" ? w : {}), aktiv: true, vorlaufMinuten: (w && w.vorlaufMinuten) ?? 15 });
    const neu = { ...alt, morgenroutine: an(alt.morgenroutine), abendroutine: an(alt.abendroutine) };
    const { error } = await supabase.from("profiles").update({ erinnerungen: neu }).eq("id", userId);
    return error ? fehler(error) : { ok: true };
  }
  return { ok: false, error: "Für diesen Schritt gibt es keine Vorlage." };
}

// Alle offenen Vorlagen auf einmal ("Alles Übliche übernehmen").
export async function alleVorlagenUebernehmen(userId, schritte, fakten) {
  for (const s of schritte.filter((x) => x.vorlage && !x.fertig)) {
    const r = await vorlageUebernehmen(userId, s.key, fakten);
    if (!r.ok) return r;
  }
  return { ok: true };
}
