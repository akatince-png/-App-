-- Zeitgesteuerter Erinnerungs-Versand: pg_cron plant einen Job, der einmal
-- pro Minute per pg_net die Edge Function "send-due-reminders" aufruft
-- (siehe supabase/functions/send-due-reminders). Diese Migration NICHT
-- unverändert ausführen — vorher die beiden Platzhalter unten ersetzen:
--
--   1. DEIN-PROJEKT-REF  → deine Supabase-Projekt-Referenz
--      (Project Settings → General → Reference ID)
--   2. DEIN-CRON-SECRET  → ein selbst gewählter, langer Zufallswert.
--      Denselben Wert danach als Secret "CRON_SECRET" bei der Edge Function
--      "send-due-reminders" hinterlegen (Dashboard → Edge Functions →
--      send-due-reminders → Secrets) — sonst lehnt die Funktion jeden Aufruf
--      mit 401 ab.
--
-- Setzt außerdem voraus, dass die Edge Function "send-due-reminders" bereits
-- deployt ist (per Supabase-CLI oder manuell im Dashboard angelegt).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-due-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://DEIN-PROJEKT-REF.supabase.co/functions/v1/send-due-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'DEIN-CRON-SECRET'),
    body := '{}'::jsonb
  );
  $$
);

-- Zum späteren Deaktivieren/Ändern:
--   select cron.unschedule('send-due-reminders-every-minute');
