-- Quests: freiwillige Sonderaufgaben, die die Coach zusätzlich zum
-- eigentlichen Protokoll vergeben kann (Nutzerinnen-Vorgabe 16.08.: "diese
-- Woche machen wir drei Sätze isometrisches Training ... das soll sone
-- freiwillige Aufgabe sein, die die Coachees noch zusätzlich übernehmen
-- dürfen, falls sie Interesse dran haben"). Bewusst eine eigene Tabelle statt
-- eines "optional"-Flags in training_wochenplan/gewohnheiten etc. — Quests
-- haben ein eigenes Ziel/Zeitfenster und werden separat abgeschlossen und
-- gemeldet, eine Vermischung mit dem festen Pflicht-Plan würde beides
-- verkomplizieren.
--
-- V1-Umfang (Rest bewusst vertagt, siehe UEBERGABEPROTOKOLL.md):
--   - Zieltyp: "einfach" (an/aus) oder "anzahl" (Fortschritts-Zahl gegen ein
--     Ziel, z. B. "500 ml", "3 Sätze"). Eine Freitext-Notiz ist bei JEDER
--     Quest zusätzlich möglich, unabhängig vom Typ (deckt "hab nur 3 Leute
--     getroffen" ab, ohne einen dritten Typ zu brauchen).
--   - Zielgruppe: eine einzelne Coachee (proband_id gesetzt) ODER alle auf
--     einmal (proband_id null) — analog zum "Rundruf"-Gedanken, ohne eine
--     eigene n:m-Zuordnungstabelle für den Alle-Fall zu brauchen.
--   - Annehmen/Ablehnen (quest_fortschritt.angenommen, tri-state: noch
--     unbeantwortet/angenommen/abgelehnt) — Nutzerinnen-Vorgabe 16.08.:
--     "wenn sie die Quest annehmen und antreten, dann soll sie ... im
--     Tagesplan ... und dann unter Gewohnheiten ... mit aufgeführt werden".
--     Erst nach Annahme taucht die Quest dort auf, vorher nur als Einladung
--     auf der Startseite. Die Coachee wird über eine neue Quest zusätzlich
--     per Nachricht benachrichtigt (bestehende coachee_nachrichten-Tabelle,
--     siehe adminQuestErstellen() in useQuestData.js).
--   - Bewusst NICHT in V1: Rangliste/Vergleich zwischen Coachees
--     ("Konkurrenz" vs. "Gruppendynamik/Team") und eine automatische
--     Kopplung an echte Protokoll-Werte (z. B. jeden geloggten Trainingssatz
--     automatisch mitzählen) — beides in der Nutzerinnen-Vorgabe genannt,
--     aber ein eigenes, größeres Feature. Hier erstmal die manuelle Version:
--     die Coachee meldet ihren Stand/Abschluss selbst.

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  proband_id uuid references auth.users (id) on delete cascade,
  titel text not null,
  beschreibung text,
  typ text not null default 'einfach' check (typ in ('einfach', 'anzahl')),
  ziel_anzahl numeric,
  einheit text,
  gueltig_bis date,
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now()
);

create index quests_proband_idx on public.quests (proband_id);

alter table public.quests enable row level security;

-- Coachee sieht eigene (proband_id = ihre id) UND Rundruf-Quests
-- (proband_id null) — Anlegen/Ändern/Archivieren bleibt der Admin
-- vorbehalten (kein "eigene Zeilen anlegen" für Coachees, anders als bei
-- coachee_nachrichten).
create policy "quests: sichtbare Zeilen lesen" on public.quests
  for select using (auth.uid() = proband_id or proband_id is null);

create policy "quests: admin voller Zugriff" on public.quests
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- quest_fortschritt: pro Quest + Coachee genau eine Zeile (auch bei
-- Rundruf-Quests — jede Person meldet ihren eigenen Stand separat).
-- Upsert auf (quest_id, user_id), siehe useQuestData.js.
create table public.quest_fortschritt (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  angenommen boolean,
  wert numeric,
  erledigt boolean not null default false,
  erledigt_am timestamptz,
  notiz text,
  dauer_minuten integer,
  aktualisiert_am timestamptz not null default now(),
  unique (quest_id, user_id)
);

create index quest_fortschritt_user_idx on public.quest_fortschritt (user_id);
create index quest_fortschritt_quest_idx on public.quest_fortschritt (quest_id);

alter table public.quest_fortschritt enable row level security;

create policy "quest_fortschritt: eigene Zeilen anlegen" on public.quest_fortschritt
  for insert with check (auth.uid() = user_id);

create policy "quest_fortschritt: eigene Zeilen lesen" on public.quest_fortschritt
  for select using (auth.uid() = user_id);

create policy "quest_fortschritt: eigene Zeilen aktualisieren" on public.quest_fortschritt
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quest_fortschritt: admin voller Zugriff" on public.quest_fortschritt
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
