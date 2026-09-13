-- Neuer, eigenständiger Protokollbereich "Atemübungen" (Teil 19,
-- Nutzerinnen-Vorgabe 16.08.): kein KI-Einsatz nötig (rein
-- client-seitiger Intervall-Timer, siehe AtemTimer.jsx) — daher hier nur
-- Presets + Sitzungs-Log, keine Edge Function.
--
-- atemuebungen: gespeicherte Atem-Muster (z. B. "4-4-6, 3 Minuten"),
-- vergleichbar mit routines (Gewohnheiten) oder training_vorlagen.
-- Bug-Fix (13.09.): if-not-exists/drop-if-exists nachgerüstet — Nutzerin
-- meldete "relation atemuebungen already exists" beim Ausführen (vermutlich
-- Rest eines früheren abgebrochenen Versuchs). Ohne Guards bricht CREATE
-- TABLE die Transaktion sofort ab, wodurch atemuebung_logs/akutmodus_log
-- weiter unten dann gar nicht mehr angelegt werden — gleiches Muster wie in
-- 0071 bereits gelöst.
create table if not exists public.atemuebungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '🌬️',
  einatmen_sek integer not null default 4,
  halten_sek integer not null default 4,
  ausatmen_sek integer not null default 6,
  dauer_minuten integer not null default 3,
  created_at timestamptz not null default now()
);

alter table public.atemuebungen enable row level security;
drop policy if exists "atemuebungen: eigene Zeilen" on public.atemuebungen;
create policy "atemuebungen: eigene Zeilen" on public.atemuebungen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- atemuebung_logs: abgeschlossene Sitzungen (name als Textkopie statt nur
-- FK, damit der Verlauf auch nach Löschen/Umbenennen des Presets lesbar
-- bleibt — gleiche Logik wie bei anderen Protokoll-Logs dieser App).
-- gefuehl_danach: optionaler kurzer Check-in nach dem Beenden ("geht's
-- besser?"), auch vom Akutmodus genutzt (siehe AkutModusPanel.jsx).
create table if not exists public.atemuebung_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  atemuebung_id uuid references public.atemuebungen (id) on delete set null,
  name text not null,
  dauer_sek integer not null,
  aus_akutmodus boolean not null default false,
  gefuehl_danach text,
  erstellt_am timestamptz not null default now()
);

alter table public.atemuebung_logs enable row level security;
drop policy if exists "atemuebung_logs: eigene Zeilen" on public.atemuebung_logs;
create policy "atemuebung_logs: eigene Zeilen" on public.atemuebung_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- akutmodus_log: einfache Dokumentation für den Akutmodus (Nutzerinnen-
-- Vorgabe: "wie oft hatte er so einen Anfall, wie ist er damit
-- umgegangen, ist es besser geworden"). Bewusst schlank gehalten — volle
-- Verzweigung zu Supplementen/Medikamenten als Akutmodus-Option ist ein
-- separater, größerer Ausbauschritt (siehe Übergabeprotokoll), hier erst
-- mal Aktion + Vorher/Nachher-Einschätzung.
create table if not exists public.akutmodus_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  aktion text not null,
  detail text,
  gefuehl_danach text,
  erstellt_am timestamptz not null default now()
);

alter table public.akutmodus_log enable row level security;
drop policy if exists "akutmodus_log: eigene Zeilen" on public.akutmodus_log;
create policy "akutmodus_log: eigene Zeilen" on public.akutmodus_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
