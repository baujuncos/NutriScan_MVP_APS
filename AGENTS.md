# 🤖 Instrucciones para el Agente de Desarrollo — NutriScan

## Stack tecnológico

- **Frontend/Backend:** Next.js 16 (App Router) + TypeScript
- **Base de datos + Auth:** Supabase (PostgreSQL)
- **Estilos:** Tailwind CSS v4
- **Formularios:** React Hook Form + Zod
- **CSV de alimentos:** `SARA2/base_macros.csv`

---

## Modelo de datos (DER)

La parte del DER que vas a implementar tiene esta estructura exacta:

### `Auth` _(tabla de Supabase ya existente)_
| Campo | Tipo |
|---|---|
| id | UUID (PK) |
| display_name | text |
| email | text |
| phone | text |
| providers | text |
| provider_type | text |
| created_at | timestamptz |
| last_sign_in_at | timestamptz |

> Un usuario **REGISTRA** 0..* Ingestas

---

### `Ingesta`
| Campo | Tipo | Descripción |
|---|---|---|
| id_ingesta | BIGSERIAL (PK) | |
| id_usuario | UUID (FK → Auth.id) | |
| tipo | VARCHAR(20) | `'desayuno'` \| `'almuerzo'` \| `'merienda'` \| `'cena'` \| `'colaciones'` \| `'suplementos'` |
| fecha | DATE | Día al que pertenece la ingesta |
| kcal_total | DECIMAL(8,2) | Suma calculada de todos sus ítems |
| proteinas_total_g | DECIMAL(8,2) | |
| grasas_total_g | DECIMAL(8,2) | |
| carbs_total_g | DECIMAL(8,2) | |

> Una Ingesta **CONTIENE** 1..* Ítems

---

### `Item`
| Campo | Tipo | Descripción |
|---|---|---|
| id_item | BIGSERIAL (PK) | |
| id_ingesta | BIGINT (FK → Ingesta.id_ingesta) | |
| id_alimento | BIGINT (FK → Alimento_SARA2.id_alimento) | |
| tipo_item | VARCHAR(20) | `'solido'` \| `'liquido'` \| `'en polvo'` — seleccionable por el usuario |
| cantidad | DECIMAL(7,2) | Gramos (sólido/en polvo) o ml (líquido) indicados por el usuario |
| kcal | DECIMAL(7,2) | Calculado: `(kcal_100g × cantidad) / 100` |
| proteinas_g | DECIMAL(7,2) | Calculado: `(proteinas_100g × cantidad) / 100` |
| grasas_g | DECIMAL(7,2) | Calculado: `(grasas_100g × cantidad) / 100` |
| carbs_g | DECIMAL(7,2) | Calculado: `(carbs_100g × cantidad) / 100` |

> Un Ítem **REFERENCIA** 1..1 Alimento_SARA2

---

### `Alimento_SARA2`
| Campo | Tipo | Descripción |
|---|---|---|
| id_alimento | BIGSERIAL (PK) | |
| nombre | VARCHAR(200) | |
| categoria | VARCHAR(100) | |
| kcal_100g | DECIMAL(7,2) | Calorías cada 100g según SARA2 |
| proteinas_100g | DECIMAL(7,2) | Proteínas cada 100g según SARA2 |
| grasas_100g | DECIMAL(7,2) | Grasas cada 100g según SARA2 |
| carbs_100g | DECIMAL(7,2) | Carbohidratos disponibles cada 100g según SARA2 |

---

## Regla de negocio central

El usuario indica cuántos gramos (o ml) consumió de un alimento. El sistema busca la composición química en SARA2 (valores por 100g) y aplica regla de tres:

```
kcal_item       = (kcal_100g       × cantidad) / 100
proteinas_item  = (proteinas_100g  × cantidad) / 100
grasas_item     = (grasas_100g     × cantidad) / 100
carbs_item      = (carbs_100g      × cantidad) / 100
```

> Todos los valores se redondean a **2 decimales**. Los totales de la Ingesta se recalculan sumando todos sus Ítems.

---

## Diseño visual — Referencia exacta (prototipo Lovable)

### Paleta de colores

Definir en `globals.css` como variables CSS:

```css
:root {
  --color-primary:            #1B3A6B;
  --color-accent:             #22C55E;
  --color-orange-desayuno:    #F97316;
  --color-yellow-almuerzo:    #EAB308;
  --color-green-merienda:     #22C55E;
  --color-blue-cena:          #3B82F6;
  --color-purple-colaciones:  #A855F7;
  --color-teal-suplementos:   #14B8A6;
  --color-bg:                 #F8F9FA;
  --color-text:               #1A1A1A;
  --color-text-secondary:     #6B7280;
}
```

**Gradiente cards principales:**
```css
background: linear-gradient(135deg, #1B3A6B 0%, #22C55E 100%);
```

**Tipografía:** Inter | **Bordes:** `rounded-2xl` | **Sombras:** `shadow-sm`

---

### Pantalla 1 — Login

Layout dos columnas en desktop, una columna en mobile.

**Columna izquierda** (fondo `#1B3A6B`, texto blanco):
- Logo: círculo verde con ícono de pulso + `"NutriScan"` bold
- Badge: `"🏃 UCC · Nutrición Deportiva"`
- Título: `"Tu rendimiento,"` + `"medido con ciencia."` (la parte `"con ciencia."` en `#22C55E`)
- Descripción de la app
- 3 stats: `"120+ Deportistas"`, `"8.4k Comidas registradas"`, `"6 Equipos UCC"`
- Footer: `"🔒 Datos protegidos · Uso académico"`

**Columna derecha** (fondo blanco):
- Tabs: `"→ Iniciar sesión"` | `"👤+ Crear cuenta"`
- Formulario login: email UCC + contraseña + botón verde `"Iniciar sesión →"`
- Formulario registro: nombre, apellido, email UCC, contraseña, confirmar contraseña

---

### Pantalla 2 — Dashboard (`/inicio`)

- Header: `"Hola, [nombre] 👋"` + `"Tu día en NutriScan"`

**Card principal** (gradiente azul→verde):
- Círculo SVG de progreso con % de meta calórica
- `"CALORÍAS HOY: [kcal_total] / [kcal_objetivo] kcal"`
- `"⚡ Faltan [diferencia] kcal"`
- Barras de progreso: CARBS (amarilla), PROTEÍNAS (roja), GRASAS (púrpura) con `[actual]g / [objetivo]g`

**Card "Estado de carga":**
- Lista de 5 momentos (sin suplementos en esta vista)
- Completado: fondo `#F0FDF4` + ✅ verde
- Pendiente: botón `"Cargar"` azul

**Card "Hidratación":**
- Contador de vasos con botones − y +
- Barras de progreso de vasos

**Card "Últimas comidas":**
- Últimas 3 ingestas con nombre agrupado, momento+hora, kcal

**Bottom nav:** Inicio | Comidas | Perfil

---

### Pantalla 3 — Comidas (`/comidas`)

**Header dinámico** con color del momento activo:
- `"REGISTRO DE COMIDAS"` + ícono + nombre del momento
- Badge `"🔥 [X] kcal"`

**Tabs de momentos** (scroll horizontal en mobile, sin scrollbar visible):

```ts
const momentos = [
  { id: 'desayuno',    label: 'Desayuno',    emoji: '☀️', color: '#F97316' },
  { id: 'almuerzo',    label: 'Almuerzo',    emoji: '🍴', color: '#EAB308' },
  { id: 'merienda',    label: 'Merienda',    emoji: '🍪', color: '#22C55E' },
  { id: 'cena',        label: 'Cena',        emoji: '🌙', color: '#3B82F6' },
  { id: 'colaciones',  label: 'Colaciones',  emoji: '🍎', color: '#A855F7' },
  { id: 'suplementos', label: 'Suplementos', emoji: '💊', color: '#14B8A6' },
]
```

- Tab activo: fondo de su color, texto blanco, `rounded-xl`
- Tab inactivo: fondo gris claro, texto gris

**Buscador:**
- Placeholder: `"Buscar en SARA2: arroz, pollo, banana..."`
- Debounce 300ms, mínimo 2 caracteres
- Dropdown con: nombre bold + categoría gris + `kcal_100g` alineado a la derecha

**Modal al seleccionar alimento:**
- Nombre + categoría del alimento
- Pills con valores POR 100G: kcal, proteínas, grasas, carbs
- Input numérico `"Cantidad (gramos)"` con botones − y +
- Preview `"Aporte estimado"` en tiempo real (debounce 500ms → `/api/alimentos/calcular`)
- Botón `"Agregar a [Momento]"` con el color del momento activo

**Lista de ítems del momento activo:**
- Cada ítem: nombre del alimento + `[X]g` + `[Y] kcal` + botón eliminar
- Estado vacío con ícono y mensaje

---

### Pantalla 4 — Perfil (`/perfil`)

- Header gradiente con avatar (iniciales), nombre, carrera+año, badge deporte+posición
- Métricas: frecuencia de entrenamiento, UA, edad
- `"Repetir Valoración Psicológica"` (fondo `#1B3A6B`)
- `"Editar datos físicos"` (con check verde)
- Resumen del mes: comidas, suplementos, hidratación, cumplimiento

---

## Tarea 1 — Migraciones Supabase

### `supabase/migrations/004_alimentos_sara2.sql`

```sql
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
```

---

### `supabase/migrations/005_ingestas_items.sql`

```sql
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger automático al modificar ítems
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
```

---

## Tarea 2 — Script de seed SARA2

Crear `SARA2/seed_supabase.py`:

**1. Leer el CSV**

```python
import pandas as pd
df = pd.read_csv('SARA2/base_macros.csv', encoding='utf-8-sig', header=None)
```

Verificar el orden real de columnas. Si hay columna ID al inicio (del script `5_merge_tablas.py`), ignorarla. El orden esperado es:

| Posición | Campo destino |
|---|---|
| 1ª columna | `id_alimento` |
| 2ª columna | `nombre` |
| 3ª columna | `categoria` |
| 4ª columna | `kcal_100g` |
| 5ª columna | `proteinas_100g` |
| 6ª columna | `grasas_100g` |
| 7ª columna | `carbs_100g` |


**2. Conectar a Supabase** con variables del `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Usar la librería `supabase-py` (`pip install supabase`).

**3. Insertar en lotes de 100** con upsert, conflict en `nombre`.

**4. Imprimir resumen:** total procesados, insertados, ignorados, distribución por categoría.

---

## Tarea 3 — Route Handlers (`src/app/api/`)

### `GET /api/alimentos/buscar`

Params: `q` (min 2 chars), `categoria?`, `limit?` (default 20, max 50)

```ts
// Query Supabase
supabase
  .from('alimentos')
  .select('id_alimento,nombre,categoria,kcal_100g,proteinas_100g,grasas_100g,carbs_100g')
  .ilike('nombre', `%${q}%`)
  .limit(limit)
```

Validar con Zod. Verificar auth → `401` si no autenticado.

---

### `GET /api/alimentos/[id]`

Buscar por `id_alimento`. Return `404` si no existe.

---

### `POST /api/alimentos/calcular`

```ts
// Body
{ id_alimento: number, cantidad: number }

// Schema Zod
{ id_alimento: z.number().positive(), cantidad: z.number().min(0.1).max(5000) }

// Lógica
kcal        = round((kcal_100g       ?? 0) * cantidad / 100, 2)
proteinas_g = round((proteinas_100g  ?? 0) * cantidad / 100, 2)
grasas_g    = round((grasas_100g     ?? 0) * cantidad / 100, 2)
carbs_g     = round((carbs_100g      ?? 0) * cantidad / 100, 2)

// Respuesta
{ id_alimento, nombre, cantidad, kcal, proteinas_g, grasas_g, carbs_g }
```

---

### `GET | POST /api/ingestas`

**GET** — obtener ingestas del usuario para una fecha:
- Query param: `fecha` (ISO date, default hoy)
- Join con items y alimentos para devolver info completa

**POST** — crear o recuperar una ingesta:
- Body: `{ tipo, fecha }`
- Usar UPSERT con `on_conflict: id_usuario, tipo, fecha`
- Devolver la ingesta con su `id_ingesta`

---

### `GET | POST /api/ingestas/[id]/items`

**GET** — listar ítems de una ingesta con join a alimentos (nombre, categoria)

**POST** — agregar un ítem a una ingesta:

```ts
// Body
{ id_alimento: number, cantidad: number, tipo_item: 'solido' | 'liquido' | 'en polvo' }

// Flujo exacto:
// 1. Validar que la ingesta pertenece al usuario autenticado
// 2. Buscar alimento por id_alimento en tabla alimentos
// 3. Calcular con regla de tres (redondear a 2 decimales)
// 4. Insertar en tabla items con todos los valores calculados
// 5. El TRIGGER de PostgreSQL recalcula automáticamente los totales en ingestas
// 6. Devolver el ítem creado con los valores calculados
```

---

### `DELETE /api/ingestas/[id]/items/[itemId]`

Verificar que el ítem pertenece al usuario. Eliminar. El trigger recalcula los totales automáticamente.

---

## Tarea 4 — Componentes React

### `src/components/alimentos/BuscadorAlimentos.tsx`

- **Props:** `momentoActivo: string`, `onAlimentoAgregado: () => void`
- **Estado:** `query`, `resultados`, `loading`, `modalAbierto`, `alimentoSeleccionado`
- Input con ícono `Search` (lucide-react)
- `useEffect` + debounce 300ms → `GET /api/alimentos/buscar?q=...`
- Dropdown absoluto: nombre bold | categoría gris | `kcal_100g/100g` derecha
- Click en resultado → abrir `ModalAgregarAlimento`
- Cerrar dropdown con click fuera (`useRef`)

---

### `src/components/alimentos/ModalAgregarAlimento.tsx`

```ts
// Props
{
  alimento: { id_alimento, nombre, categoria, kcal_100g, proteinas_100g, grasas_100g, carbs_100g }
  momentoActivo: string
  id_ingesta: number
  onAgregado: () => void
  onCerrar: () => void
}

// Estado
cantidad: number    // default 100
calculado: null | { kcal, proteinas_g, grasas_g, carbs_g }
loading: boolean
```

- Pills de referencia `"Por 100g"`: kcal, proteínas, grasas, carbs
- Input numérico de cantidad con botones − y + (incremento de 10g)
- `useEffect` con debounce 500ms → `POST /api/alimentos/calcular`
- Sección `"Aporte estimado"` con los 4 valores en tiempo real
- Selector de `tipo_item`: `'solido'` | `'liquido'` | `'en polvo'`
- Botón `"Agregar a [momentoActivo]"` con color dinámico:

```ts
const colorMomento: Record<string, string> = {
  desayuno: '#F97316', almuerzo: '#EAB308', merienda: '#22C55E',
  cena: '#3B82F6', colaciones: '#A855F7', suplementos: '#14B8A6',
}
```

- Al confirmar: `POST /api/ingestas/[id_ingesta]/items` → `onAgregado()` → cierra modal
- Cerrar con `Escape` o click en overlay

---

### `src/components/ingestas/ListaItems.tsx`

- **Props:** `id_ingesta: number`, `momentoActivo: string`, `onCambio: () => void`
- Fetch `GET /api/ingestas/[id]/items` al montar y al llamar `onCambio`
- Lista: nombre alimento | `[X]g` | `[Y] kcal` | botón eliminar (`Trash2`)
- Delete: `DELETE /api/ingestas/[id]/items/[itemId]` → recargar
- Estado vacío con ícono del momento y mensaje

---

### `src/components/ingestas/ResumenMacros.tsx`

- **Props:** `kcal_total`, `proteinas_g`, `carbs_g`, `grasas_g`
- Muestra los 4 valores en pills con sus colores correspondientes

---

## Tarea 5 — Página Comidas (`src/app/(dashboard)/comidas/page.tsx`)

```ts
// Estado
momentoActivo: string       // default 'desayuno'
ingestaActual: { id_ingesta: number } | null
refreshKey: number          // para forzar recarga de lista
```

**Al cambiar `momentoActivo` o al montar:**
1. `GET /api/ingestas?fecha=[hoy]&tipo=[momentoActivo]`
2. Si no existe → `POST /api/ingestas` con `{ tipo: momentoActivo, fecha: hoy }`
3. Guardar `id_ingesta` en estado

**Renderizar:**
- Header dinámico con color del momento activo
- Tabs de 6 momentos
- `BuscadorAlimentos` con `momentoActivo` e `id_ingesta`
- `ListaItems` con `id_ingesta` y `refreshKey`
- Al `onAlimentoAgregado`: incrementar `refreshKey`

---

## Tarea 6 — Dashboard con datos reales (`src/app/(dashboard)/inicio/page.tsx`)

Al montar: `GET /api/ingestas?fecha=[hoy]` para obtener todas las ingestas del día.

```ts
// Calcular desde las ingestas
kcal_total      = SUM(ingesta.kcal_total)
proteinas_total = SUM(ingesta.proteinas_total_g)
carbs_total     = SUM(ingesta.carbs_total_g)
grasas_total    = SUM(ingesta.grasas_total_g)

// Meta calórica desde perfil del usuario
porcentaje_meta = min(100, round((kcal_total / kcal_objetivo) * 100))

// Estado de carga: completado si kcal_total > 0
// Últimas comidas: las 3 ingestas más recientes con kcal_total > 0, ordenadas por created_at DESC
```

---

## Restricciones

| # | Restricción |
|---|---|
| 1 | **NO** modificar archivos en `SARA2/` |
| 2 | **NO** hardcodear credenciales; usar siempre `process.env` |
| 3 | TypeScript estricto — **sin `any`** |
| 4 | Todos los Route Handlers verifican auth antes de responder → `401` si no autenticado |
| 5 | La regla de tres **siempre** se calcula en el backend, nunca solo en el frontend |
| 6 | Los totales de Ingesta los recalcula el **TRIGGER de PostgreSQL**, no el código de la app |
| 7 | Los valores `NULL` de SARA2 se tratan como `0` en el cálculo |
| 8 | Redondear **siempre** a 2 decimales en el backend |
| 9 | En la UI mostrar máximo 1 decimal (ej: `"1.8k kcal"`, `"72.3g"`) |
| 10 | El modal cierra con `Escape` o click fuera del card |
| 11 | Los tabs de momentos usan `overflow-x: auto` con scrollbar oculto en mobile |
| 12 | Bottom navigation fija con `z-50` |
| 13 | Usar `lucide-react` para todos los íconos |
| 14 | El buscador es case-insensitive y tolerante a acentos (`.ilike`) |
