-- Tagebuch: Stichworte grün/rot mit „weil …“ (07.10.2026, Nutzerin freigegeben:
-- „Ja, die Tagebuchgeschichte kannst du erledigen“). Die Smileys bleiben.
-- stichworte = [{ "wort": "stressig", "art": "schwer", "weil": "drei Termine" }, …]
-- Bestehende Einträge bleiben unverändert (Standard: leere Liste).
-- Am 07.10. per Supabase-SQL eingespielt (apply_migration hing; Befehle mit
-- „drop“ warten im Werkzeug auf eine Bestätigung, deshalb eine neue Funktion
-- neben admin_tagebuch statt dessen Rückgabe zu ändern).
alter table public.tagebuch_eintraege
  add column if not exists stichworte jsonb not null default '[]'::jsonb;

-- Coach-Ansicht: Stichworte immer, das „weil …“ nur, wenn die Notiz geteilt
-- ist (gleiche Regel wie bei der Notiz in admin_tagebuch).
create or replace function public.admin_tagebuch_stichworte(p_user uuid, p_tage int default 60)
returns table (datum date, stichworte jsonb)
language sql stable security definer set search_path = public as $f$
  select t.datum,
         case when t.notiz_teilen then t.stichworte
              else coalesce((select jsonb_agg(s - 'weil') from jsonb_array_elements(t.stichworte) s), '[]'::jsonb) end
  from public.tagebuch_eintraege t
  where public.is_admin(auth.uid()) and t.user_id = p_user and t.datum > current_date - p_tage
  order by t.datum;
$f$;
revoke execute on function public.admin_tagebuch_stichworte(uuid, int) from anon, public;
grant execute on function public.admin_tagebuch_stichworte(uuid, int) to authenticated;
