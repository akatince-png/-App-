-- Denkpause: kurze, freiwillige Multiple-Choice-Denksportaufgaben
-- (Nutzerinnen-Vorgabe, 16.09.) — jeder Versuch (richtig oder falsch) wird
-- protokolliert, damit (a) richtige Antworten ins bestehende Punktesystem
-- einzahlen können (siehe utils/errungenschaften.js, 1 Punkt pro Eintrag,
-- gleiche "Währung" wie alle anderen Lebensbereiche) und (b) unter
-- "Erfolge" pro Denkpause-Kategorie (Mathe/Wortspiele/Rätsel/
-- Allgemeinwissen) gezählt werden kann, wie viele gelöst und wie viele
-- nicht gelöst wurden — NICHT, welche einzelne Frage das war (keine
-- Frage-ID gespeichert, bewusst nicht nachvollziehbar bis ins Detail).
--
-- Bug-Fix (16.09.): Nutzerin meldete "relation denkpause_ergebnisse
-- already exists" beim Ausführen — vermutlich Rest eines früheren
-- Versuchs, bei dem die Tabelle schon angelegt wurde, Policy/Index aber
-- nicht mehr liefen, weil CREATE TABLE ohne Guard das Skript sofort
-- abbricht (gleiches Muster wie schon einmal bei 0071/0076 gelöst). Jetzt
-- mit "if not exists" / "drop policy if exists" geschrieben, damit ein
-- erneutes Ausführen nichts kaputt macht, egal wie weit der vorige
-- Versuch schon gekommen war.
create table if not exists public.denkpause_ergebnisse (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kategorie text not null,
  richtig boolean not null,
  erstellt_am timestamptz not null default now()
);

alter table public.denkpause_ergebnisse enable row level security;
drop policy if exists "denkpause_ergebnisse: eigene Zeilen" on public.denkpause_ergebnisse;
create policy "denkpause_ergebnisse: eigene Zeilen" on public.denkpause_ergebnisse for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists denkpause_ergebnisse_user_id_idx on public.denkpause_ergebnisse (user_id);
