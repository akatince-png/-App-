-- Spontan-Einträge (30.09., Vorschau): Dinge, die über den Tag ungeplant
-- passieren und im Kreis-Schnellmenü erfasst werden – Nickerchen und eine
-- zusätzliche Einnahme außerhalb des Plans (z. B. Pre-Workout vor einem
-- spontanen Training). Schlaf (sleep_entries) bleibt einmal pro Nacht,
-- geplante Supplemente/Medikamente bleiben in ihren eigenen Tabellen.
create table if not exists public.spontan_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  art text not null check (art in ('nickerchen', 'einnahme')),
  datum date not null,
  uhrzeit time,
  dauer_min integer check (dauer_min is null or dauer_min between 1 and 600),
  name text check (name is null or char_length(name) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists spontan_eintraege_user_idx on public.spontan_eintraege (user_id, datum);

alter table public.spontan_eintraege enable row level security;
drop policy if exists "spontan_eintraege: eigene Zeilen" on public.spontan_eintraege;
create policy "spontan_eintraege: eigene Zeilen" on public.spontan_eintraege for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "spontan_eintraege: admin voller Zugriff" on public.spontan_eintraege;
create policy "spontan_eintraege: admin voller Zugriff" on public.spontan_eintraege for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
