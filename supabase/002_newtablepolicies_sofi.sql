-- Dar acceso al esquema público
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Dar todos los permisos sobre las tablas a los roles necesarios
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Dar permisos sobre las secuencias (IDs autoincrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Activar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychological_surveys ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFILES
CREATE POLICY "Permitir todo a dueños profiles" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA PHYSICAL_DATA
CREATE POLICY "Permitir todo a dueños physical" ON public.physical_data
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA ACADEMIC_DATA
CREATE POLICY "Permitir todo a dueños academic" ON public.academic_data
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA PSYCHOLOGICAL_SURVEYS
CREATE POLICY "Permitir todo a dueños psychological_surveys" ON public.psychological_surveys
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);