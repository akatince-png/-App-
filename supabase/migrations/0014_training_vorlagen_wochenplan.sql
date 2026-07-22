-- Trainingsvorlagen: einmal benannte Übungszusammenstellung (z. B.
-- "Brusttraining"), wiederverwendbar an beliebigen Tagen — verhindert
-- wiederholtes Abtippen derselben Übungen.
create table public.training_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  art text not null,
  uebungen jsonb not null default '[]',
  dauer_min integer,
  distanz_km numeric,
  puls integer,
  runden integer,
  intervall_arbeit_sek integer,
  intervall_pause_sek integer,
  created_at timestamptz not null default now()
);

alter table public.training_templates enable row level security;
create policy "training_templates: eigene Zeilen" on public.training_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Wochenplan: welche Trainingsart (und optional welche Vorlage) an welchem
-- Wochentag standardmäßig ansteht. Höchstens ein Eintrag pro Wochentag;
-- fehlt ein Wochentag, ist er einfach ein Ruhetag.
create table public.training_wochenplan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wochentag text not null check (wochentag in ('Mo','Di','Mi','Do','Fr','Sa','So')),
  art text not null,
  template_id uuid references public.training_templates (id) on delete set null,
  unique (user_id, wochentag)
);

alter table public.training_wochenplan enable row level security;
create policy "training_wochenplan: eigene Zeilen" on public.training_wochenplan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
