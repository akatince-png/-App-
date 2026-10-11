-- Blutdruck-Protokoll (11.10., Nutzerin: „im Blutzuckerbereich auch ein
-- Blutdruckprotokoll … reicht, wenn ich das eintragen kann, ich messe mit
-- einem Gerät zu Hause“). Manuelle Einträge; Smartwatch-Anbindung später.
-- Neue Tabelle, deshalb ohne „drop policy“ (läuft so auch über den Connector).
create table if not exists public.blutdruck_messungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  uhrzeit time,
  systolisch integer not null check (systolisch between 50 and 260),
  diastolisch integer not null check (diastolisch between 30 and 180),
  puls integer check (puls is null or puls between 25 and 250),
  notiz text check (notiz is null or char_length(notiz) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists blutdruck_messungen_user_idx on public.blutdruck_messungen (user_id, datum);

alter table public.blutdruck_messungen enable row level security;
create policy "blutdruck_messungen: eigene Zeilen" on public.blutdruck_messungen for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "blutdruck_messungen: admin voller Zugriff" on public.blutdruck_messungen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
