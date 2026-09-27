-- Realistische Uhrzeiten für die Testkonten (27.09., Nutzerinnen-Wunsch:
-- "einmal pro Tag testen, aber realistischere Umsetzung"). Der Tageslauf
-- klickt abends alles durch – danach setzt dieses Skript Start/Ende der
-- Morgen- und Abendroutine auf glaubwürdige Zeiten (je Person ein eigener
-- Stil) und die Schrittdauern auf ca. die geplante Dauer statt 1–2 Sek.
-- Nur die sechs Testkonten, nur routine_durchlaeufe. :TAGE = wie viele Tage
-- zurück (täglich 0 = nur heute). Aufruf per Supabase-SQL, TAGE ersetzen.
with konten as (
  select u.id, u.email from auth.users u
  where u.email in ('claude.dauertest@example.com','claude.dauertest2@example.com','claude.dauertest3@example.com',
                    'claude.dauertest4@example.com','test-yjmgc7d9@aka-test.local','claude.admintest@example.com')
),
basis as (
  select d.id, d.routine, d.datum, d.schritte, k.email,
    abs(hashtext(d.user_id::text || d.datum::text || d.routine)) as h,
    coalesce(
      (select case when d.routine = 'morgen' then coalesce(case when sp.art = 'eigen' then sp.morgen_start end, v.morgen_start)
                   else coalesce(case when sp.art = 'eigen' then sp.abend_start end, v.abend_start) end
         from routine_schichtplan sp left join routine_varianten v on v.id = sp.variante_id
        where sp.user_id = d.user_id and sp.datum = d.datum and sp.art <> 'krank' limit 1),
      (select e.start_zeit from routine_einstellungen e where e.user_id = d.user_id and e.routine = d.routine),
      case when d.routine = 'morgen' then time '07:00' else time '21:30' end
    ) as soll
  from routine_durchlaeufe d join konten k on k.id = d.user_id
  where d.datum >= current_date - TAGE and d.abgeschlossen_um is not null
),
versatz as (
  select b.*,
    case
      when b.routine = 'abend' then 2 + b.h % 12
      when b.email = 'claude.dauertest2@example.com' then 38 + b.h % 25              -- Mia: morgens oft später
      when b.email = 'claude.dauertest4@example.com' then case when b.h % 5 < 3 then 35 + b.h % 25 else 4 + b.h % 10 end -- Lea: 3 von 5 Tagen später
      when b.email = 'claude.dauertest3@example.com' then b.h % 10                    -- Jonas: pünktlich zur Schicht
      else 3 + b.h % 13                                                                -- Claude, Test 1, Admin
    end as min_spaeter
  from basis b
),
neu as (
  select v.id,
    ((v.datum + v.soll) at time zone 'Europe/Berlin') + make_interval(mins => v.min_spaeter, secs => v.h % 50) as start,
    (select coalesce(jsonb_agg(
        case when jsonb_typeof(s.el) = 'object' and (s.el ? 'geplantMin')
             then jsonb_set(s.el, '{tatsaechlichSek}', to_jsonb(greatest(20, round((s.el->>'geplantMin')::numeric * 60 * (0.75 + ((v.h + s.i * 17) % 60) / 100.0))::int)))
             else s.el end order by s.i), '[]'::jsonb)
       from jsonb_array_elements(coalesce(v.schritte, '[]'::jsonb)) with ordinality as s(el, i)) as schritte
  from versatz v
)
update routine_durchlaeufe d
   set gestartet_um = n.start,
       abgeschlossen_um = n.start + make_interval(secs => (select coalesce(sum((e->>'tatsaechlichSek')::int), 120) from jsonb_array_elements(n.schritte) e where e ? 'tatsaechlichSek')),
       schritte = n.schritte
  from neu n
 where d.id = n.id
returning d.routine, d.datum, (d.gestartet_um at time zone 'Europe/Berlin')::time as start_lokal;
