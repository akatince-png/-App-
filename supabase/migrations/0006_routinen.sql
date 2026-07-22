-- Routinen: fassen bereits vorhandene Einträge (Peptide, Medikamente,
-- Supplemente, Mahlzeiten) zu einem einzigen bestätigbaren Punkt im
-- Tagesplan zusammen (z. B. "Morgendrink" = Kreatin + Magnesium + Vitamin D).
--
-- Architekturentscheidung: pro Kategorie eine eigene Verknüpfungstabelle mit
-- echtem Fremdschlüssel (statt einer einzigen "kann alles referenzieren"
-- Tabelle). Dadurch verschwindet ein gelöschtes Supplement/Peptid/etc. über
-- "on delete cascade" automatisch und sauber aus jeder Routine — es braucht
-- keinen eigenen Aufräum-Code und es können keine verwaisten Referenzen
-- entstehen. Etwas mehr Schema, dafür referenzielle Integrität durch die
-- Datenbank statt durch Anwendungslogik.

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '⭐',
  uhrzeit time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;
create policy "routines: eigene Zeilen" on public.routines for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_peptide_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  protocol_peptide_id uuid not null references public.protocol_peptide (id) on delete cascade,
  unique (routine_id, protocol_peptide_id)
);

alter table public.routine_peptide_items enable row level security;
create policy "routine_peptide_items: eigene Zeilen" on public.routine_peptide_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_hormon_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  hormone_id uuid not null references public.hormones (id) on delete cascade,
  unique (routine_id, hormone_id)
);

alter table public.routine_hormon_items enable row level security;
create policy "routine_hormon_items: eigene Zeilen" on public.routine_hormon_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_supplement_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  unique (routine_id, supplement_id)
);

alter table public.routine_supplement_items enable row level security;
create policy "routine_supplement_items: eigene Zeilen" on public.routine_supplement_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.routine_meal_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  unique (routine_id, meal_id)
);

alter table public.routine_meal_items enable row level security;
create policy "routine_meal_items: eigene Zeilen" on public.routine_meal_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tagesbezogenes Bestätigen der Routine als Ganzes (unabhängig vom
-- Bestätigen-Status der einzelnen enthaltenen Einträge, die weiterhin ihre
-- eigene Historie behalten).
create table public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  log_date date not null,
  erledigt_at timestamptz not null default now(),
  unique (routine_id, log_date)
);

alter table public.routine_logs enable row level security;
create policy "routine_logs: eigene Zeilen" on public.routine_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
