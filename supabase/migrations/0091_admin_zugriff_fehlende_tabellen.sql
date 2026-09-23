-- Datenbank-Abgleich 23.09.2026: diese 17 Tabellen hatten nur eine
-- "eigene Zeilen"-Policy, aber - anders als hormones/supplements/meals/
-- sleep_entries/... - keine "admin voller Zugriff"-Policy. Folge im
-- "Verwalten als"-Modus: die Coachin konnte fuer Coachees z. B. Morgen-/
-- Abendroutine, Bildschirmzeit, Workflows, Atemuebungen, Tagesplan-
-- Ausnahmen oder Trainingsordner weder sehen noch speichern (RLS blockte
-- still). Von der Nutzerin am 23.09. ausdruecklich fuer alle 17 Tabellen
-- freigegeben (inkl. Akutmodus-Log, Denkpause, Frageboegen, Lexikon).
-- Gleiches Muster wie 0035/0055/0069. Idempotent.

drop policy if exists "akutmodus_log: admin voller Zugriff" on public.akutmodus_log;
create policy "akutmodus_log: admin voller Zugriff" on public.akutmodus_log for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "atemuebung_logs: admin voller Zugriff" on public.atemuebung_logs;
create policy "atemuebung_logs: admin voller Zugriff" on public.atemuebung_logs for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "atemuebungen: admin voller Zugriff" on public.atemuebungen;
create policy "atemuebungen: admin voller Zugriff" on public.atemuebungen for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "bildschirmzeit_logs: admin voller Zugriff" on public.bildschirmzeit_logs;
create policy "bildschirmzeit_logs: admin voller Zugriff" on public.bildschirmzeit_logs for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "bildschirmzeit_settings: admin voller Zugriff" on public.bildschirmzeit_settings;
create policy "bildschirmzeit_settings: admin voller Zugriff" on public.bildschirmzeit_settings for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "denkpause_ergebnisse: admin voller Zugriff" on public.denkpause_ergebnisse;
create policy "denkpause_ergebnisse: admin voller Zugriff" on public.denkpause_ergebnisse for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "errungenschaften: admin voller Zugriff" on public.errungenschaften;
create policy "errungenschaften: admin voller Zugriff" on public.errungenschaften for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "fragebogen_antworten: admin voller Zugriff" on public.fragebogen_antworten;
create policy "fragebogen_antworten: admin voller Zugriff" on public.fragebogen_antworten for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "lexikon_eintraege: admin voller Zugriff" on public.lexikon_eintraege;
create policy "lexikon_eintraege: admin voller Zugriff" on public.lexikon_eintraege for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "routine_durchlaeufe: admin voller Zugriff" on public.routine_durchlaeufe;
create policy "routine_durchlaeufe: admin voller Zugriff" on public.routine_durchlaeufe for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "routine_einstellungen: admin voller Zugriff" on public.routine_einstellungen;
create policy "routine_einstellungen: admin voller Zugriff" on public.routine_einstellungen for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "routine_schritt_logs: admin voller Zugriff" on public.routine_schritt_logs;
create policy "routine_schritt_logs: admin voller Zugriff" on public.routine_schritt_logs for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "routine_schritte: admin voller Zugriff" on public.routine_schritte;
create policy "routine_schritte: admin voller Zugriff" on public.routine_schritte for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "tagesplan_ausnahmen: admin voller Zugriff" on public.tagesplan_ausnahmen;
create policy "tagesplan_ausnahmen: admin voller Zugriff" on public.tagesplan_ausnahmen for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "training_programme: admin voller Zugriff" on public.training_programme;
create policy "training_programme: admin voller Zugriff" on public.training_programme for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "workflow_plaene: admin voller Zugriff" on public.workflow_plaene;
create policy "workflow_plaene: admin voller Zugriff" on public.workflow_plaene for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "workflow_presets: admin voller Zugriff" on public.workflow_presets;
create policy "workflow_presets: admin voller Zugriff" on public.workflow_presets for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
