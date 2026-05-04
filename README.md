# NutriScan MVP

Plataforma nutricional MVP construida con Next.js 14, Supabase (Auth + Database) y Tailwind CSS.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/Auth**: Supabase (Auth, PostgreSQL, RLS)
- **Formularios**: React Hook Form + Zod
- **Seguridad**: Row Level Security (RLS) en Supabase, validación server-side del código de investigador

## Roles de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `deportista_ucc` | Email `@ucc.edu.ar` | Onboarding 3 fases → Home |
| `particular` | Cualquier otro email | Fase 1 (Perfil Físico) → Home |
| `investigador` | Código de invitación | Dashboard completo con todos los datos |
| `administrador` | Asignado manualmente | Dashboard completo |

## Configuración

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

Completa `.env.local` con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
INVITATION_CODE_INVESTIGADOR=JOT854_UCC_NS26
```

### 2. Base de Datos Supabase

Ejecuta el migration en el SQL Editor de Supabase:

```
supabase/migrations/001_initial_schema.sql
```

Este script crea:
- `public.profiles` – perfiles de usuario con roles
- `public.physical_data` – datos físicos y cálculos nutricionales
- `public.academic_data` – datos académicos/deportivos (UCC)
- `public.psychological_surveys` – encuesta psicológica SARA (25 preguntas Likert)
- RLS policies para cada tabla
- Triggers `updated_at`

### 3. Supabase Auth – Google OAuth

En el Dashboard de Supabase → Authentication → Providers → Google:
- Habilita Google OAuth
- Agrega `http://localhost:3000/auth/callback` como redirect URL autorizada

### 4. Desarrollo local

```bash
npm install
npm run dev
```

## Flujo de la Aplicación

```
/ (Bienvenida)
├── /login              → Email/Password o Google OAuth
└── /register           → Registro + detección automática de rol
    └── ?type=investigador → Requiere INVITATION_CODE_INVESTIGADOR

POST /api/validate-investigator  → Validación server-side del código

(Onboarding - solo usuarios no-investigador)
├── /perfil-fisico          → Fase 1: Peso, Altura, DOB, Sexo, Actividad
│                              Calcula: TMB, GET, Proteínas, Carbos, Grasas
├── /perfil-academico       → Fase 2: Solo deportista_ucc
└── /encuesta-psicologica   → Fase 3: 25 preguntas Likert 0-5 (Solo deportista_ucc)

(Destinos finales)
├── /home       → Deportistas y Particulares (resumen nutricional)
└── /dashboard  → Investigadores y Administradores (datos de todos los usuarios)
```

## Motor de Cálculo Nutricional

**Harris-Benedict:**
- Hombres: `TMB = 66.47 + (13.75 × peso_kg) + (5.003 × altura_cm) - (6.755 × edad)`
- Mujeres: `TMB = 655.1 + (9.563 × peso_kg) + (1.85 × altura_cm) - (4.676 × edad)`

**GET:** `TMB × Factor_de_Actividad`

**Macros (mantenimiento):**
- Proteínas: 15% del GET ÷ 4 = gramos
- Carbohidratos: 55% del GET ÷ 4 = gramos
- Grasas: 30% del GET ÷ 9 = gramos

## Seguridad

- El código de investigador **nunca** se expone al cliente; la validación ocurre en `/api/validate-investigator` (servidor)
- RLS habilitado en todas las tablas de Supabase
- Los investigadores pueden leer todos los datos; los deportistas solo los propios
- Los guardrails del middleware redirigen a la fase de onboarding pendiente al re-loguearse
