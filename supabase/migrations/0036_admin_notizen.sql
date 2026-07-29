-- Admin hinterlässt Hinweise/Nachrichten für eine Probandin/einen
-- Probanden, die über den KI-Assistenten zugestellt werden statt als
-- separates "Nachricht vom Admin"-Postfach — Nutzerin-Vorgabe: der
-- Assistent soll wie ihr Mitarbeiter am Kunden wirken, nicht wie ein
-- getrenntes Verwaltungs-Werkzeug.
--
-- Zwei Modi:
--   'kontext'   — Hintergrundwissen für den Assistenten (z. B. "beim
--                 nächsten Mal Übung X genauer erklären"), wird bei JEDER
--                 Chat-Anfrage im passenden Bereich mitgeschickt, bis der
--                 Admin sie wieder löscht. Wird der Person nie direkt und
--                 wörtlich gezeigt (siehe KiChat.jsx, hintergrundKontext).
--   'nachricht' — wird als eigene Nachricht "vom Assistenten" zugestellt,
--                 sobald die Person den Chat im passenden Bereich (oder
--                 bereichsübergreifend, falls bereich = null) das nächste
--                 Mal öffnet — siehe useCoachVerlauf.js (coachVerlaufLaden
--                 liefert offene Nachrichten aus und markiert sie danach
--                 als zugestellt).
create table public.admin_notizen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  admin_id uuid not null references auth.users (id) on delete cascade,
  bereich text,
  modus text not null default 'nachricht' check (modus in ('kontext', 'nachricht')),
  text text not null,
  status text not null default 'offen' check (status in ('offen', 'zugestellt')),
  erstellt_am timestamptz not null default now(),
  zugestellt_am timestamptz
);

create index admin_notizen_user_status_idx on public.admin_notizen (user_id, status);

alter table public.admin_notizen enable row level security;

-- Die Probandin/der Proband darf die eigenen Notizen lesen (nötig, damit
-- Kontext-Hinweise/Zustellung auch im EIGENEN Konto funktionieren, nicht
-- nur während der Admin gerade "verwaltet") und als zugestellt markieren —
-- aber nicht selbst welche anlegen oder löschen, das bleibt dem Admin
-- vorbehalten (unten, "admin voller Zugriff").
create policy "admin_notizen: eigene Zeilen lesen" on public.admin_notizen
  for select using (auth.uid() = user_id);

create policy "admin_notizen: eigene Zeilen als zugestellt markieren" on public.admin_notizen
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admin_notizen: admin voller Zugriff" on public.admin_notizen
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
