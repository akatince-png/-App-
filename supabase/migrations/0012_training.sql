-- Training: ein Log für alle Trainingsarten statt getrennter Module pro Art —
-- die Felder passen sich je nach gewählter Art im UI an, aber es ist eine
-- einzige Tabelle. Trennung in eigenständige Module (Bibliothek + Plan-
-- Builder) lohnt sich erst, wenn ein zweiter echter Anwendungsfall
-- (z. B. Trainingspläne kombinieren) das verlangt.
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  art text not null,
  name text not null default '',
  dauer_min integer,
  uebungen jsonb not null default '[]',
  distanz_km numeric,
  puls integer,
  runden integer,
  rpe integer,
  kalorien integer,
  energielevel text,
  schmerzen text,
  bemerkungen text not null default '',
  created_at timestamptz not null default now()
);

alter table public.training_sessions enable row level security;
create policy "training_sessions: eigene Zeilen" on public.training_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index training_sessions_user_datum_idx on public.training_sessions (user_id, datum);
