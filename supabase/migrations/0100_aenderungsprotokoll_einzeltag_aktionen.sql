-- Gleicher Bug-Typ wie 0091 (aktion-Check, 17.09.): TagesEintragBearbeiten.jsx
-- protokolliert Einzeltag-Änderungen als "geändert (nur dieser Tag)" bzw.
-- "entfällt (nur dieser Tag)" — die Constraint kannte beide nicht, der
-- Insert scheiterte lautlos (nur console.error). Gefunden beim Zusammen-
-- führen des Arbeitsstands vom 17.09. (24.09.).
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_aktion_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_aktion_check
  check (aktion in ('hinzugefügt', 'geändert', 'entfernt', 'erledigt', 'ausgefallen', 'Version festgehalten',
    'Ausnahme zurückgenommen', 'geändert (nur dieser Tag)', 'entfällt (nur dieser Tag)'));
