-- Peptid Protokoll App — initiales Datenbankschema
-- Bildet alle Datenstrukturen aus dem React-Prototyp ab.
-- Jede Tabelle ist per Row Level Security auf den jeweiligen auth.uid() beschränkt.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: personalData + globale Einstellungen (aktive Messwerte, Datenteilung)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  geschlecht text,
  geburtsdatum date,
  groesse numeric,
  gewicht_start numeric,
  datenteilung boolean not null default false,
  aktive_messwerte text[] not null default array['gewicht', 'kfa', 'taille', 'blutdruck', 'ruhepuls', 'energie'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: eigene Zeile lesen" on public.profiles for select using (auth.uid() = id);
create policy "profiles: eigene Zeile anlegen" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: eigene Zeile aktualisieren" on public.profiles for update using (auth.uid() = id);

-- Legt beim Signup automatisch eine leere Profilzeile an.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- custom_messwerte: vom Nutzer selbst angelegte Check-in-Variablen
-- ---------------------------------------------------------------------------
create table public.custom_messwerte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  label text not null,
  unit text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.custom_messwerte enable row level security;
create policy "custom_messwerte: eigene Zeilen" on public.custom_messwerte for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- protocols: Peptid-Protokolle (aktiv & archiviert = abgeschlosseneProtokolle)
-- ---------------------------------------------------------------------------
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  ziele text[] not null default '{}',
  startdatum date not null default current_date,
  dauer_wochen integer not null default 12,
  notizen text not null default '',
  injektionen_snapshot integer,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.protocols enable row level security;
create policy "protocols: eigene Zeilen" on public.protocols for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index protocols_user_status_idx on public.protocols (user_id, status);

-- ---------------------------------------------------------------------------
-- protocol_peptide: Peptide/Präparate innerhalb eines Protokolls (dosierung)
-- ---------------------------------------------------------------------------
create table public.protocol_peptide (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  einnahmeart text not null default 'Injektion',
  menge text not null default '',
  intervall_mode text not null default 'fixed' check (intervall_mode in ('fixed', 'custom')),
  intervall_days integer,
  custom_days integer,
  eigener_start date,
  uhrzeit time not null default '20:00',
  created_at timestamptz not null default now(),
  unique (protocol_id, name)
);

alter table public.protocol_peptide enable row level security;
create policy "protocol_peptide: eigene Zeilen" on public.protocol_peptide for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index protocol_peptide_protocol_idx on public.protocol_peptide (protocol_id);

-- ---------------------------------------------------------------------------
-- peptide_logs: Injektions-Tracking + Nebenwirkungs-Feedback (erledigt/feedback)
-- ---------------------------------------------------------------------------
create table public.peptide_logs (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  peptid_name text not null,
  dose_date date not null,
  erledigt boolean not null default true,
  nebenwirkungen text[] not null default '{}',
  staerke text,
  notizen text not null default '',
  foto_path text,
  created_at timestamptz not null default now(),
  unique (protocol_id, peptid_name, dose_date)
);

alter table public.peptide_logs enable row level security;
create policy "peptide_logs: eigene Zeilen" on public.peptide_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index peptide_logs_protocol_idx on public.peptide_logs (protocol_id);

-- ---------------------------------------------------------------------------
-- hormone / hormone_logs: eigenständiges Hormon-Protokoll (analog zu Peptiden)
-- ---------------------------------------------------------------------------
create table public.hormones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  menge text not null default '',
  intervall_mode text not null default 'fixed' check (intervall_mode in ('fixed', 'custom')),
  intervall_days integer not null default 7,
  custom_days integer,
  eigener_start date,
  uhrzeit time not null default '20:00',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.hormones enable row level security;
create policy "hormones: eigene Zeilen" on public.hormones for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.hormone_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hormone_name text not null,
  dose_date date not null,
  erledigt boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, hormone_name, dose_date)
);

alter table public.hormone_logs enable row level security;
create policy "hormone_logs: eigene Zeilen" on public.hormone_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- supplements / supplement_logs: Supplemente-Plan (supplementErledigt)
-- ---------------------------------------------------------------------------
create table public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  tageszeiten text[] not null default '{}',
  hinweis text not null default '',
  created_at timestamptz not null default now()
);

alter table public.supplements enable row level security;
create policy "supplements: eigene Zeilen" on public.supplements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  log_date date not null,
  tageszeit text not null,
  erledigt boolean not null default true,
  created_at timestamptz not null default now(),
  unique (supplement_id, log_date, tageszeit)
);

alter table public.supplement_logs enable row level security;
create policy "supplement_logs: eigene Zeilen" on public.supplement_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- checkins: wöchentliche Check-ins (gewichtsEintraege) inkl. konfigurierbarer
-- Messwerte (values jsonb) und Fotos (fotos jsonb: [{kategorie, path}])
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  values jsonb not null default '{}'::jsonb,
  fotos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, datum)
);

alter table public.checkins enable row level security;
create policy "checkins: eigene Zeilen" on public.checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sleep_entries: Schlaf-Einträge (schlafEintraege)
-- ---------------------------------------------------------------------------
create table public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  stunden numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, datum)
);

alter table public.sleep_entries enable row level security;
create policy "sleep_entries: eigene Zeilen" on public.sleep_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- biomarkers: aktuelle Biomarker/Blutwerte (biomarker key -> value)
-- ---------------------------------------------------------------------------
create table public.biomarkers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.biomarkers enable row level security;
create policy "biomarkers: eigene Zeilen" on public.biomarkers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- blutwerte_archiv: Snapshots gescannter Laborberichte (blutwerteArchiv)
-- ---------------------------------------------------------------------------
create table public.blutwerte_archiv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null default current_date,
  werte jsonb not null default '{}'::jsonb,
  foto_path text,
  created_at timestamptz not null default now()
);

alter table public.blutwerte_archiv enable row level security;
create policy "blutwerte_archiv: eigene Zeilen" on public.blutwerte_archiv for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at automatisch pflegen (profiles)
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
