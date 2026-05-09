-- Tabla Ingesta
CREATE TABLE IF NOT EXISTS public.ingestas (
  id_ingesta        BIGSERIAL PRIMARY KEY,
  id_usuario        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo              VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('desayuno','almuerzo','merienda',
                                    'cena','colaciones','suplementos')),
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  kcal_total        DECIMAL(8,2) DEFAULT 0,
  proteinas_total_g DECIMAL(8,2) DEFAULT 0,
  carbs_total_g     DECIMAL(8,2) DEFAULT 0,
  grasas_total_g    DECIMAL(8,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_usuario, tipo, fecha)
);

-- Tabla Item
CREATE TABLE IF NOT EXISTS public.items (
  id_item     BIGSERIAL PRIMARY KEY,
  id_ingesta  BIGINT NOT NULL REFERENCES public.ingestas(id_ingesta) ON DELETE CASCADE,
  id_alimento BIGINT NOT NULL REFERENCES public.alimentos(id_alimento),
  tipo_item   VARCHAR(20) CHECK (tipo_item IN ('solido','liquido','en polvo')),
  cantidad    DECIMAL(7,2) NOT NULL CHECK (cantidad > 0),
  kcal        DECIMAL(7,2) NOT NULL DEFAULT 0,
  proteinas_g DECIMAL(7,2) NOT NULL DEFAULT 0,
  grasas_g    DECIMAL(7,2) NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(7,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Función que recalcula los totales de una Ingesta
-- al insertar, actualizar o eliminar un Ítem
CREATE OR REPLACE FUNCTION public.recalcular_totales_ingesta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ingestas
  SET
    kcal_total        = COALESCE((
      SELECT ROUND(SUM(kcal)::numeric, 2)
      FROM public.items WHERE id_ingesta = COALESCE(NEW.id_ingesta, OLD.id_ingesta)
    ), 0),
    proteinas_total_g = COALESCE((
      SELECT ROUND(SUM(proteinas_g)::numeric, 2)
      FROM public.items WHERE id_ingesta = COALESCE(NEW.id_ingesta, OLD.id_ingesta)
    ), 0),
    carbs_total_g     = COALESCE((
      SELECT ROUND(SUM(carbs_g)::numeric, 2)
      FROM public.items WHERE id_ingesta = COALESCE(NEW.id_ingesta, OLD.id_ingesta)
    ), 0),
    grasas_total_g    = COALESCE((
      SELECT ROUND(SUM(grasas_g)::numeric, 2)
      FROM public.items WHERE id_ingesta = COALESCE(NEW.id_ingesta, OLD.id_ingesta)
    ), 0)
  WHERE id_ingesta = COALESCE(NEW.id_ingesta, OLD.id_ingesta);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger automático al modificar ítems
DROP TRIGGER IF EXISTS trigger_recalcular_totales ON public.items;
CREATE TRIGGER trigger_recalcular_totales
  AFTER INSERT OR UPDATE OR DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_totales_ingesta();

-- RLS Ingestas
ALTER TABLE public.ingestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ingestas"
  ON public.ingestas FOR ALL TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

-- RLS Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own items"
  ON public.items FOR ALL TO authenticated
  USING (
    id_ingesta IN (
      SELECT id_ingesta FROM public.ingestas WHERE id_usuario = auth.uid()
    )
  )
  WITH CHECK (
    id_ingesta IN (
      SELECT id_ingesta FROM public.ingestas WHERE id_usuario = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_ingestas_usuario_fecha
  ON public.ingestas(id_usuario, fecha);
CREATE INDEX IF NOT EXISTS idx_items_ingesta
  ON public.items(id_ingesta);
