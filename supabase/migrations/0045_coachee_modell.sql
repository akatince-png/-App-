-- Umstellung auf Coach-verwaltetes Modell (Nutzerinnen-Vorgabe, 13.08.):
-- statt dass jede Person die App komplett selbst einrichtet, richtet die
-- Admin/Coach die meisten Bereiche stellvertretend ein ("Verwalten als").
-- Der Coachee durchläuft im eigenen Onboarding nur noch Profil + Ziel +
-- einen kurzen Steckbrief, damit die Admin sich fürs Erstgespräch
-- vorbereiten kann.
--
-- steckbrief: die 3 kurzen Hintergrundfragen aus dem reduzierten
-- Coachee-Onboarding (Supplemente ja/nein+welche, Sport-Erfahrung,
-- Sport-Menge+Beschreibung) — bewusst als jsonb statt Einzelspalten, damit
-- sich die Fragen später ändern lassen, ohne Migration (gleiches Muster
-- wie profiles.category_ziele/erinnerungen).
alter table public.profiles add column if not exists steckbrief jsonb not null default '{}'::jsonb;

-- coachee_nachrichten: Kommunikationsrichtung Coachee -> Coach. Ersetzt für
-- Coachees den KI-Assistenten (der für sie ausgeblendet wird, siehe
-- KiChat.jsx) als Kontaktweg. Bewusst eine eigene, einfache Tabelle statt
-- Erweiterung von admin_notizen (0036) — die läuft andersherum (Admin an
-- Coachee, zugestellt über den Assistenten) und hat ein anderes
-- Zustellungsmodell.
create table public.coachee_nachrichten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  gelesen boolean not null default false,
  erstellt_am timestamptz not null default now()
);

create index coachee_nachrichten_user_idx on public.coachee_nachrichten (user_id, erstellt_am);

alter table public.coachee_nachrichten enable row level security;

-- Der Coachee darf eigene Nachrichten anlegen und lesen, aber nicht als
-- gelesen markieren (das macht die Admin) oder löschen.
create policy "coachee_nachrichten: eigene Zeilen anlegen" on public.coachee_nachrichten
  for insert with check (auth.uid() = user_id);

create policy "coachee_nachrichten: eigene Zeilen lesen" on public.coachee_nachrichten
  for select using (auth.uid() = user_id);

create policy "coachee_nachrichten: admin voller Zugriff" on public.coachee_nachrichten
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
