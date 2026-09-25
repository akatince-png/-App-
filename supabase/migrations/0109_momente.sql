-- Moment festhalten (25.09., Nutzerinnen-Vorgabe): über den gelben
-- 💡-Knopf zwischendurch eintragen, was gerade los ist (aufgewühlt,
-- impulsiv, ausgerastet …), Auslöser, wer dabei war, wo. Freitext privat
-- wie beim Tagebuch; der Coach liest über admin_momente() ohne ungeteilte Notiz.
create table if not exists public.moment_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  zeit timestamptz not null default now(),
  gefuehle text[] not null default '{}',
  staerke int check (staerke between 1 and 5),
  ausloeser text,
  personen text[] not null default '{}',
  orte text[] not null default '{}',
  hilfe text[] not null default '{}',
  notiz_teilen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists moment_eintraege_user_zeit_idx on public.moment_eintraege (user_id, zeit);
alter table public.moment_eintraege enable row level security;
drop policy if exists "moment_eintraege: eigene Zeilen" on public.moment_eintraege;
create policy "moment_eintraege: eigene Zeilen" on public.moment_eintraege for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.admin_momente(p_user uuid, p_tage int default 30)
returns table(id uuid, zeit timestamptz, gefuehle text[], staerke int, ausloeser text, personen text[], orte text[], hilfe text[], notiz_teilen boolean)
language sql stable security definer set search_path to 'public'
as $$
  select m.id, m.zeit, m.gefuehle, m.staerke, case when m.notiz_teilen then m.ausloeser else null end, m.personen, m.orte, m.hilfe, m.notiz_teilen
  from public.moment_eintraege m
  where public.is_admin(auth.uid()) and m.user_id = p_user and m.zeit >= now() - make_interval(days => p_tage)
  order by m.zeit desc;
$$;
revoke all on function public.admin_momente(uuid, int) from public, anon;
grant execute on function public.admin_momente(uuid, int) to authenticated;
