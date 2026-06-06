-- Change anio from year-of-career (1–6) to calendar year of faculty enrollment (1990–2100).
-- NOT VALID skips the check on existing rows so old data (e.g. anio=3) doesn't break the migration.
ALTER TABLE public.academic_data
  DROP CONSTRAINT IF EXISTS academic_data_anio_check;

ALTER TABLE public.academic_data
  ADD CONSTRAINT academic_data_anio_check
  CHECK (anio BETWEEN 1990 AND 2100) NOT VALID;
