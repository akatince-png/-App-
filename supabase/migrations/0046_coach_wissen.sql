-- Wissens-Basis-Verwaltung für die Admin/Coach (13.08., Coach-verwaltetes
-- Modell, "Aka lernt mit"): bisher kam Akas Hintergrundwissen nur aus
-- statischen .md-Dateien unter src/wissen/ (Deploy für jede Änderung
-- nötig). Jetzt zusätzlich eine Tabelle, in die die Admin jederzeit
-- direkt aus der App (auch vom Handy) neues Wissen einträgt — kurze
-- Notizen genauso wie große eingefügte Recherche-Zusammenfassungen.
--
-- Lesen dürfen alle eingeloggten Personen (der Inhalt fließt über
-- KiChat.jsx in den Gesprächskontext ein, genau wie die statische
-- Wissens-Basis) — Schreiben bleibt der Admin vorbehalten.
create table public.coach_wissen (
  id uuid primary key default gen_random_uuid(),
  bereich text,
  titel text not null,
  text text not null,
  erstellt_am timestamptz not null default now()
);

alter table public.coach_wissen enable row level security;

create policy "coach_wissen: alle eingeloggten lesen" on public.coach_wissen
  for select using (auth.uid() is not null);

create policy "coach_wissen: admin voller Zugriff" on public.coach_wissen
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
