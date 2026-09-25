-- Erinnerungen kamen nicht mehr an (25.09. entdeckt): der Cron-Job ruft
-- send-due-reminders jede Minute auf, aber jeder Aufruf endete mit 401 —
-- erst fehlte der Authorization-Header (Gateway, verify_jwt), danach
-- passte das CRON_SECRET der Function nicht zum Header des Cron-Jobs.
-- Lösung: der Cron-Job schickt zusätzlich den öffentlichen anon-Schlüssel
-- als Authorization (per cron.alter_job direkt eingespielt, nicht hier im
-- Repo, weil der Job-Befehl das Geheimnis enthält), und die Function
-- vergleicht das Geheimnis auch mit dieser Tabelle. Nur per Service-Role
-- lesbar (RLS an, keine Policies, keine Rechte für anon/authenticated).
create table if not exists public.cron_konfig (name text primary key, wert text not null);
alter table public.cron_konfig enable row level security;
revoke all on public.cron_konfig from anon, authenticated;
insert into public.cron_konfig (name, wert)
select 'send-due-reminders', substring(command from '''x-cron-secret'',\s*''([^'']+)''')
from cron.job where command like '%send-due-reminders%'
on conflict (name) do update set wert = excluded.wert;
