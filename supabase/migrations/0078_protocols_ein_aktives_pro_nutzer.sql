-- Verhindert doppelte aktive Peptid-Protokolle bei schnellem Tab-/
-- Gerätewechsel oder zwei fast gleichzeitigen Ladevorgängen (Bug-Check,
-- Teil 27/40, 11.09.): useProtocolData.js prüft beim Laden "gibt es
-- schon ein aktives Protokoll?" und legt ohne Sperre eins an, wenn
-- nicht — ohne DB-seitige Absicherung konnten zwei parallele Aufrufe
-- (React-StrictMode-Doppel-Mount, zwei offene Browser-Tabs) beide "kein
-- aktives Protokoll" sehen und je eins anlegen. Neue Peptid-Einträge
-- landeten danach nur noch in einem der beiden, das andere (mit
-- eventuell bereits gespeicherten Daten) wurde von der
-- "order(created_at desc).limit(1)"-Abfrage nicht mehr geladen und
-- wirkte für die Nutzerin "verschwunden".
--
-- Ein partieller Unique-Index (nur für status='active') statt einer
-- generellen Unique-Constraint auf user_id, da pro Nutzer beliebig viele
-- ARCHIVIERTE Protokolle bestehen bleiben (siehe protokollArchivieren
-- in useProtocolData.js) — nur "aktiv" muss einzigartig sein.
--
-- Bewusst NICHT destruktiv: löscht/ändert keine bestehenden Zeilen. Falls
-- bei Ihnen bereits zwei aktive Protokolle für denselben Nutzer
-- existieren (durch genau diesen Bug), schlägt das Erstellen dieses
-- Index fehl — in dem Fall bitte vorher in den Zwei-Duplikaten von Hand
-- eins auf status='archived' setzen (das ältere, per created_at), dann
-- diese Migration erneut ausführen.
create unique index if not exists protocols_ein_aktives_pro_nutzer
  on public.protocols (user_id)
  where status = 'active';
