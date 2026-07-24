-- Erinnerungen je Pläne-Kategorie: analog zu category_ziele (0018) ein
-- kompaktes jsonb-Feld auf profiles statt einer eigenen Tabelle, da es sich
-- um eine reine Ja/Nein-Präferenz pro Kategorie handelt (kategorie -> bool).
-- Steuert nur, ob eine Kategorie beim serverseitigen Erinnerungs-Versand
-- berücksichtigt wird — die eigentliche Geräte-Berechtigung bleibt weiterhin
-- push_subscriptions (0017).
alter table public.profiles
  add column if not exists erinnerungen jsonb not null default '{}'::jsonb;
