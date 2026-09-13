-- Sicherheitsfix (13.09., Code-Audit): "profiles: eigene Zeile
-- aktualisieren" (siehe 0001_init.sql) erlaubt jeder eingeloggten Person,
-- IRGENDEINE Spalte ihrer eigenen profiles-Zeile zu ändern — inklusive
-- is_admin (siehe 0035_admin_dashboard.sql). Die Policy hat kein "with
-- check", das is_admin ausschließt, RLS prüft bei einem UPDATE ohne
-- eigenes "with check" nur die "using"-Bedingung (auth.uid() = id), nicht,
-- WELCHE Spalten sich ändern.
--
-- Das bedeutet: jede Person konnte bisher per direktem Supabase-Client-
-- Aufruf (z. B. supabase.from('profiles').update({is_admin:true}).eq('id',
-- eigeneId)) sich selbst zur Admin machen — und hätte damit vollen
-- "admin voller Zugriff" auf JEDE andere Tabelle/jeden anderen Account in
-- der App bekommen (siehe die vielen "admin voller Zugriff"-Policies in
-- 0035), außerdem is_admin() in den Edge Functions admin-create-proband/
-- admin-invite-proband bestanden (die lesen denselben Spaltenwert).
--
-- Fix: ein BEFORE-UPDATE-Trigger setzt is_admin unbemerkt auf den alten
-- Wert zurück, außer die aufrufende Person ist selbst schon Admin. Rein
-- additiv, betrifft ausschließlich Versuche, is_admin zu ändern — alle
-- anderen Profil-Updates (vorname, geburtsdatum, category_ziele, ...)
-- laufen unverändert weiter.
create or replace function public.profiles_is_admin_schutz()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if not coalesce((select is_admin from public.profiles where id = auth.uid()), false) then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_is_admin_schutz_trigger on public.profiles;
create trigger profiles_is_admin_schutz_trigger
  before update on public.profiles
  for each row execute procedure public.profiles_is_admin_schutz();
