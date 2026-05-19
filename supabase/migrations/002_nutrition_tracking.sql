-- ============================================================
-- NutriScan MVP - Food tracking schema
-- ============================================================

create table if not exists public.alimentos (
  id_alimento      integer primary key,
  nombre           text not null,
  categoria        text,
  kcal_100g        numeric(10,2),
  proteinas_100g   numeric(10,2),
  grasas_100g      numeric(10,2),
  carbs_100g       numeric(10,2),
  created_at       timestamptz not null default now()
);

create table if not exists public.ingestas (
  id_ingesta           bigserial primary key,
  id_usuario           uuid not null references auth.users(id) on delete cascade,
  tipo                 text not null check (tipo in ('desayuno', 'almuerzo', 'merienda', 'cena', 'colacion', 'suplemento')),
  fecha                date not null,
  kcal_total           numeric(10,2) not null default 0,
  proteinas_total_g    numeric(10,2) not null default 0,
  grasas_total_g       numeric(10,2) not null default 0,
  carbs_total_g        numeric(10,2) not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (id_usuario, fecha, tipo)
);

create table if not exists public.items (
  id_item          bigserial primary key,
  id_ingesta       bigint not null references public.ingestas(id_ingesta) on delete cascade,
  id_alimento      integer not null references public.alimentos(id_alimento),
  tipo_item        text not null check (tipo_item in ('solido', 'liquido', 'en polvo')),
  cantidad         numeric(10,2) not null check (cantidad > 0),
  kcal             numeric(10,2) not null default 0,
  proteinas_g      numeric(10,2) not null default 0,
  grasas_g         numeric(10,2) not null default 0,
  carbs_g          numeric(10,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_alimentos_nombre on public.alimentos(nombre);
create index if not exists idx_ingestas_usuario_fecha on public.ingestas(id_usuario, fecha);
create index if not exists idx_items_ingesta on public.items(id_ingesta);
create index if not exists idx_items_alimento on public.items(id_alimento);

create trigger ingestas_updated_at
  before update on public.ingestas
  for each row execute function public.handle_updated_at();

create trigger items_updated_at
  before update on public.items
  for each row execute function public.handle_updated_at();

create or replace function public.calculate_item_nutrients()
returns trigger as $$
declare
  kcal_100 numeric(10,2);
  prot_100 numeric(10,2);
  fat_100 numeric(10,2);
  carb_100 numeric(10,2);
begin
  select
    coalesce(a.kcal_100g, 0),
    coalesce(a.proteinas_100g, 0),
    coalesce(a.grasas_100g, 0),
    coalesce(a.carbs_100g, 0)
  into kcal_100, prot_100, fat_100, carb_100
  from public.alimentos a
  where a.id_alimento = new.id_alimento;

  if not found then
    raise exception 'Alimento no encontrado para id_alimento=%', new.id_alimento;
  end if;

  new.kcal = round((kcal_100 * new.cantidad) / 100, 2);
  new.proteinas_g = round((prot_100 * new.cantidad) / 100, 2);
  new.grasas_g = round((fat_100 * new.cantidad) / 100, 2);
  new.carbs_g = round((carb_100 * new.cantidad) / 100, 2);

  return new;
end;
$$ language plpgsql;

drop trigger if exists items_calculate_nutrients on public.items;
create trigger items_calculate_nutrients
  before insert or update of id_alimento, cantidad
  on public.items
  for each row execute function public.calculate_item_nutrients();

create or replace function public.recalculate_ingesta_totals()
returns trigger as $$
declare
  target_ingesta_id bigint;
begin
  target_ingesta_id = coalesce(new.id_ingesta, old.id_ingesta);

  update public.ingestas i
  set
    kcal_total = coalesce(
      (select round(sum(coalesce(it.kcal, 0)), 2) from public.items it where it.id_ingesta = target_ingesta_id),
      0
    ),
    proteinas_total_g = coalesce(
      (select round(sum(coalesce(it.proteinas_g, 0)), 2) from public.items it where it.id_ingesta = target_ingesta_id),
      0
    ),
    grasas_total_g = coalesce(
      (select round(sum(coalesce(it.grasas_g, 0)), 2) from public.items it where it.id_ingesta = target_ingesta_id),
      0
    ),
    carbs_total_g = coalesce(
      (select round(sum(coalesce(it.carbs_g, 0)), 2) from public.items it where it.id_ingesta = target_ingesta_id),
      0
    )
  where i.id_ingesta = target_ingesta_id;

  return null;
end;
$$ language plpgsql;

drop trigger if exists items_recalculate_ingesta_totals on public.items;
create trigger items_recalculate_ingesta_totals
  after insert or update or delete on public.items
  for each row execute function public.recalculate_ingesta_totals();

alter table public.alimentos enable row level security;
alter table public.ingestas enable row level security;
alter table public.items enable row level security;

create policy "alimentos: authenticated read"
  on public.alimentos for select
  to authenticated
  using (true);

create policy "ingestas: own read"
  on public.ingestas for select
  using (id_usuario = auth.uid());

create policy "ingestas: own insert"
  on public.ingestas for insert
  with check (id_usuario = auth.uid());

create policy "ingestas: own update"
  on public.ingestas for update
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());

create policy "ingestas: own delete"
  on public.ingestas for delete
  using (id_usuario = auth.uid());

create policy "items: own read"
  on public.items for select
  using (
    exists (
      select 1
      from public.ingestas i
      where i.id_ingesta = items.id_ingesta
      and i.id_usuario = auth.uid()
    )
  );

create policy "items: own insert"
  on public.items for insert
  with check (
    exists (
      select 1
      from public.ingestas i
      where i.id_ingesta = items.id_ingesta
      and i.id_usuario = auth.uid()
    )
  );

create policy "items: own update"
  on public.items for update
  using (
    exists (
      select 1
      from public.ingestas i
      where i.id_ingesta = items.id_ingesta
      and i.id_usuario = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ingestas i
      where i.id_ingesta = items.id_ingesta
      and i.id_usuario = auth.uid()
    )
  );

create policy "items: own delete"
  on public.items for delete
  using (
    exists (
      select 1
      from public.ingestas i
      where i.id_ingesta = items.id_ingesta
      and i.id_usuario = auth.uid()
    )
  );
