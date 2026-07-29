-- Admin-Dashboard: eine Person (die "Owner"/Admin) kann stellvertretend auf
-- Profile, Pläne und Protokolle beliebiger Probandinnen zugreifen und deren
-- App-Ansicht 1:1 bedienen ("Verwalten als"-Modus im Frontend, siehe
-- AdminContext.jsx). Grundlage hier:
--   1. profiles.is_admin — wer darf das überhaupt.
--   2. is_admin(uid) — Hilfsfunktion, wiederverwendbar in jeder Policy.
--   3. admin_liste_probanden() — liefert die Probandenliste inkl. E-Mail
--      (liegt in auth.users, das der Browser-Client nicht direkt lesen kann).
--   4. Pro Tabelle EINE zusätzliche, rein additive Policy ("admin voller
--      Zugriff"). Die bestehenden "eigene Zeilen"-Policies bleiben
--      unverändert — mehrere permissive Policies für denselben Befehl
--      verknüpfen sich in Postgres automatisch per OR, das hier ist also
--      reines Hinzufügen, kein Ersetzen/Risiko für bestehende Nutzer:innen.

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists vorname text;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create or replace function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email, p.vorname, u.created_at, p.onboarding_complete, p.is_admin
  from auth.users u
  join public.profiles p on p.id = u.id
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;

create policy "profiles: admin voller Zugriff" on public.profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "custom_messwerte: admin voller Zugriff" on public.custom_messwerte for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "protocols: admin voller Zugriff" on public.protocols for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "protocol_peptide: admin voller Zugriff" on public.protocol_peptide for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "peptide_logs: admin voller Zugriff" on public.peptide_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "hormones: admin voller Zugriff" on public.hormones for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "hormone_logs: admin voller Zugriff" on public.hormone_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "supplements: admin voller Zugriff" on public.supplements for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "supplement_logs: admin voller Zugriff" on public.supplement_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "checkins: admin voller Zugriff" on public.checkins for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "sleep_entries: admin voller Zugriff" on public.sleep_entries for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "biomarkers: admin voller Zugriff" on public.biomarkers for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "blutwerte_archiv: admin voller Zugriff" on public.blutwerte_archiv for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "drink_recipes: admin voller Zugriff" on public.drink_recipes for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "drink_recipe_ingredients: admin voller Zugriff" on public.drink_recipe_ingredients for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "drink_logs: admin voller Zugriff" on public.drink_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "meals: admin voller Zugriff" on public.meals for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "meal_ingredients: admin voller Zugriff" on public.meal_ingredients for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "meal_logs: admin voller Zugriff" on public.meal_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "meal_wochenplan: admin voller Zugriff" on public.meal_wochenplan for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routines: admin voller Zugriff" on public.routines for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routine_peptide_items: admin voller Zugriff" on public.routine_peptide_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routine_hormon_items: admin voller Zugriff" on public.routine_hormon_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routine_supplement_items: admin voller Zugriff" on public.routine_supplement_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routine_meal_items: admin voller Zugriff" on public.routine_meal_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "routine_logs: admin voller Zugriff" on public.routine_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "hydration_logs: admin voller Zugriff" on public.hydration_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "hydration_settings: admin voller Zugriff" on public.hydration_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "training_sessions: admin voller Zugriff" on public.training_sessions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "training_templates: admin voller Zugriff" on public.training_templates for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "training_wochenplan: admin voller Zugriff" on public.training_wochenplan for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "tageslicht_logs: admin voller Zugriff" on public.tageslicht_logs for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "tageslicht_settings: admin voller Zugriff" on public.tageslicht_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "coach_nachrichten: admin voller Zugriff" on public.coach_nachrichten for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "push_subscriptions: admin voller Zugriff" on public.push_subscriptions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "aenderungsprotokoll: admin voller Zugriff" on public.aenderungsprotokoll for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "wochenprotokoll_snapshots: admin voller Zugriff" on public.wochenprotokoll_snapshots for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "hauptprotokolle: admin voller Zugriff" on public.hauptprotokolle for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "teilprotokolle: admin voller Zugriff" on public.teilprotokolle for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
