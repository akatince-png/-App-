-- Aufgaben-Matrix (30.09., Vorschau): Aufgaben eines Projekts/Workflows
-- mit „wichtig?“ und Frist. Das Farbfeld (JETZT/PLANEN/KURZ HALTEN/
-- SPÄTER) berechnet die App selbst (src/utils/matrix.js); nur eine
-- eigene Wahl wird gespeichert (quadrant_manuell). Rote und heute
-- eingeplante grüne Aufgaben erscheinen automatisch im Tagesplan.
create table if not exists public.matrix_aufgaben (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  projekt_id uuid references public.projekte (id) on delete set null,
  titel text not null check (char_length(titel) between 1 and 200),
  wichtig boolean,
  frist date,
  dauer_min integer check (dauer_min is null or dauer_min between 1 and 1440),
  naechster_schritt text,
  quadrant_manuell text check (quadrant_manuell in ('jetzt', 'planen', 'kurz', 'spaeter')),
  geplant_am date,
  verschoben integer not null default 0,
  erledigt_am timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists matrix_aufgaben_user_idx on public.matrix_aufgaben (user_id, erledigt_am);

alter table public.matrix_aufgaben enable row level security;
drop policy if exists "matrix_aufgaben: eigene Zeilen" on public.matrix_aufgaben;
create policy "matrix_aufgaben: eigene Zeilen" on public.matrix_aufgaben for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "matrix_aufgaben: admin voller Zugriff" on public.matrix_aufgaben;
create policy "matrix_aufgaben: admin voller Zugriff" on public.matrix_aufgaben for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
