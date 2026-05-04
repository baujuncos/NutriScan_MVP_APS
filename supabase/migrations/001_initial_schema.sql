-- ============================================================
-- NutriScan MVP - Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Table: public.profiles
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  nombre      text not null,
  apellido    text not null,
  email       text not null,
  role        text not null check (role in ('investigador', 'deportista_ucc', 'particular', 'administrador')),
  physical_completed     boolean not null default false,
  academic_completed     boolean not null default false,
  psychological_completed boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Table: public.physical_data
-- ============================================================
create table if not exists public.physical_data (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  peso_kg         numeric(5,2) not null,
  altura_cm       numeric(5,1) not null,
  fecha_nacimiento date not null,
  sexo            char(1) not null check (sexo in ('M', 'F')),
  factor_actividad numeric(5,3) not null check (factor_actividad in (1.2, 1.375, 1.55, 1.725)),
  tmb             integer not null,
  get_kcal        integer not null,
  proteinas_g     integer not null,
  carbohidratos_g integer not null,
  grasas_g        integer not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- Table: public.academic_data
-- ============================================================
create table if not exists public.academic_data (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null unique references auth.users(id) on delete cascade,
  carrera                      text not null,
  anio                         smallint not null check (anio between 1 and 6),
  deporte                      text not null check (deporte in ('hockey', 'basquet')),
  posicion                     text not null,
  frecuencia_practicas_semana  smallint not null check (frecuencia_practicas_semana between 1 and 7),
  horas_practica               numeric(4,1) not null,
  frecuencia_competencias      text not null,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

-- ============================================================
-- Table: public.psychological_surveys
-- ============================================================
create table if not exists public.psychological_surveys (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  respuestas   smallint[] not null,
  completed_at timestamptz not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_physical_data_user_id on public.physical_data(user_id);
create index if not exists idx_academic_data_user_id on public.academic_data(user_id);
create index if not exists idx_psychological_surveys_user_id on public.psychological_surveys(user_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger physical_data_updated_at
  before update on public.physical_data
  for each row execute function public.handle_updated_at();

create trigger academic_data_updated_at
  before update on public.academic_data
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.physical_data enable row level security;
alter table public.academic_data enable row level security;
alter table public.psychological_surveys enable row level security;

-- Helper function: get the current user's role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ============================================================
-- RLS Policies: profiles
-- ============================================================

-- Users can read their own profile
create policy "profiles: own read"
  on public.profiles for select
  using (user_id = auth.uid());

-- Investigators and admins can read all profiles
create policy "profiles: investigador read all"
  on public.profiles for select
  using (public.get_my_role() in ('investigador', 'administrador'));

-- Users can insert their own profile
create policy "profiles: own insert"
  on public.profiles for insert
  with check (user_id = auth.uid());

-- Users can update their own profile
create policy "profiles: own update"
  on public.profiles for update
  using (user_id = auth.uid());

-- ============================================================
-- RLS Policies: physical_data
-- ============================================================

create policy "physical_data: own read"
  on public.physical_data for select
  using (user_id = auth.uid());

create policy "physical_data: investigador read all"
  on public.physical_data for select
  using (public.get_my_role() in ('investigador', 'administrador'));

create policy "physical_data: own insert"
  on public.physical_data for insert
  with check (user_id = auth.uid());

create policy "physical_data: own update"
  on public.physical_data for update
  using (user_id = auth.uid());

-- ============================================================
-- RLS Policies: academic_data
-- ============================================================

create policy "academic_data: own read"
  on public.academic_data for select
  using (user_id = auth.uid());

create policy "academic_data: investigador read all"
  on public.academic_data for select
  using (public.get_my_role() in ('investigador', 'administrador'));

create policy "academic_data: own insert"
  on public.academic_data for insert
  with check (user_id = auth.uid());

create policy "academic_data: own update"
  on public.academic_data for update
  using (user_id = auth.uid());

-- ============================================================
-- RLS Policies: psychological_surveys
-- ============================================================

create policy "psychological_surveys: own read"
  on public.psychological_surveys for select
  using (user_id = auth.uid());

create policy "psychological_surveys: investigador read all"
  on public.psychological_surveys for select
  using (public.get_my_role() in ('investigador', 'administrador'));

create policy "psychological_surveys: own insert"
  on public.psychological_surveys for insert
  with check (user_id = auth.uid());

create policy "psychological_surveys: own update"
  on public.psychological_surveys for update
  using (user_id = auth.uid());
