'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AcademicForm, { AcademicInitialData } from '@/components/profile/AcademicForm';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';

export default function PerfilAcademicoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [initial, setInitial] = useState<AcademicInitialData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('academic_data')
        .select(
          'unidad_academica, carrera, anio, deporte, posicion, frecuencia_practicas_semana, horas_practica, frecuencia_competencias',
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setInitial(data ?? null);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const handleSaved = () => {
    router.push('/encuesta-psicologica');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo NutriScan" className="w-8 h-8 text-white" />
          <img src="/tituloNutriScanNEGRO.png" alt="NutriScan" className="h-6" />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-10 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <OnboardingProgress step={2} />
            <Link
              href="/perfil-fisico"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              ← Volver a la fase anterior
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Datos Académicos y Deportivos</h2>
            <p className="mt-1 text-sm text-gray-500">Completa tu perfil deportivo en la UCC.</p>
          </div>

          {loaded ? (
            <AcademicForm initialData={initial} onSaved={handleSaved} />
          ) : (
            <p className="text-sm text-gray-500">Cargando…</p>
          )}
        </div>
      </main>
    </div>
  );
}
