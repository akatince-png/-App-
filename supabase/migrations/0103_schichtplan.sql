-- Schichtarbeit (25.09., Nutzerinnen-Freigabe der Vorschau): verschiedene
-- Morgen-/Abendroutine-Zeiten je Schichtart ("Zeit-Varianten", z. B.
-- Frühschicht/Spätschicht/Frei) und ein Schichtplan, der je Tag sagt,
-- welche Variante gilt. Tage ohne Eintrag nutzen weiter die normale Zeit
-- aus routine_einstellungen. Die Schritte bleiben dieselben; einzelne
-- Schritte können nur für bestimmte Varianten oder erst ab einem Datum
-- gelten (routine_schritte.nur_varianten / gueltig_ab).

create table if not exists public.routine_varianten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '🕐',
  arbeit_von time,
  arbeit_bis time,
  morgen_start time,
  abend_start time,
  reihenfolge int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists routine_varianten_user_idx on public.routine_varianten (user_id);

-- art: 'variante' (variante_id gesetzt), 'krank' (keine Zeiten, nichts
-- gilt als verspätet), 'eigen' (eigene Zeiten nur für diesen Tag).
create table if not exists public.routine_schichtplan (
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  variante_id uuid references public.routine_varianten (id) on delete cascade,
  art text not null default 'variante' check (art in ('variante', 'krank', 'eigen')),
  morgen_start time,
  abend_start time,
  created_at timestamptz not null default now(),
  primary key (user_id, datum)
);

alter table public.routine_schritte add column if not exists nur_varianten uuid[];
alter table public.routine_schritte add column if not exists gueltig_ab date;

alter table public.routine_varianten enable row level security;
alter table public.routine_schichtplan enable row level security;

drop policy if exists "routine_varianten: eigene Zeilen" on public.routine_varianten;
create policy "routine_varianten: eigene Zeilen" on public.routine_varianten for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "routine_varianten: admin voller Zugriff" on public.routine_varianten;
create policy "routine_varianten: admin voller Zugriff" on public.routine_varianten for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "routine_schichtplan: eigene Zeilen" on public.routine_schichtplan;
create policy "routine_schichtplan: eigene Zeilen" on public.routine_schichtplan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "routine_schichtplan: admin voller Zugriff" on public.routine_schichtplan;
create policy "routine_schichtplan: admin voller Zugriff" on public.routine_schichtplan for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
