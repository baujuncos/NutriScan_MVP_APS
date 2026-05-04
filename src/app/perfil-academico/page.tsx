'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const schema = z.object({
  carrera: z.string().min(2, 'Ingresa tu carrera'),
  anio: z.string().min(1, 'Selecciona el año'),
  deporte: z.string().min(1, 'Selecciona un deporte'),
  posicion: z.string().min(1, 'Ingresa tu posición'),
  frecuencia_practicas_semana: z.string().min(1, 'Ingresa la frecuencia de prácticas'),
  horas_practica: z.string().min(1, 'Ingresa las horas de práctica'),
  frecuencia_competencias: z.string().min(1, 'Ingresa la frecuencia de competencias'),
});

type FormData = z.infer<typeof schema>;

export default function PerfilAcademicoPage() {
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

    const anio = parseInt(data.anio, 10);
    const frecuenciaPracticas = parseInt(data.frecuencia_practicas_semana, 10);
    const horasPractica = parseFloat(data.horas_practica);

    if (isNaN(anio) || anio < 1 || anio > 6) {
      setError('anio', { message: 'Año inválido' });
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error: academicError } = await supabase.from('academic_data').upsert({
      user_id: user.id,
      carrera: data.carrera,
      anio,
      deporte: data.deporte,
      posicion: data.posicion,
      frecuencia_practicas_semana: frecuenciaPracticas,
      horas_practica: horasPractica,
      frecuencia_competencias: data.frecuencia_competencias,
    });

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

    router.push('/encuesta-psicologica');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              2
            </div>
            <span className="text-sm text-gray-500">Fase 2 de 3</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Datos Académicos y Deportivos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Completa tu perfil deportivo en la UCC.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            id="carrera"
            label="Carrera"
            placeholder="Educación Física"
            error={errors.carrera?.message}
            {...register('carrera')}
          />

          <Select
            id="anio"
            label="Año en curso"
            error={errors.anio?.message}
            options={[
              { value: '', label: 'Selecciona el año' },
              { value: 1, label: '1° año' },
              { value: 2, label: '2° año' },
              { value: 3, label: '3° año' },
              { value: 4, label: '4° año' },
              { value: 5, label: '5° año' },
              { value: 6, label: '6° año' },
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
            {...register('deporte')}
          />

          <Input
            id="posicion"
            label="Posición en el equipo"
            placeholder="ej. Defensa, Alero, Pivote..."
            error={errors.posicion?.message}
            {...register('posicion')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="frecuencia_practicas_semana"
              label="Prácticas por semana"
              type="number"
              placeholder="3"
              error={errors.frecuencia_practicas_semana?.message}
              {...register('frecuencia_practicas_semana')}
            />
            <Input
              id="horas_practica"
              label="Horas por práctica"
              type="number"
              step="0.5"
              placeholder="1.5"
              error={errors.horas_practica?.message}
              {...register('horas_practica')}
            />
          </div>

          <Input
            id="frecuencia_competencias"
            label="Frecuencia de competencias"
            placeholder="ej. 1 vez por semana, cada 2 semanas..."
            error={errors.frecuencia_competencias?.message}
            {...register('frecuencia_competencias')}
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
