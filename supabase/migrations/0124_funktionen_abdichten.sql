-- Sicherheit (30.09., Nutzerin: „Alles, was mit Sicherheit zu tun hat, hat
-- immer Priorität“): Supabase-Sicherheitsprüfung meldete zwei Funktionen,
-- die ohne Anmeldung aufrufbar waren.
-- 1) is_admin: nur noch für angemeldete Konten (RLS-Regeln rufen sie immer
--    mit auth.uid() auf; die App fragt vor dem Anmelden nichts ab).
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
-- 2) Trigger-Funktionen laufen nur über ihren Trigger – niemand muss sie
--    direkt aufrufen können (beim Auslösen prüft Postgres das Recht nicht).
revoke execute on function public.programme_fuer_neue_zuweisen() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.profiles_is_admin_schutz() from public, anon, authenticated;
