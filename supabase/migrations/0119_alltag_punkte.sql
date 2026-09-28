-- Kalender „Mein Alltag“ zählt in die Punkte (28.09., Nutzerin: „Ja“):
-- 1 Punkt je Tag mit mindestens einem abgehakten Alltags-Eintrag (wie
-- Gemeinsam fokussieren). Sonst unverändert gegenüber Migration 0117.
create or replace function public._punkte_ereignisse(p_user uuid)
 returns table(tag date)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with zone as (
    select coalesce(nullif(p.zeitzone, ''), 'Europe/Berlin') as tz from public.profiles p where p.id = p_user
  )
  select dose_date from public.hormone_logs where user_id = p_user and erledigt
  union all select log_date from public.supplement_logs where user_id = p_user and erledigt
  union all select log_date from public.meal_logs where user_id = p_user and erledigt
  union all select log_date from public.routine_logs where user_id = p_user
  union all select datum from public.training_sessions where user_id = p_user and erledigt
  union all select datum from public.sleep_entries where user_id = p_user
  union all select datum from (select datum, routine from public.routine_durchlaeufe where user_id = p_user and abgeschlossen_um is not null group by datum, routine) r
  union all
    select h.datum from public.hydration_logs h
    left join public.hydration_settings s on s.user_id = h.user_id
    where h.user_id = p_user
    group by h.datum, s.ziel_ml
    having sum(h.menge_ml) >= coalesce(s.ziel_ml, 2500)
  union all
    select t.datum from public.tageslicht_logs t
    left join public.tageslicht_settings s on s.user_id = t.user_id
    where t.user_id = p_user
    group by t.datum, s.ziel_minuten
    having sum(t.minuten) >= coalesce(s.ziel_minuten, 30)
  union all select (erstellt_am at time zone (select tz from zone))::date from public.atemuebung_logs where user_id = p_user
  union all select (erstellt_am at time zone (select tz from zone))::date from public.denkpause_ergebnisse where user_id = p_user and richtig
  union all
    select (erstellt_am at time zone (select tz from zone))::date as tag from public.denkpause_ergebnisse
    where user_id = p_user
    group by 1
    having count(*) >= 5
  union all select datum from public.gruppen_baustein_logs where user_id = p_user
  union all select datum from public.tagebuch_eintraege where user_id = p_user
  union all select distinct (erstellt_am at time zone (select tz from zone))::date from public.kognitiv_ergebnisse where user_id = p_user
  union all select distinct (start_um at time zone (select tz from zone))::date from public.fokus_sitzungen where user_id = p_user and ergebnis is not null
  union all select distinct datum from public.alltag_erledigt where user_id = p_user;
$function$;
