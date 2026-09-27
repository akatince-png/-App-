-- Push in der iPhone-App (27.09.): native Geräte melden sich bei Apple (APNs)
-- an. Ihr Geräte-Schlüssel steht als endpoint "apns:<token>" in derselben
-- Tabelle wie die Web-Push-Abos; die Web-Schlüssel entfallen dort.
alter table public.push_subscriptions
  add column if not exists plattform text not null default 'web';
alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth_key drop not null;

-- Ein Web-Abo braucht weiterhin beide Schlüssel.
alter table public.push_subscriptions drop constraint if exists push_subscriptions_web_schluessel;
alter table public.push_subscriptions add constraint push_subscriptions_web_schluessel
  check (endpoint like 'apns:%' or (p256dh is not null and auth_key is not null));

-- upsert(onConflict: endpoint) braucht bei einem schon bekannten Gerät auch
-- ein Update-Recht (z. B. neu anmelden nach Ab- und wieder Anmelden).
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
