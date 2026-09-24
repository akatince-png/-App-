-- Sicherheits-Hinweise des Supabase-Linters (Bugsuche 24.09.): Trigger-
-- Funktionen müssen nicht per API aufrufbar sein (das Recht wird nur beim
-- Anlegen des Triggers geprüft, nicht beim Auslösen), und set_updated_at
-- bekommt einen festen search_path.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.profiles_is_admin_schutz() from anon, authenticated, public;
alter function public.set_updated_at() set search_path = public;
