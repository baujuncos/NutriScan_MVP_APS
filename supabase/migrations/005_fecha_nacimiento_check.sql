-- ============================================================
-- JOT-107: enforce birth-date sanity at the DB level
-- ============================================================
alter table public.physical_data
  drop constraint if exists physical_data_fecha_nacimiento_check;

alter table public.physical_data
  add constraint physical_data_fecha_nacimiento_check
  check (
    fecha_nacimiento <= current_date
    and fecha_nacimiento >= current_date - interval '100 years'
  );
