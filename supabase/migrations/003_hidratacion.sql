-- ============================================================
-- NutriScan MVP - Hydration tracking schema
-- ============================================================

create table if not exists public.hidratacion (
  id          bigserial primary key,
  id_usuario  uuid not null references auth.users(id) on delete cascade,
  fecha       date not null,
  ml_total    integer not null default 0 check (ml_total >= 0),
  updated_at  timestamptz not null default now(),
  unique (id_usuario, fecha)
);

create index if not exists idx_hidratacion_usuario_fecha on public.hidratacion(id_usuario, fecha);

alter table public.hidratacion enable row level security;

create policy "hidratacion: own read"
  on public.hidratacion for select
  using (id_usuario = auth.uid());

create policy "hidratacion: own insert"
  on public.hidratacion for insert
  with check (id_usuario = auth.uid());

create policy "hidratacion: own update"
  on public.hidratacion for update
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());
