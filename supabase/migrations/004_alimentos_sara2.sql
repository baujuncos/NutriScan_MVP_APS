CREATE TABLE IF NOT EXISTS public.alimentos (
  id_alimento    BIGSERIAL PRIMARY KEY,
  nombre         VARCHAR(200) NOT NULL,
  categoria      VARCHAR(100),
  kcal_100g      DECIMAL(7,2),
  proteinas_100g DECIMAL(7,2),
  grasas_100g    DECIMAL(7,2),
  carbs_100g     DECIMAL(7,2),
  fuente         VARCHAR(20) DEFAULT 'SARA2',
  validado       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alimentos_nombre_unique
  ON public.alimentos (nombre);

CREATE INDEX IF NOT EXISTS idx_alimentos_nombre_fts
  ON public.alimentos
  USING gin(to_tsvector('spanish', nombre));

CREATE INDEX IF NOT EXISTS idx_alimentos_categoria
  ON public.alimentos(categoria);

ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alimentos"
  ON public.alimentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert alimentos"
  ON public.alimentos FOR INSERT TO service_role WITH CHECK (true);
