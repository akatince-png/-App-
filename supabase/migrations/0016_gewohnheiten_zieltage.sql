-- Repurposes the existing routines/routine_logs tables as a simple habit
-- tracker (Gewohnheiten). Adds an optional target-day count per habit so the
-- progress display isn't locked to a fixed number (e.g. the often-cited but
-- unofficial "21/28 days" rule) — users can set their own target or leave it
-- open and just see days completed.
alter table routines add column if not exists ziel_tage integer;
