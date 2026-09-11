-- Punkte-/Abzeichen-System ("Errungenschaften") — Nutzerin-Vorgabe, 11.09.:
-- Streaks (Tage am Stück pro Kategorie + global) und Punkte (1 pro
-- erledigtem Eintrag) sollen motivierend sichtbar gemacht werden.
--
-- Punkte und Streaks selbst werden NICHT gespeichert, sondern bei Bedarf
-- direkt aus den bereits vorhandenen "erledigt"-Logs jeder Kategorie
-- berechnet (siehe src/utils/errungenschaften.js) — das vermeidet doppelte
-- Buchhaltung und das Risiko, dass ein separater Zähler von den echten
-- Daten abweicht. Nur WELCHE Abzeichen (Streak-/Punkte-Meilensteine)
-- bereits verdient wurden, muss dauerhaft festgehalten werden — sonst
-- verschwindet ein Abzeichen wieder, sobald ein Streak später reißt.
create table public.errungenschaften (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- z. B. 'training_streak_28', 'global_streak_90', 'global_punkte_500'.
  badge_key text not null,
  -- null bei globalen Abzeichen (Gesamt-Streak/-Punkte).
  kategorie text,
  erreicht_am timestamptz not null default now(),
  unique (user_id, badge_key)
);

alter table public.errungenschaften enable row level security;
create policy "errungenschaften: eigene Zeilen" on public.errungenschaften for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
