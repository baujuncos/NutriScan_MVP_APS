Sos un agente de desarrollo trabajando en NutriScan, una aplicación web
construida con Next.js 16 (App Router) + TypeScript, Supabase (PostgreSQL + Auth)
y Tailwind CSS v4.

## Base de datos de alimentos

El archivo `SARA2/base_macros.csv` ES la base de datos de alimentos de la aplicación.
Contiene 930 alimentos extraídos del sistema nutricional oficial argentino SARA2.
Las columnas en orden son:

  id | nombre | categoria | kcal_100g | proteinas_100g | grasas_100g | carbs_100g

Todos los valores nutricionales están expresados cada 100g de alimento.

Este CSV debe ser importado a la tabla `public.alimentos` de Supabase mediante
el script `SARA2/seed_supabase.py`, usando las variables `NEXT_PUBLIC_SUPABASE_URL`
y `SUPABASE_SERVICE_ROLE_KEY` del archivo `.env.local`.

## Funcionalidad general

La app permite a deportistas universitarios y/o particulares (consistente con lo que ya hecho en el repositorio) registrar su alimentación diaria
organizada en 6 momentos del día: desayuno, almuerzo, merienda, cena,
colaciones (pueden ser varias) y suplementos.

Para cada momento existe una **Ingesta**, que agrupa uno o más **Ítems**.
Cada Ítem representa un alimento consumido con una cantidad indicada por el usuario.

El usuario puede indicar si el ítem es sólido (gramos), líquido (ml) o
en polvo (gramos).

Los datos de dicha ingesta pueden ser visualizados por el usuario que los ingreso.

## Regla de cálculo central

El usuario ingresa la cantidad consumida de un alimento. El sistema recupera
los valores nutricionales de ese alimento desde la tabla `alimentos` (que
almacena valores por cada 100g) y aplica regla de tres:

  kcal_item       = (kcal_100g       × cantidad) / 100
  proteinas_item  = (proteinas_100g  × cantidad) / 100
  grasas_item     = (grasas_100g     × cantidad) / 100
  carbs_item      = (carbs_100g      × cantidad) / 100

Todos los valores se redondean a 2 decimales.
Los valores NULL de SARA2 se tratan como 0 en el cálculo.
Este cálculo SIEMPRE se ejecuta en el backend, nunca solo en el frontend.

Los totales de cada Ingesta (suma de todos sus ítems) son recalculados
automáticamente por un TRIGGER de PostgreSQL cada vez que se inserta,
actualiza o elimina un Ítem. El código de la aplicación no recalcula
estos totales manualmente.

## Modelo de datos

Tabla `alimentos` (poblada desde SARA2/base_macros.csv):
  id_alimento, nombre, categoria, kcal_100g, proteinas_100g,
  grasas_100g, carbs_100g

Tabla `ingestas`:
  id_ingesta, id_usuario (FK → auth.users), tipo, fecha,
  kcal_total, proteinas_total_g, grasas_total_g, carbs_total_g
  UNIQUE(id_usuario, fecha)

Tabla `items`:
  id_item, id_ingesta (FK), id_alimento (FK), tipo_item
  ('solido'|'liquido'|'en polvo'), cantidad, kcal, proteinas_g,
  grasas_g, carbs_g

## Restricciones

- NO modificar archivos en SARA2/
- NO hardcodear credenciales
- TypeScript estricto, sin 'any'
- Todos los endpoints verifican autenticación → 401 si no autenticado
- Redondear siempre a 2 decimales en el backend
