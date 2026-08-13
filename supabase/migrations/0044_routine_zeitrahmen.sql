-- Zeitrahmen pro Routine (Nutzerinnen-Vorgabe, 13.08.): Morgen-/Abendroutine
-- sollen einen groben Start-/Endzeitpunkt bekommen (z. B. Morgenroutine
-- 6:00-9:00 Uhr) — getrennt von den einzelnen Schritten (routine_schritte),
-- weil der Zeitrahmen die Routine als Ganzes betrifft, nicht einen Schritt.
-- Dient als Grundlage für die Überlappungs-Erkennung mit anderen geplanten
-- Punkten (z. B. Training), die in diesen Zeitrahmen fallen.
create table public.routine_einstellungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null check (routine in ('morgen', 'abend')),
  start_zeit time,
  end_zeit time,
  created_at timestamptz not null default now(),
  unique (user_id, routine)
);

alter table public.routine_einstellungen enable row level security;
create policy "routine_einstellungen: eigene Zeilen" on public.routine_einstellungen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
