'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';

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
  'Ciencias Políticas y RRII': ['Ciencias Políticas', 'RRII', 'Gestión Pública', 'Tec. en Gestión Pública'],
  'Ciencias Agropecuarias': ['Ing. Agronómica', 'Veterinaria', 'Tec. en Producción Agropec.', 'Tec. en Biotec'],
  'Ciencias de la Salud': [
    'Medicina', 'Odontología', 'Bioquímica', 'Farmacia', 'Nutrición', 'Psicología',
    'Kinesiología', 'Terapia Ocupacional', 'Enfermería', 'Tec. Alimentos', 'Instr. Quirúrgica', 'Cosmetología',
  ],
  'Ciencias Económicas': [
    'Contador', 'Adm. Empresas', 'Adm. Negocios Digitales', 'Mkt. Digital', 'Gestión Gerencial', 'Adm. Agronegocios',
  ],
  'Derecho y Sociales': ['Abogacía', 'Notariado', 'Comunicación Estratégica'],
  Educación: ['Cs. de la Educación', 'Psicopedagogía', 'Prof. en Educación', 'Gestión Educ.', 'Educación Inicial'],
  'Filosofía y Humanidades': ['Filosofía', 'Prof. en Filosofía', 'Filosofía y Humanidades'],
  Ingeniería: [
    'Ing. Informática', 'Ing. Computación', 'Ing. Electrónica', 'Ing. Civil', 'Ing. Industrial', 'Ing. Mecánica',
    'Ing. en Sistemas', 'IA y Ciencia de Datos', 'Bioinformática', 'Tec. Ciencia de Datos', 'Tec. Desarrollo SW',
  ],
  Teología: ['Teología', 'Prof. en Teología', 'Bach. Eclesiástico'],
};

export const POSICION_DESCONOCIDA = 'No lo sé';

const POSICIONES_POR_DEPORTE: Record<string, string[]> = {
  hockey: ['Delantera', 'Defensa', 'Mediocampista', 'Arquera', POSICION_DESCONOCIDA],
  basquet: ['Base', 'Escolta', 'Alero', 'Pivot', 'Ala-Pivot', POSICION_DESCONOCIDA],
};

const FRECUENCIA_COMPETENCIAS_OPTIONS = [
  'Todas las semanas',
  'Más de una vez por semana',
  'Cada dos semanas',
  'Una vez por mes',
];

const MIN_YEAR = 1990;
const CURRENT_YEAR = new Date().getFullYear();

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

export interface AcademicInitialData {
  unidad_academica?: string | null;
  carrera?: string | null;
  anio?: number | string | null;
  deporte?: string | null;
  posicion?: string | null;
  frecuencia_practicas_semana?: number | string | null;
  horas_practica?: number | string | null;
  frecuencia_competencias?: string | null;
}

interface AcademicFormProps {
  initialData?: AcademicInitialData | null;
  onSaved?: () => void;
  submitLabel?: string;
}

function isKnownUnidad(value: string): value is UnidadAcademica {
  return (UNIDADES_ACADEMICAS as readonly string[]).includes(value);
}

export default function AcademicForm({ initialData, onSaved, submitLabel }: AcademicFormProps) {
  const supabase = createClient();
  const [serverError, setServerError] = useState('');

  const defaultValues: FormData = {
    unidad_academica: initialData?.unidad_academica ?? '',
    carrera: initialData?.carrera ?? '',
    anio: initialData?.anio != null ? String(initialData.anio) : '',
    deporte: initialData?.deporte ?? '',
    posicion: initialData?.posicion ?? '',
    frecuencia_practicas_semana:
      initialData?.frecuencia_practicas_semana != null
        ? String(initialData.frecuencia_practicas_semana)
        : '',
    horas_practica:
      initialData?.horas_practica != null ? String(initialData.horas_practica) : '',
    frecuencia_competencias: initialData?.frecuencia_competencias ?? '',
  };

  const [selectedUnidad, setSelectedUnidad] = useState<UnidadAcademica | ''>(
    isKnownUnidad(defaultValues.unidad_academica) ? defaultValues.unidad_academica : '',
  );
  const [selectedDeporte, setSelectedDeporte] = useState<string>(defaultValues.deporte);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUnidad(isKnownUnidad(defaultValues.unidad_academica) ? defaultValues.unidad_academica : '');
    setSelectedDeporte(defaultValues.deporte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialData?.unidad_academica,
    initialData?.carrera,
    initialData?.anio,
    initialData?.deporte,
    initialData?.posicion,
    initialData?.frecuencia_practicas_semana,
    initialData?.horas_practica,
    initialData?.frecuencia_competencias,
  ]);

  const onSubmit = async (data: FormData) => {
    setServerError('');

    const anio = parseInt(data.anio, 10);
    const frecuenciaPracticas = parseInt(data.frecuencia_practicas_semana, 10);
    const horasPractica = parseFloat(data.horas_practica);

    if (isNaN(anio) || anio < MIN_YEAR || anio > CURRENT_YEAR) {
      setError('anio', { message: `Año inválido (entre ${MIN_YEAR} y ${CURRENT_YEAR})` });
      return;
    }
    if (data.deporte !== 'hockey' && data.deporte !== 'basquet') {
      setError('deporte', { message: 'Selecciona un deporte válido' });
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
    const validPositions = POSICIONES_POR_DEPORTE[data.deporte] ?? [];
    if (!validPositions.includes(data.posicion)) {
      setError('posicion', { message: 'Selecciona una posición válida' });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setServerError('Sesión expirada. Iniciá sesión de nuevo.');
      return;
    }

    const { error: academicError } = await supabase.from('academic_data').upsert(
      {
        user_id: user.id,
        unidad_academica: data.unidad_academica,
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

    onSaved?.();
  };

  const carrerasDisponibles =
    selectedUnidad && selectedUnidad in CARRERAS_POR_UNIDAD
      ? CARRERAS_POR_UNIDAD[selectedUnidad]
      : [];
  const posicionesDisponibles = selectedDeporte
    ? (POSICIONES_POR_DEPORTE[selectedDeporte] ?? [])
    : [];

  return (
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
            const v = e.target.value;
            setSelectedUnidad(isKnownUnidad(v) ? v : '');
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

      <Input
        id="anio"
        label="Año de ingreso a la facultad"
        error={errors.anio?.message}
        type="number"
        min={MIN_YEAR}
        max={CURRENT_YEAR}
        step={1}
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
        {submitLabel ?? 'Guardar y Continuar →'}
      </Button>
    </form>
  );
}
