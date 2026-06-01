-- ============================================================
-- NutriScan MVP - Allow investigators to read items for all athletes
-- Needed for the researcher Excel export to resolve food names and macros.
-- ============================================================

create policy "items: investigador read all"
  on public.items for select
  using (public.get_my_role() in ('investigador', 'administrador'));


-- ============================================================
-- NutriScan MVP - Data API access for hydration and nutrition
-- ============================================================

-- Permitir uso del esquema público desde la API
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permitir acceso a las tablas desde la Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hidratacion TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingestas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;

-- Asegurar RLS activado
ALTER TABLE public.hidratacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HIDRATACION
-- ============================================================

DROP POLICY IF EXISTS "hidratacion: own read" ON public.hidratacion;
DROP POLICY IF EXISTS "hidratacion: own insert" ON public.hidratacion;
DROP POLICY IF EXISTS "hidratacion: own update" ON public.hidratacion;
DROP POLICY IF EXISTS "hidratacion: investigador read all" ON public.hidratacion;

CREATE POLICY "hidratacion: own read"
  ON public.hidratacion
  FOR SELECT
  TO authenticated
  USING (id_usuario = auth.uid());

CREATE POLICY "hidratacion: own insert"
  ON public.hidratacion
  FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "hidratacion: own update"
  ON public.hidratacion
  FOR UPDATE
  TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "hidratacion: investigador read all"
  ON public.hidratacion
  FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('investigador', 'administrador'));

-- ============================================================
-- INGESTAS
-- ============================================================

DROP POLICY IF EXISTS "ingestas: own read" ON public.ingestas;
DROP POLICY IF EXISTS "ingestas: own insert" ON public.ingestas;
DROP POLICY IF EXISTS "ingestas: own update" ON public.ingestas;
DROP POLICY IF EXISTS "ingestas: own delete" ON public.ingestas;
DROP POLICY IF EXISTS "ingestas: investigador read all" ON public.ingestas;

CREATE POLICY "ingestas: own read"
  ON public.ingestas
  FOR SELECT
  TO authenticated
  USING (id_usuario = auth.uid());

CREATE POLICY "ingestas: own insert"
  ON public.ingestas
  FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "ingestas: own update"
  ON public.ingestas
  FOR UPDATE
  TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "ingestas: own delete"
  ON public.ingestas
  FOR DELETE
  TO authenticated
  USING (id_usuario = auth.uid());

CREATE POLICY "ingestas: investigador read all"
  ON public.ingestas
  FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('investigador', 'administrador'));

-- ============================================================
-- ITEMS
-- ============================================================

DROP POLICY IF EXISTS "items: own read" ON public.items;
DROP POLICY IF EXISTS "items: own insert" ON public.items;
DROP POLICY IF EXISTS "items: own update" ON public.items;
DROP POLICY IF EXISTS "items: own delete" ON public.items;

CREATE POLICY "items: own read"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ingestas i
      WHERE i.id_ingesta = items.id_ingesta
        AND i.id_usuario = auth.uid()
    )
  );

CREATE POLICY "items: own insert"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ingestas i
      WHERE i.id_ingesta = items.id_ingesta
        AND i.id_usuario = auth.uid()
    )
  );

CREATE POLICY "items: own update"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ingestas i
      WHERE i.id_ingesta = items.id_ingesta
        AND i.id_usuario = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ingestas i
      WHERE i.id_ingesta = items.id_ingesta
        AND i.id_usuario = auth.uid()
    )
  );

CREATE POLICY "items: own delete"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ingestas i
      WHERE i.id_ingesta = items.id_ingesta
        AND i.id_usuario = auth.uid()
    )
  );

  -- Permitir acceso al esquema público desde la API
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Permitir lectura de la tabla desde la Data API
GRANT SELECT ON public.alimentos TO anon, authenticated;

-- Asegurar que RLS esté activo
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;

-- Reemplazar cualquier política previa
DROP POLICY IF EXISTS "alimentos: public read" ON public.alimentos;

-- Permitir lectura pública
CREATE POLICY "alimentos: public read"
  ON public.alimentos
  FOR SELECT
  TO anon, authenticated
  USING (true);