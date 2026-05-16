-- ============================================================
-- NutriScan MVP - Hydration log by liquid type
-- ============================================================

create table if not exists public.hidratacion_registros (
  id          bigserial primary key,
  id_usuario  uuid not null references auth.users(id) on delete cascade,
  fecha       date not null,
  tipo        text not null default 'agua'
              check (tipo in ('agua', 'jugo', 'infusion', 'leche', 'otro')),
  ml          integer not null check (ml > 0),
  created_at  timestamptz not null default now()
);

create index if not exists idx_hidratacion_reg_usuario_fecha
  on public.hidratacion_registros(id_usuario, fecha);

alter table public.hidratacion_registros enable row level security;

create policy "hidratacion_registros: own read"
  on public.hidratacion_registros for select
  using (id_usuario = auth.uid());

create policy "hidratacion_registros: own insert"
  on public.hidratacion_registros for insert
  with check (id_usuario = auth.uid());

create policy "hidratacion_registros: own delete"
  on public.hidratacion_registros for delete
  using (id_usuario = auth.uid());

create policy "hidratacion_registros: investigador read all"
  on public.hidratacion_registros for select
  using (public.get_my_role() in ('investigador', 'administrador'));
