-- Frage im Moment (25.09.): nach einem Intervall-Training "Alle 5 Runden
-- geschafft?" — tatsächlich geschaffte Runden, getrennt vom Plan (runden).
alter table public.training_sessions add column if not exists runden_ist int;
