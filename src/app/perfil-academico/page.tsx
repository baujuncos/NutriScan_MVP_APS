'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

const UNIDADES_ACADEMICAS = [
  'Arquitectura y Diseño',
  'Ciencias Políticas y RRII',
  'Ciencias Agropecuarias',
  'Ciencias de la Salud',
  'Ciencias Económicas',
  'Derecho y Sociales',
  'Educación',
  'Filosofía y Humanidades',
  'Ingeniería',
  'Teología',
] as const;

type UnidadAcademica = (typeof UNIDADES_ACADEMICAS)[number];

const CARRERAS_POR_UNIDAD: Record<UnidadAcademica, string[]> = {
  'Arquitectura y Diseño': ['Arquitectura', 'Diseño', 'Diseño de Indumentaria'],
  'Ciencias Políticas y RRII': [
    'Ciencias Políticas',
    'RRII',
    'Gestión Pública',
    'Tec. en Gestión Pública',
  ],
  'Ciencias Agropecuarias': [
    'Ing. Agronómica',
    'Veterinaria',
    'Tec. en Producción Agropec.',
    'Tec. en Biotec',
  ],
  'Ciencias de la Salud': [
    'Medicina',
    'Odontología',
    'Bioquímica',
    'Farmacia',
    'Nutrición',
    'Psicología',
    'Kinesiología',
    'Terapia Ocupacional',
    'Enfermería',
    'Tec. Alimentos',
    'Instr. Quirúrgica',
    'Cosmetología',
  ],
  'Ciencias Económicas': [
    'Contador',
    'Adm. Empresas',
    'Adm. Negocios Digitales',
    'Mkt. Digital',
    'Gestión Gerencial',
    'Adm. Agronegocios',
  ],
  'Derecho y Sociales': ['Abogacía', 'Notariado', 'Comunicación Estratégica'],
  Educación: [
    'Cs. de la Educación',
    'Psicopedagogía',
    'Prof. en Educación',
    'Gestión Educ.',
    'Educación Inicial',
  ],
  'Filosofía y Humanidades': ['Filosofía', 'Prof. en Filosofía', 'Filosofía y Humanidades'],
  Ingeniería: [
    'Ing. Informática',
    'Ing. Computación',
    'Ing. Electrónica',
    'Ing. Civil',
    'Ing. Industrial',
    'Ing. Mecánica',
    'Ing. en Sistemas',
    'IA y Ciencia de Datos',
    'Bioinformática',
    'Tec. Ciencia de Datos',
    'Tec. Desarrollo SW',
  ],
  Teología: ['Teología', 'Prof. en Teología', 'Bach. Eclesiástico'],
};

const POSITION_UNSURE = 'No sé / No estoy seguro';

const POSICIONES_POR_DEPORTE: Record<string, string[]> = {
  hockey: ['Delantera', 'Defensa', 'Mediocampista', 'Arquera', POSITION_UNSURE],
  basquet: ['Base', 'Escolta', 'Alero', 'Pivot', 'Ala-Pivot', POSITION_UNSURE],
};

const FRECUENCIA_COMPETENCIAS_OPTIONS = [
  'Todas las semanas',
  'Más de una vez por semana',
  'Cada dos semanas',
  'Una vez por mes',
];

const MAX_ANIO = 5;

const schema = z.object({
  unidad_academica: z.string().min(1, 'Selecciona tu unidad académica'),
  carrera: z.string().min(1, 'Selecciona tu carrera'),
  anio: z.string().min(1, 'Selecciona el año'),
  deporte: z.string().min(1, 'Selecciona un deporte'),
  posicion: z.string().min(1, 'Selecciona tu posición'),
  frecuencia_practicas_semana: z.string().min(1, 'Ingresa la frecuencia de prácticas'),
  horas_practica: z.string().min(1, 'Ingresa las horas de práctica'),
  frecuencia_competencias: z.string().min(1, 'Selecciona la frecuencia de competencias'),
});

type FormData = z.infer<typeof schema>;

function findUnidadByCarrera(carrera: string): UnidadAcademica | '' {
  const entries = Object.entries(CARRERAS_POR_UNIDAD) as Array<[UnidadAcademica, string[]]>;
  const match = entries.find(([, carreras]) => carreras.includes(carrera));
  return match?.[0] ?? '';
}

export default function PerfilAcademicoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadAcademica | ''>('');
  const [selectedDeporte, setSelectedDeporte] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const loadExistingData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: existing } = await supabase
        .from('academic_data')
        .select('carrera, anio, deporte, posicion, frecuencia_practicas_semana, horas_practica, frecuencia_competencias')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) return;

      const unidad = findUnidadByCarrera(existing.carrera ?? '');
      setSelectedUnidad(unidad);
      setSelectedDeporte(existing.deporte ?? '');

      reset({
        unidad_academica: unidad,
        carrera: existing.carrera ?? '',
        anio: String(existing.anio ?? ''),
        deporte: existing.deporte ?? '',
        posicion: existing.posicion ?? '',
        frecuencia_practicas_semana: String(existing.frecuencia_practicas_semana ?? ''),
        horas_practica: String(existing.horas_practica ?? ''),
        frecuencia_competencias: existing.frecuencia_competencias ?? '',
      });
    };

    loadExistingData();
  // supabase and router are stable for this component lifecycle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setServerError('');

    const anio = parseInt(data.anio, 10);
    const frecuenciaPracticas = parseInt(data.frecuencia_practicas_semana, 10);
    const horasPractica = parseFloat(data.horas_practica);

    if (isNaN(anio) || anio < 1 || anio > MAX_ANIO) {
      setError('anio', { message: 'Año inválido' });
      return;
    }
    if (data.deporte !== 'hockey' && data.deporte !== 'basquet') {
      setError('deporte', { message: 'Selecciona un deporte válido' });
      return;
    }

    const posicionesValidas = POSICIONES_POR_DEPORTE[data.deporte] ?? [];
    if (!data.posicion.trim()) {
      setError('posicion', { message: 'Selecciona tu posición en el equipo' });
      return;
    }
    if (!posicionesValidas.includes(data.posicion)) {
      setError('posicion', { message: 'Selecciona una posición válida' });
      return;
    }

    if (isNaN(frecuenciaPracticas) || frecuenciaPracticas < 1 || frecuenciaPracticas > 7) {
      setError('frecuencia_practicas_semana', { message: 'Entre 1 y 7 días' });
      return;
    }
    if (isNaN(horasPractica) || horasPractica < 0.5 || horasPractica > 10) {
      setError('horas_practica', { message: 'Entre 0.5 y 10 horas' });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error: academicError } = await supabase.from('academic_data').upsert(
      {
        user_id: user.id,
        carrera: data.carrera,
        anio,
        deporte: data.deporte,
        posicion: data.posicion,
        frecuencia_practicas_semana: frecuenciaPracticas,
        horas_practica: horasPractica,
        frecuencia_competencias: data.frecuencia_competencias,
      },
      { onConflict: 'user_id' },
    );

    if (academicError) {
      setServerError('Error al guardar los datos académicos. Intente nuevamente.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ academic_completed: true })
      .eq('user_id', user.id);

    if (profileError) {
      setServerError('Error al actualizar el perfil. Intente nuevamente.');
      return;
    }

    router.push(isEditMode ? '/perfil' : '/encuesta-psicologica');
    router.refresh();
  };

  const carrerasDisponibles =
    selectedUnidad && selectedUnidad in CARRERAS_POR_UNIDAD
      ? CARRERAS_POR_UNIDAD[selectedUnidad as UnidadAcademica]
      : [];

  const posicionesDisponibles = selectedDeporte ? (POSICIONES_POR_DEPORTE[selectedDeporte] ?? []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-10 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                  2
                </div>
                <span className="text-sm text-gray-500">Fase 2 de 3</span>
              </div>

              <Link
                href={isEditMode ? '/perfil' : '/perfil-fisico'}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                ← Volver
              </Link>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-700 rounded-full" style={{ width: '66%' }} />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900">Datos Académicos y Deportivos</h2>
            <p className="mt-1 text-sm text-gray-500">Completa tu perfil deportivo en la UCC.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Select
              id="unidad_academica"
              label="Unidad Académica"
              error={errors.unidad_academica?.message}
              options={[
                { value: '', label: 'Selecciona tu unidad académica' },
                ...UNIDADES_ACADEMICAS.map((u) => ({ value: u, label: u })),
              ]}
              {...register('unidad_academica', {
                onChange: (e) => {
                  setSelectedUnidad(e.target.value as UnidadAcademica | '');
                  setValue('carrera', '');
                },
              })}
            />

            <Select
              id="carrera"
              label="Carrera"
              error={errors.carrera?.message}
              disabled={carrerasDisponibles.length === 0}
              options={[
                {
                  value: '',
                  label:
                    carrerasDisponibles.length === 0
                      ? 'Primero selecciona una unidad académica'
                      : 'Selecciona tu carrera',
                },
                ...carrerasDisponibles.map((c) => ({ value: c, label: c })),
              ]}
              {...register('carrera')}
            />

            <Select
              id="anio"
              label="Año de cursada"
              error={errors.anio?.message}
              options={[
                { value: '', label: 'Selecciona el año' },
                { value: '1', label: '1° Año' },
                { value: '2', label: '2° Año' },
                { value: '3', label: '3° Año' },
                { value: '4', label: '4° Año' },
                { value: '5', label: '5° Año' },
              ]}
              {...register('anio')}
            />

            <Select
              id="deporte"
              label="Deporte"
              error={errors.deporte?.message}
              options={[
                { value: '', label: 'Selecciona tu deporte' },
                { value: 'hockey', label: 'Hockey' },
                { value: 'basquet', label: 'Básquet' },
              ]}
              {...register('deporte', {
                onChange: (e) => {
                  setSelectedDeporte(e.target.value);
                  setValue('posicion', '');
                },
              })}
            />

            <Select
              id="posicion"
              label="Posición en el equipo"
              error={errors.posicion?.message}
              disabled={posicionesDisponibles.length === 0}
              options={[
                {
                  value: '',
                  label:
                    posicionesDisponibles.length === 0
                      ? 'Primero selecciona un deporte'
                      : 'Selecciona tu posición',
                },
                ...posicionesDisponibles.map((p) => ({ value: p, label: p })),
              ]}
              {...register('posicion')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                id="frecuencia_practicas_semana"
                label="Prácticas por semana"
                error={errors.frecuencia_practicas_semana?.message}
                options={[
                  { value: '', label: 'Selecciona' },
                  { value: '1', label: '1 día' },
                  { value: '2', label: '2 días' },
                  { value: '3', label: '3 días' },
                  { value: '4', label: '4 días' },
                  { value: '5', label: '5 días' },
                  { value: '6', label: '6 días' },
                  { value: '7', label: '7 días' },
                ]}
                {...register('frecuencia_practicas_semana')}
              />
              <Select
                id="horas_practica"
                label="Horas por práctica"
                error={errors.horas_practica?.message}
                options={[
                  { value: '', label: 'Selecciona' },
                  { value: '0.5', label: '0.5 h' },
                  { value: '1', label: '1 h' },
                  { value: '1.5', label: '1.5 h' },
                  { value: '2', label: '2 h' },
                  { value: '2.5', label: '2.5 h' },
                  { value: '3', label: '3 h' },
                  { value: '3.5', label: '3.5 h' },
                  { value: '4', label: '4 h' },
                ]}
                {...register('horas_practica')}
              />
            </div>

            <Select
              id="frecuencia_competencias"
              label="Frecuencia de competencias"
              error={errors.frecuencia_competencias?.message}
              options={[
                { value: '', label: 'Selecciona la frecuencia' },
                ...FRECUENCIA_COMPETENCIAS_OPTIONS.map((f) => ({ value: f, label: f })),
              ]}
              {...register('frecuencia_competencias')}
            />

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              {isEditMode ? 'Guardar cambios' : 'Guardar y Continuar →'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
