'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { calcularPerfilNutricional } from '@/lib/calculations';
import { ActivityFactor } from '@/types';
import { birthDateRange, validateFechaNacimiento } from '@/lib/dates';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const ACTIVITY_VALUES = [1.2, 1.375, 1.55, 1.725] as const;

const schema = z.object({
  peso_kg: z.string().min(1, 'Ingresa tu peso'),
  altura_cm: z.string().min(1, 'Ingresa tu altura'),
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .superRefine((v, ctx) => {
      const msg = validateFechaNacimiento(v);
      if (msg) ctx.addIssue({ code: 'custom', message: msg });
    }),
  sexo: z.string().min(1, 'Selecciona el sexo'),
  factor_actividad: z.string().min(1, 'Selecciona un factor de actividad'),
});

type FormData = z.infer<typeof schema>;

export interface PhysicalInitialData {
  peso_kg?: number | string | null;
  altura_cm?: number | string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  factor_actividad?: number | string | null;
}

interface PhysicalFormProps {
  initialData?: PhysicalInitialData | null;
  onSaved?: () => void;
  submitLabel?: string;
}

const actividadOptions = [
  { value: '', label: 'Selecciona tu nivel de actividad' },
  { value: '1.2', label: 'Sedentario – sin ejercicio' },
  { value: '1.375', label: 'Ligero – ejercicio suave 1-3 días/semana' },
  { value: '1.55', label: 'Moderado – ejercicio moderado 3-5 días/semana' },
  { value: '1.725', label: 'Intenso – ejercicio intenso 6-7 días/semana' },
];

export default function PhysicalForm({ initialData, onSaved, submitLabel }: PhysicalFormProps) {
  const supabase = createClient();
  const [serverError, setServerError] = useState('');
  const { todayISO, minISO } = birthDateRange();

  const defaultValues: FormData = {
    peso_kg: initialData?.peso_kg != null ? String(initialData.peso_kg) : '',
    altura_cm: initialData?.altura_cm != null ? String(initialData.altura_cm) : '',
    fecha_nacimiento: initialData?.fecha_nacimiento ?? '',
    sexo: initialData?.sexo ?? '',
    factor_actividad:
      initialData?.factor_actividad != null ? String(initialData.factor_actividad) : '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialData?.peso_kg,
    initialData?.altura_cm,
    initialData?.fecha_nacimiento,
    initialData?.sexo,
    initialData?.factor_actividad,
  ]);

  const onSubmit = async (data: FormData) => {
    setServerError('');

    const pesoKg = parseFloat(data.peso_kg);
    const alturaCm = parseFloat(data.altura_cm);
    const factorActividad = parseFloat(data.factor_actividad);
    const sexo = data.sexo as 'M' | 'F';

    if (isNaN(pesoKg) || pesoKg < 20 || pesoKg > 300) {
      setError('peso_kg', { message: 'Peso debe estar entre 20 y 300 kg' });
      return;
    }
    if (isNaN(alturaCm) || alturaCm < 100 || alturaCm > 250) {
      setError('altura_cm', { message: 'Altura debe estar entre 100 y 250 cm' });
      return;
    }
    if (!ACTIVITY_VALUES.includes(factorActividad as (typeof ACTIVITY_VALUES)[number])) {
      setError('factor_actividad', { message: 'Selecciona un factor de actividad válido' });
      return;
    }
    if (sexo !== 'M' && sexo !== 'F') {
      setError('sexo', { message: 'Selecciona el sexo' });
      return;
    }
    const dateMsg = validateFechaNacimiento(data.fecha_nacimiento);
    if (dateMsg) {
      setError('fecha_nacimiento', { message: dateMsg });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setServerError('Sesión expirada. Iniciá sesión de nuevo.');
      return;
    }

    const nutricional = calcularPerfilNutricional(
      sexo,
      pesoKg,
      alturaCm,
      data.fecha_nacimiento,
      factorActividad as ActivityFactor,
    );

    const { error: physicalError } = await supabase.from('physical_data').upsert(
      {
        user_id: user.id,
        peso_kg: pesoKg,
        altura_cm: alturaCm,
        fecha_nacimiento: data.fecha_nacimiento,
        sexo,
        factor_actividad: factorActividad,
        ...nutricional,
      },
      { onConflict: 'user_id' },
    );

    if (physicalError) {
      setServerError('Error al guardar el perfil físico. Intente nuevamente.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ physical_completed: true })
      .eq('user_id', user.id);
    if (profileError) {
      setServerError('Error al actualizar el perfil. Intente nuevamente.');
      return;
    }

    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="peso_kg"
          label="Peso (kg)"
          type="number"
          step="0.1"
          placeholder="70"
          error={errors.peso_kg?.message}
          onKeyDown={(e) => { if (e.key === ',') e.preventDefault(); }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (text.includes(',')) {
              e.preventDefault();
              const fixed = text.replace(/,/g, '.');
              document.execCommand('insertText', false, fixed);
            }
          }}
          {...register('peso_kg')}
        />
        <Input
          id="altura_cm"
          label="Altura (cm)"
          type="number"
          placeholder="170"
          error={errors.altura_cm?.message}
          {...register('altura_cm')}
        />
      </div>

      <Input
        id="fecha_nacimiento"
        label="Fecha de Nacimiento"
        type="date"
        min={minISO}
        max={todayISO}
        error={errors.fecha_nacimiento?.message}
        {...register('fecha_nacimiento')}
      />

      <Select
        id="sexo"
        label="Sexo"
        error={errors.sexo?.message}
        options={[
          { value: '', label: 'Selecciona tu sexo' },
          { value: 'M', label: 'Masculino' },
          { value: 'F', label: 'Femenino' },
        ]}
        {...register('sexo')}
      />

      <Select
        id="factor_actividad"
        label="Nivel de Actividad Física"
        error={errors.factor_actividad?.message}
        options={actividadOptions}
        {...register('factor_actividad')}
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
