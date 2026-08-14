-- Projekte & Zeitblöcke (14.08., Nutzerin-Vorgabe): "Ziele, Projekte,
-- farbige Zeitblöcke" sollten laut ihrer Klarstellung KEINE neuen
-- eigenständigen Plan-Seiten werden, sondern sich einfach in den bereits
-- vorhandenen Tagesplan/Wochenplan sowie die Wochen-/Monatsübersicht
-- (WochenuebersichtView.jsx) einklinken — genau wie Training/Schlaf/
-- Hydration/... das über buildDayItems()/KATEGORIE_META schon tun.
--
-- projekte: frei benennbare Container ("Projektarbeit", "Arbeit",
-- "Coaching-Ausbildung", ...) — jedes bekommt beim Anlegen automatisch die
-- nächste Farbe aus einer festen Palette (kein manueller Farbwähler
-- nötig, Nutzerinnen-Vorgabe: "sollen dann verschiedene Farben kriegen,
-- wenn ich neue Projekte hinzufüge"). farbe_index statt einer festen
-- Hex-Farbe direkt in der Zeile, damit die Palette selbst (Reihenfolge/
-- Töne) später im Frontend angepasst werden kann, ohne Bestandsdaten zu
-- migrieren.
create table public.projekte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  farbe_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projekte enable row level security;
create policy "projekte: eigene Zeilen" on public.projekte for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projekte: admin voller Zugriff" on public.projekte for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- zeitbloecke: ein konkret geblockter Zeitraum an einem Datum (z. B.
-- "Arbeit, 09:00-12:00" oder "Projektarbeit App, 14:00-16:30"), immer
-- einem Projekt zugeordnet (auch die einfache "Ich blocke Arbeit"-Nutzung
-- ist technisch nur ein Projekt namens "Arbeit"). end_uhrzeit optional,
-- damit sich auch ein reiner Zeitpunkt ohne Dauer eintragen lässt
-- ("in einzelnen Punkten", Nutzerinnen-Vorgabe).
create table public.zeitbloecke (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  projekt_id uuid not null references public.projekte (id) on delete cascade,
  titel text,
  datum date not null,
  start_uhrzeit time not null,
  end_uhrzeit time,
  notiz text,
  created_at timestamptz not null default now()
);

alter table public.zeitbloecke enable row level security;
create policy "zeitbloecke: eigene Zeilen" on public.zeitbloecke for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "zeitbloecke: admin voller Zugriff" on public.zeitbloecke for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index zeitbloecke_user_datum_idx on public.zeitbloecke (user_id, datum);
