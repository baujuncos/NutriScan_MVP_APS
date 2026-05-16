-- Add 'gaseosa' to hidratacion_registros tipo check constraint

ALTER TABLE public.hidratacion_registros
  DROP CONSTRAINT IF EXISTS hidratacion_registros_tipo_check;

ALTER TABLE public.hidratacion_registros
  ADD CONSTRAINT hidratacion_registros_tipo_check
  CHECK (tipo IN ('agua', 'jugo', 'gaseosa', 'infusion', 'leche', 'otro'));
