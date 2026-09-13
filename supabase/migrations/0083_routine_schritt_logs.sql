-- Direkte Tages-Bestätigung einzelner Routine-Schritte (Nutzerin-Vorgabe,
-- 12.09.): bisher wurde ein Morgen-/Abendroutine-Durchlauf nur EINMAL AM
-- STÜCK über den geführten Ablauf (RoutineAblauf.jsx, routine_durchlaeufe)
-- gespeichert — es gab keine Möglichkeit, einen einzelnen Schritt (z. B.
-- "Exemestan nehmen") unabhängig davon direkt von der Startseite aus
-- abzuhaken. Eigene, schlanke Log-Tabelle nach demselben Muster wie
-- routine_logs (Gewohnheiten): eine Zeile = an diesem Tag erledigt,
-- Löschen = rückgängig gemacht.
create table if not exists public.routine_schritt_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  schritt_id uuid not null references public.routine_schritte (id) on delete cascade,
  datum date not null,
  erledigt_at timestamptz not null default now(),
  unique (user_id, schritt_id, datum)
);

alter table public.routine_schritt_logs enable row level security;
drop policy if exists "routine_schritt_logs: eigene Zeilen" on public.routine_schritt_logs;
create policy "routine_schritt_logs: eigene Zeilen" on public.routine_schritt_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
