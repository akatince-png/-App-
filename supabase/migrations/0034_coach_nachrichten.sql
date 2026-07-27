-- Persistenter KI-Coach-Gesprächsverlauf: bisher lebte jedes Gespräch nur
-- im Browser-State und war nach dem Schließen des Chats verloren. Jetzt
-- pro Lebensbereich (z. B. "training", "ernaehrung") fortlaufend
-- gespeichert — sichtbar beim erneuten Öffnen UND automatisch als
-- Gedächtnis für persönlichere Antworten genutzt (voller Verlauf wird als
-- Konversationskontext an die KI mitgeschickt, siehe src/ui/KiChat.jsx).
create table public.coach_nachrichten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bereich text not null,
  rolle text not null check (rolle in ('nutzer', 'coach')),
  text text not null,
  erstellt_am timestamptz not null default now()
);

create index coach_nachrichten_user_bereich_idx on public.coach_nachrichten (user_id, bereich, erstellt_am);

alter table public.coach_nachrichten enable row level security;
create policy "coach_nachrichten: eigene Zeilen" on public.coach_nachrichten for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
