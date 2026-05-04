'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { calcularPerfilNutricional } from '@/lib/calculations';
import { ActivityFactor } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const ACTIVITY_VALUES = [1.2, 1.375, 1.55, 1.725] as const;

const schema = z.object({
  peso_kg: z.string().min(1, 'Ingresa tu peso'),
  altura_cm: z.string().min(1, 'Ingresa tu altura'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  sexo: z.string().min(1, 'Selecciona el sexo'),
  factor_actividad: z.string().min(1, 'Selecciona un factor de actividad'),
});

type FormData = z.infer<typeof schema>;

const actividadOptions = [
  { value: '', label: 'Selecciona tu nivel de actividad' },
  { value: 1.2, label: 'Sedentario – sin ejercicio' },
  { value: 1.375, label: 'Ligero – ejercicio suave 1-3 días/semana' },
  { value: 1.55, label: 'Moderado – ejercicio moderado 3-5 días/semana' },
  { value: 1.725, label: 'Intenso – ejercicio intenso 6-7 días/semana' },
];

export default function PerfilFisicoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const nutricional = calcularPerfilNutricional(
      sexo,
      pesoKg,
      alturaCm,
      data.fecha_nacimiento,
      factorActividad as ActivityFactor,
    );

    const { error: physicalError } = await supabase.from('physical_data').upsert({
      user_id: user.id,
      peso_kg: pesoKg,
      altura_cm: alturaCm,
      fecha_nacimiento: data.fecha_nacimiento,
      sexo,
      factor_actividad: factorActividad,
      ...nutricional,
    });

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

    // Check role to determine next step
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role === 'deportista_ucc') {
      router.push('/perfil-academico');
    } else {
      router.push('/home');
    }
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              1
            </div>
            <span className="text-sm text-gray-500">Fase 1 de 3</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Perfil Físico</h2>
          <p className="mt-1 text-sm text-gray-500">
            Esta información nos permite calcular tus requerimientos nutricionales personalizados.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="peso_kg"
              label="Peso (kg)"
              type="number"
              step="0.1"
              placeholder="70"
              error={errors.peso_kg?.message}
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
            Guardar y Continuar →
          </Button>
        </form>
      </div>
    </main>
  );
}
