-- Coaching-Fragebögen: generische Ablage für Lebensrahmenbedingungen- und
-- künftige Coaching-Fragebögen (analog zum Lexikon eine neue, von den
-- Peptid-/Hormon-Protokollen unabhängige Ebene). Ein Nutzer kann denselben
-- Fragebogen-Typ mehrfach durcharbeiten (z. B. jährliche Wiederholung) —
-- deshalb mehrere Zeilen je (user_id, typ) statt eines Upserts, jede Zeile
-- entspricht einer "Erhebung".
create table if not exists public.fragebogen_antworten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  typ text not null,
  status text not null default 'offen' check (status in ('offen', 'abgeschlossen')),
  antworten jsonb not null default '{}'::jsonb,
  auswertung jsonb not null default '{}'::jsonb,
  erstellt_am timestamptz not null default now(),
  aktualisiert_am timestamptz not null default now()
);

alter table public.fragebogen_antworten enable row level security;

drop policy if exists "fragebogen_antworten: eigene Zeilen" on public.fragebogen_antworten;
create policy "fragebogen_antworten: eigene Zeilen" on public.fragebogen_antworten for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists fragebogen_antworten_user_typ_idx on public.fragebogen_antworten (user_id, typ);
