-- ============================================================
-- NutriScan MVP - Investigator read-all policies for nutrition data
-- ============================================================

create policy "ingestas: investigador read all"
  on public.ingestas for select
  using (public.get_my_role() in ('investigador', 'administrador'));

create policy "hidratacion: investigador read all"
  on public.hidratacion for select
  using (public.get_my_role() in ('investigador', 'administrador'));
