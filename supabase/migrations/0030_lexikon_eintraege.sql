-- Persistiert Lexikon-Fragen & -Antworten (bisher nur im Browser-Speicher,
-- ging beim Neuladen verloren). Wird jetzt als durchsuchbare, nach Kategorie
-- sortierte Wissensdatenbank gebraucht (siehe LexikonView.jsx) — Coach nutzt
-- die App vorerst selbst als Nachschlagewerk, KI-gestützte Auswertung ist
-- ein späterer Schritt.
create table if not exists public.lexikon_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kategorie text not null,
  frage text not null,
  antwort text,
  erstellt_am timestamptz not null default now()
);

alter table public.lexikon_eintraege enable row level security;

drop policy if exists "lexikon_eintraege: eigene Zeilen" on public.lexikon_eintraege;
create policy "lexikon_eintraege: eigene Zeilen" on public.lexikon_eintraege for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists lexikon_eintraege_user_kategorie_idx on public.lexikon_eintraege (user_id, kategorie);
