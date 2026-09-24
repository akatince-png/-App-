-- Profilbilder (Nutzerinnen-Wunsch 24.09.2026): jede Person kann freiwillig
-- ein Foto (z. B. vom Gesicht) ins Profil setzen, damit sich Team-Mitglieder,
-- die sich nicht persönlich kennen, ein Bild machen können. Sichtbar für:
-- die Person selbst, Admins/Coach und Mitglieder desselben Teams — sonst
-- niemand. Das Hochladen selbst ist die Zustimmung (die App sagt vorher,
-- wer das Bild sieht); Entfernen geht jederzeit.

alter table public.profiles add column if not exists profilbild_pfad text;

-- Privater Bucket, Dateien liegen unter "<user_id>/<datei>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profilbilder', 'profilbilder', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "profilbilder: eigene hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profilbilder' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profilbilder: eigene ändern" on storage.objects
  for update to authenticated
  using (bucket_id = 'profilbilder' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profilbilder: eigene löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profilbilder' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profilbilder: lesen (selbst, Admin, eigenes Team)" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profilbilder'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
      or public.gleiches_team(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- Team-Kolleg:innen: profiles ist per RLS nur für die eigene Zeile lesbar
-- (plus Admin). Die bisherige direkte Abfrage in useTeamData.js lieferte
-- Coachees deshalb nie ihre Team-Kolleg:innen — die Team-Karte blieb leer.
-- Diese Funktion gibt nur das Nötigste (Vorname, Profilbild) von Personen
-- im selben Team heraus.
create or replace function public.team_kollegen()
returns table (id uuid, vorname text, profilbild_pfad text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.vorname, p.profilbild_pfad
  from public.profiles p
  where p.id <> auth.uid()
    and public.gleiches_team(auth.uid(), p.id);
$$;

revoke execute on function public.team_kollegen() from anon, public;
grant execute on function public.team_kollegen() to authenticated;

-- Rangliste zusätzlich mit Profilbild (Rückgabetyp ändert sich → neu anlegen).
-- Regeln unverändert aus 0092 (Team-Sichtbarkeit + Ausblenden-Möglichkeit).
drop function if exists public.quest_rangliste();
create function public.quest_rangliste()
returns table (
  user_id uuid,
  vorname text,
  quests_erledigt bigint,
  quests_angenommen bigint,
  profilbild_pfad text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.vorname,
    count(*) filter (where qf.erledigt) as quests_erledigt,
    count(*) filter (where qf.angenommen = true) as quests_angenommen,
    p.profilbild_pfad
  from public.profiles p
  left join public.quest_fortschritt qf on qf.user_id = p.id
  where p.is_admin = false
    and p.rangliste_sichtbar = true
    and (
      public.is_admin(auth.uid())
      or p.id = auth.uid()
      or public.gleiches_team(auth.uid(), p.id)
    )
  group by p.id, p.vorname, p.profilbild_pfad
  order by quests_erledigt desc, quests_angenommen desc;
$$;

revoke execute on function public.quest_rangliste() from anon, public;
grant execute on function public.quest_rangliste() to authenticated;

-- Admin-Liste (Coachee-Übersicht, Team-Verwaltung) ebenfalls mit Profilbild.
drop function if exists public.admin_liste_probanden();
create function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean,
  team_id uuid,
  onboarding_modus text,
  profilbild_pfad text
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email, p.vorname, u.created_at, p.onboarding_complete, p.is_admin, p.team_id, p.onboarding_modus, p.profilbild_pfad
  from auth.users u
  join public.profiles p on p.id = u.id
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;

revoke execute on function public.admin_liste_probanden() from anon, public;
grant execute on function public.admin_liste_probanden() to authenticated;
